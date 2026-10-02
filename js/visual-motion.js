
/* HARDCORE ULTRA visual motion layer — does not alter application state. */
(() => {
  const app = document.querySelector('.app');
  if (!app) return;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Cursor-responsive ambient light, purely decorative.
  if (!reduced) {
    let raf = 0;
    window.addEventListener('pointermove', (ev) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        app.style.setProperty('--pointer-x', `${(ev.clientX / Math.max(1, window.innerWidth)) * 100}%`);
        app.style.setProperty('--pointer-y', `${(ev.clientY / Math.max(1, window.innerHeight)) * 100}%`);
      });
    }, { passive: true });
  }

  // Visual click ripple; never intercepts or replaces native handlers.
  if (!reduced) {
    document.addEventListener('pointerdown', (ev) => {
      const target = ev.target.closest && ev.target.closest('button, .btn, .ultra-tab');
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const dot = document.createElement('span');
      dot.className = 'ultra-ripple';
      const size = Math.max(rect.width, rect.height) * 1.25;
      dot.style.width = `${size}px`;
      dot.style.height = `${size}px`;
      dot.style.left = `${ev.clientX - rect.left - size / 2}px`;
      dot.style.top = `${ev.clientY - rect.top - size / 2}px`;
      target.appendChild(dot);
      dot.addEventListener('animationend', () => dot.remove(), { once: true });
    }, { passive: true });
  }

  // Stagger file-card appearance when cards exist.
  const observeSlots = () => {
    document.querySelectorAll('.slot').forEach((el, i) => {
      el.style.setProperty('--slot-index', i);
      el.classList.add('ultra-reveal');
    });
  };
  requestAnimationFrame(observeSlots);
  const slots = document.getElementById('slots');
  if (slots && 'MutationObserver' in window) {
    new MutationObserver(() => requestAnimationFrame(observeSlots)).observe(slots, { childList: true });
  }
})();

/* =====================================================================
   THEME SWITCHER — visual-only theme state
   ===================================================================== */
(() => {
  const buttons = [...document.querySelectorAll('.theme-btn[data-theme]')];
  if (!buttons.length) return;

  const applyTheme = (theme, persist = true) => {
    const mode = ['default','dark','vivid'].includes(theme) ? theme : 'default';
    document.body.classList.toggle('theme-dark', mode === 'dark');
    document.body.classList.toggle('theme-vivid', mode === 'vivid');
    buttons.forEach(btn => {
      const active = btn.dataset.theme === mode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (persist) {
      try { localStorage.setItem('pvc-card-maker-theme', mode); } catch (_) {}
    }
  };

  let saved = 'default';
  try { saved = localStorage.getItem('pvc-card-maker-theme') || 'default'; } catch (_) {}
  applyTheme(saved, false);

  buttons.forEach(btn => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
  });
})();
