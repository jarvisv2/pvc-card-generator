const enc = new TextEncoder();
const dec = new TextDecoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const html = (b, status = 200) => new Response(b, { status, headers: { 'content-type': 'text/html;charset=utf-8', 'cache-control': 'no-store' } });
const json = (o, status = 200, h = {}) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...h } });

const ist = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }) + ' IST' : '');

async function placeName(lat, lng) {
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&accept-language=en&lat=' + lat + '&lon=' + lng, { headers: { 'user-agent': 'site-login-monitor/1.0' }, signal: AbortSignal.timeout(4000) });
    return String((await r.json()).display_name || '').slice(0, 240);
  } catch { return ''; }
}

async function insertVisit(env, request, site, email, kind, gps) {
  const cf = request.cf || {};
  await env.DB.prepare('INSERT INTO site_visits(site,email,kind,ts,ip,country,region,city,lat,lng,gps_lat,gps_lng,gps_acc,place,ua) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
    .bind(site, email, kind, new Date().toISOString(), request.headers.get('cf-connecting-ip') || '', cf.country || '', cf.region || '', cf.city || '',
      String(cf.latitude ?? ''), String(cf.longitude ?? ''), gps ? gps.lat : null, gps ? gps.lng : null, gps ? gps.acc : null, gps ? gps.place : '',
      (request.headers.get('user-agent') || '').slice(0, 200)).run();
}

// One row per visit, at most one every 5 minutes per person, so refreshes do not flood the log
async function logVisit(env, request, site, email) {
  const last = await env.DB.prepare('SELECT ts FROM site_visits WHERE site=? AND email=? ORDER BY id DESC LIMIT 1').bind(site, email).first();
  if (last && Date.now() - Date.parse(last.ts) < 300000) return;
  await insertVisit(env, request, site, email, 'visit', null);
}

async function saveLocation(request, env, site, email) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'bad origin' }, 403);
  let b = {};
  try { b = await request.json(); } catch {}
  const lat = Number(b.lat), lng = Number(b.lng), acc = Number(b.acc);
  const ok = b.lat != null && b.lng != null && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  const gps = ok ? { lat, lng, acc: Number.isFinite(acc) ? acc : null, place: await placeName(lat, lng) } : null;
  await insertVisit(env, request, site, email, 'signin', gps);
  return json({ ok: true });
}

const hmacKey = (secret) => crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);

async function makeSession(env, email) {
  const p = b64u(enc.encode(JSON.stringify({ e: email, x: Date.now() + 7 * 864e5 })));
  const sig = await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET), enc.encode(p));
  return p + '.' + b64u(sig);
}

// Returns the email only if the cookie is valid AND the user is still "approved" in D1
async function readSession(env, request, site) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)sid=([^;]+)/);
  if (!m) return null;
  const [p, s] = m[1].split('.');
  if (!p || !s) return null;
  try {
    const ok = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), unb64u(s), enc.encode(p));
    if (!ok) return null;
    const d = JSON.parse(dec.decode(unb64u(p)));
    if (d.x < Date.now()) return null;
    const row = await env.DB.prepare('SELECT status FROM site_users WHERE site=? AND email=?').bind(site, d.e).first();
    return row && row.status === 'approved' ? d.e : null;
  } catch { return null; }
}

async function verifyGoogle(env, idToken) {
  const [h, p, s] = idToken.split('.');
  const head = JSON.parse(dec.decode(unb64u(h)));
  const claims = JSON.parse(dec.decode(unb64u(p)));
  const jwks = await (await fetch('https://www.googleapis.com/oauth2/v3/certs', { cf: { cacheTtl: 3600, cacheEverything: true } })).json();
  const jwk = jwks.keys.find((k) => k.kid === head.kid);
  if (!jwk || head.alg !== 'RS256') throw new Error('bad key');
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  if (!(await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, unb64u(s), enc.encode(h + '.' + p)))) throw new Error('bad signature');
  const issOk = ['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss);
  if (!issOk || claims.aud !== env.GOOGLE_CLIENT_ID || claims.exp * 1000 < Date.now() || !claims.email_verified) throw new Error('bad claims');
  return { email: claims.email.toLowerCase(), name: claims.name || '' };
}

