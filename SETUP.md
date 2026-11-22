# PVC Card Maker Pro: login setup

1. In GitHub, delete the old top-level `index.html`, `css/`, `js/` and `assets/` (the site now lives in `public/`).
2. Upload everything in this folder to the repo (same layout).
3. Cloudflare > Workers & Pages > pvccardmakerpro > Settings > "Runtime variables and secrets" (top card):
   add Secret `OWNER_EMAIL` (your Gmail) and Secret `SESSION_SECRET` (40+ random characters).
4. Google Cloud > Clients > Card Maker Pro: add https://pvccardmakerpro.jv7.workers.dev to Authorised JavaScript origins.
5. Turn off GitHub Pages for this repo if it is on (Settings > Pages).