async function authGoogle(request, env) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return json({ error: 'bad origin' }, 403);
  let user;
  try { user = await verifyGoogle(env, (await request.json()).credential); }
  catch { return json({ error: 'Google verification failed' }, 401); }

  const site = new URL(request.url).hostname;
  const owner = user.email === env.OWNER_EMAIL.toLowerCase();
  const now = new Date().toISOString();
  await env.DB.prepare('INSERT INTO site_users(site,email,name,status,created_at,last_login) VALUES(?1,?2,?3,?4,?5,?5) ON CONFLICT(site,email) DO UPDATE SET name=?3, last_login=?5')
    .bind(site, user.email, user.name, owner ? 'approved' : 'pending', now).run();
  if (owner) await env.DB.prepare("UPDATE site_users SET status='approved' WHERE site=? AND email=?").bind(site, user.email).run();
  const { status } = await env.DB.prepare('SELECT status FROM site_users WHERE site=? AND email=?').bind(site, user.email).first();

  const cf = request.cf || {};
  await env.DB.prepare('INSERT INTO site_logins(site,email,name,result,ip,country,ua,ts) VALUES(?,?,?,?,?,?,?,?)')
    .bind(site, user.email, user.name, status, request.headers.get('cf-connecting-ip') || '', cf.country || '', (request.headers.get('user-agent') || '').slice(0, 200), now).run();

  const h = {};
  if (status === 'approved') h['set-cookie'] = `sid=${await makeSession(env, user.email)}; Path=/; Max-Age=604800; Secure; HttpOnly; SameSite=Lax`;
  return json({ status }, 200, h);
}

function loginPage(env) {
  const name = env.SITE_NAME || 'Card Maker Pro';
  const big = name.length <= 16;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign in · ${esc(name)}</title><style>
:root{--bg:#070a14;--tx:#eaf0ff;--mut:#7f8db0;--blue:#1769ff;--vio:#7c5cff;--cy:#22d3ee;--pink:#ff4fd8;--good:#3ddc97;--warn:#ffb454;--bad:#ff6b6b;--ice:#9cc2ff;--mono:ui-monospace,"JetBrains Mono","Fira Code",Consolas,monospace}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--bg);color:var(--tx);font-family:Inter,"Segoe UI",Arial,sans-serif;overflow:hidden}
.aurora{position:fixed;inset:-20%;filter:blur(80px);opacity:.45;pointer-events:none}
.aurora i{position:absolute;border-radius:50%;width:46vmax;height:46vmax}
.a1{background:var(--blue);left:-4%;top:-8%;animation:f1 19s ease-in-out infinite alternate}
.a2{background:var(--vio);right:-8%;top:8%;animation:f2 23s ease-in-out infinite alternate}
.a3{background:var(--cy);left:28%;bottom:-30%;opacity:.55;animation:f3 21s ease-in-out infinite alternate}
.a4{background:var(--pink);right:18%;bottom:-22%;width:30vmax;height:30vmax;opacity:.35;animation:f1 26s ease-in-out infinite alternate-reverse}
@keyframes f1{to{transform:translate(12vw,9vh) scale(1.15)}}@keyframes f2{to{transform:translate(-10vw,12vh) scale(.9)}}@keyframes f3{to{transform:translate(8vw,-10vh) scale(1.2)}}
.grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px);background-size:46px 46px;-webkit-mask-image:radial-gradient(ellipse at center,#000 20%,transparent 72%);mask-image:radial-gradient(ellipse at center,#000 20%,transparent 72%);animation:drift 30s linear infinite}
@keyframes drift{to{background-position:46px 46px}}
.glow{position:fixed;width:460px;height:460px;border-radius:50%;background:radial-gradient(closest-side,rgba(124,92,255,.28),transparent);left:var(--x,50%);top:var(--y,45%);transform:translate(-50%,-50%);pointer-events:none;transition:left .9s ease-out,top .9s ease-out}
@property --a{syntax:"<angle>";initial-value:0deg;inherits:false}
@keyframes spin{to{--a:360deg}}@keyframes rise{from{opacity:0;transform:translateY(24px) scale(.97)}to{opacity:1;transform:none}}
@keyframes blink{50%{opacity:0}}@keyframes pulse{50%{box-shadow:0 0 38px rgba(124,92,255,.85)}}@keyframes pop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}
.tilt{transform:perspective(900px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));transition:transform .25s ease-out}
.card{position:relative;width:min(410px,92vw);padding:38px 28px 30px;border-radius:24px;text-align:center;background:rgba(10,14,30,.72);-webkit-backdrop-filter:blur(20px);backdrop-filter:blur(20px);box-shadow:0 30px 90px rgba(0,0,0,.6);animation:rise .9s cubic-bezier(.2,.8,.2,1) both}
.card::before{content:"";position:absolute;inset:0;border-radius:24px;padding:1.5px;background:conic-gradient(from var(--a),rgba(255,255,255,.08) 0 52%,var(--blue) 66%,var(--vio) 76%,var(--pink) 85%,var(--cy) 93%,rgba(255,255,255,.08));-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:spin 8s linear infinite;pointer-events:none}
.mk{width:58px;height:58px;margin:0 auto 22px;border-radius:17px;display:grid;place-items:center;background:linear-gradient(135deg,var(--blue),var(--vio) 60%,var(--pink));box-shadow:0 0 26px rgba(124,92,255,.55);animation:pulse 4s ease-in-out infinite}
h1{margin:0;font-family:var(--mono);font-weight:700;font-size:clamp(20px,6.2vw,29px);letter-spacing:-.5px;min-height:1.3em;overflow-wrap:anywhere}
.p{color:var(--vio)}.t{color:var(--tx)}.q{color:var(--cy)}.c{color:var(--mut)}
.sub{margin:10px 0 0;font-family:var(--mono);font-size:13.5px;min-height:1.5em;color:var(--mut)}
.caret{display:inline-block;width:.5em;height:1.05em;background:var(--ice);vertical-align:-.15em;margin-left:3px;animation:blink 1s steps(1) infinite}
.gw{display:flex;justify-content:center;margin-top:28px;min-height:44px;opacity:0;transform:translateY(10px);pointer-events:none;transition:opacity .6s ease,transform .6s ease}
.gw.on{opacity:1;transform:none;pointer-events:auto}.gw.busy{opacity:.35;pointer-events:none}
.m{display:none;align-items:center;justify-content:center;gap:9px;margin:18px auto 0;padding:9px 14px;border-radius:12px;max-width:100%;font-size:13px;line-height:1.45;text-align:left;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);color:var(--mut)}
.m.show{display:flex;animation:pop .4s ease both}.m i{flex:none;width:8px;height:8px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
.m.w{color:var(--warn)}.m.g{color:var(--good)}.m.b{color:var(--bad)}.m.i{color:var(--ice)}.m.i i{animation:blink 1s infinite}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}.gw{opacity:1;transform:none}}
</style></head><body><div class="aurora"><i class="a1"></i><i class="a2"></i><i class="a3"></i><i class="a4"></i></div><div class="grid"></div><div class="glow"></div>
<div class="tilt" id="tilt"><main class="card"><div class="mk"><svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M3 10h18M7 15h4"/></svg></div>
<h1 id="ti" data-name="${esc(name)}" aria-label="${esc(name)}" style="font-size:clamp(17px,${big ? '6.2vw' : '5vw'},${big ? 29 : 23}px)"></h1><p class="sub" id="su"></p>
<div class="gw" id="gw"><div id="g_id_onload" data-client_id="${esc(env.GOOGLE_CLIENT_ID)}" data-callback="onCred" data-auto_prompt="false"></div>
<div class="g_id_signin" data-type="standard" data-size="large" data-theme="filled_blue" data-text="signin_with" data-shape="pill" data-logo_alignment="left"></div></div>
<div class="m" id="msg" role="status"><i></i><span id="mt"></span></div><noscript><p class="sub">Turn on JavaScript to sign in.</p></noscript></main></div>
<script>
var ti=document.getElementById('ti'),su=document.getElementById('su'),gw=document.getElementById('gw'),msg=document.getElementById('msg'),mt=document.getElementById('mt');
var RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches,caret=document.createElement('span');caret.className='caret';
function type(el,tokens,speed,done){
  var i=0,j=0,cur=null;
  (function step(){
    if(i>=tokens.length){if(done)done();return}
    var tk=tokens[i];
    if(j===0){cur=document.createElement('span');cur.className=tk[1];el.appendChild(cur)}
    if(RM){cur.textContent=tk[0];i++;j=0;return step()}
    j++;cur.textContent=tk[0].slice(0,j);el.appendChild(caret);
    if(j>=tk[0].length){i++;j=0}
    setTimeout(step,speed+Math.random()*speed)
  })()
}
type(ti,[['<','p'],[ti.getAttribute('data-name'),'t'],[' />','q']],34,function(){
  type(su,[['// sign in to continue','c']],18,function(){gw.className='gw on'})
});
function setS(c,m){msg.className='m show '+c;mt.textContent=m}
function sendLoc(go){
  var done=false;
  function fin(b){if(done)return;done=true;fetch('/auth/location',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(b||{})}).catch(function(){}).then(go)}
  setTimeout(function(){fin(null)},12000);
  if(!navigator.geolocation)return fin(null);
  navigator.geolocation.getCurrentPosition(function(p){fin({lat:p.coords.latitude,lng:p.coords.longitude,acc:p.coords.accuracy})},function(){fin(null)},{enableHighAccuracy:true,timeout:10000,maximumAge:0})
}
window.onCred=function(r){
  gw.className='gw on busy';setS('i','Verifying your account...');
  fetch('/auth/google',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({credential:r.credential})})
  .then(function(x){return x.json()}).then(function(d){
    if(d.status==='approved'){setS('g','Signed in. Your browser may ask to share your location for the access log...');sendLoc(function(){location.href='/'});return}
    gw.className='gw on';
    if(d.status==='pending')setS('w','Your email is waiting for approval. Ask the site owner, then sign in again.');
    else if(d.status==='blocked')setS('b','This email does not have access.');
    else setS('b',d.error||'Sign-in failed. Please try again.')
  }).catch(function(){gw.className='gw on';setS('b','Network problem. Please try again.')})
};
var tl=document.getElementById('tilt'),root=document.documentElement.style;
document.addEventListener('mousemove',function(e){
  root.setProperty('--x',e.clientX+'px');root.setProperty('--y',e.clientY+'px');
  if(RM)return;var w=window.innerWidth,h=window.innerHeight;
  tl.style.setProperty('--ry',((e.clientX/w-.5)*8).toFixed(2)+'deg');tl.style.setProperty('--rx',((.5-e.clientY/h)*8).toFixed(2)+'deg')
});
</script><script src="https://accounts.google.com/gsi/client" async defer></script></body></html>`;
}

async function adminPage(env, site) {
  const users = (await env.DB.prepare("SELECT * FROM site_users WHERE site=? ORDER BY (status='pending') DESC, last_login DESC").bind(site).all()).results;
  const logs = (await env.DB.prepare('SELECT * FROM site_logins WHERE site=? ORDER BY id DESC LIMIT 100').bind(site).all()).results;
  const visits = (await env.DB.prepare('SELECT * FROM site_visits WHERE site=? ORDER BY id DESC LIMIT 100').bind(site).all()).results;
  const btn = (e, s, t) => `<button onclick="setS('${esc(e).replace(/'/g, '')}','${s}')">${t}</button>`;
  const rows = users.map((u) => `<tr><td>${esc(u.email)}<br><small>${esc(u.name)}</small></td><td><b class="${esc(u.status)}">${esc(u.status)}</b></td><td>${esc(ist(u.last_login))}</td><td>${btn(u.email, 'approved', 'Approve')} ${btn(u.email, 'blocked', 'Block')}</td></tr>`).join('');
  const lrows = logs.map((l) => `<tr><td>${esc(ist(l.ts))}</td><td>${esc(l.email)}</td><td>${esc(l.result)}</td><td>${esc(l.ip)}</td><td>${esc(l.country)}</td></tr>`).join('');
  const vrows = visits.map((v) => {
    const gps = v.gps_lat != null ? `<a href="https://www.google.com/maps?q=${esc(v.gps_lat)},${esc(v.gps_lng)}" target="_blank" rel="noopener">${esc(v.place || v.gps_lat + ', ' + v.gps_lng)}</a>` : 'not shared';
    return `<tr><td>${esc(ist(v.ts))}</td><td>${esc(v.email)}</td><td>${v.kind === 'signin' ? 'sign-in' : 'visit'}</td><td>${esc(v.ip)}</td><td>${esc(v.country)}</td><td>${esc([v.city, v.region].filter(Boolean).join(', '))}</td><td>${gps}</td></tr>`;
  }).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin</title><style>
body{font-family:Inter,Segoe UI,Arial,sans-serif;background:#eef4fb;color:#10243d;margin:0;padding:20px}h1,h2{color:#17345d}table{width:100%;border-collapse:collapse;background:#fff;margin-bottom:28px}
td,th{border:1px solid #d9e2ee;padding:8px;font-size:13px;text-align:left;vertical-align:top}.wrap{overflow-x:auto}button{padding:5px 10px;border:0;border-radius:6px;background:#1769ff;color:#fff;cursor:pointer}
.approved{color:#0a9b6f}.pending{color:#a96800}.blocked{color:#d92d20}</style></head><body>
<h1>Who can open ${esc(site)}</h1><p><a href="/">Open site</a> · <a href="/logout">Log out</a></p>
<h2>Users</h2><div class="wrap"><table><tr><th>Email</th><th>Status</th><th>Last sign-in</th><th>Action</th></tr>${rows}</table></div>
<h2>Recent visits</h2><div class="wrap"><table><tr><th>Time (IST)</th><th>Email</th><th>Type</th><th>IP</th><th>Country</th><th>Approx. place (from IP)</th><th>GPS location</th></tr>${vrows}</table></div>
<h2>Recent sign-ins</h2><div class="wrap"><table><tr><th>Time (IST)</th><th>Email</th><th>Result</th><th>IP</th><th>Country</th></tr>${lrows}</table></div>
<script>function setS(e,s){fetch('/admin/set',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:e,status:s})}).then(function(){location.reload()})}</script></body></html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const site = url.hostname;

    if (path === '/login') return html(loginPage(env));
    if (path === '/logout') return new Response(null, { status: 302, headers: { location: '/login', 'set-cookie': 'sid=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax' } });
    if (path === '/auth/google' && request.method === 'POST') {
      try { return await authGoogle(request, env); }
      catch (e) { return json({ error: String((e && e.message) || e) }, 500); }
    }

    const email = await readSession(env, request, site);
    if (!email) return request.method === 'GET' ? Response.redirect(url.origin + '/login', 302) : new Response('Login required', { status: 401 });

    if (path === '/auth/location' && request.method === 'POST') return saveLocation(request, env, site, email);

    if (path === '/admin' || path === '/admin/set') {
      if (email !== env.OWNER_EMAIL.toLowerCase()) return new Response('Not allowed', { status: 403 });
      if (path === '/admin') return html(await adminPage(env, site));
      if (request.method === 'POST' && request.headers.get('origin') === url.origin) {
        const { email: target, status } = await request.json();
        if (['approved', 'blocked', 'pending'].includes(status) && target.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) {
          await env.DB.prepare('UPDATE site_users SET status=? WHERE site=? AND email=?').bind(status, site, target).run();
        }
        return json({ ok: true });
      }
      return new Response('Bad request', { status: 400 });
    }
    if (request.method === 'GET' && (request.headers.get('accept') || '').includes('text/html')) {
      const job = logVisit(env, request, site, email).catch(() => {});
      if (ctx && ctx.waitUntil) ctx.waitUntil(job);
    }
    return env.ASSETS.fetch(request);
  },
};
