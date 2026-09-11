const fs = require('fs');
let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace(/alert\("Downloading directly from YouTube embeds is restricted.*?\"\);/,
  'showToast("Downloading directly from YouTube embeds is restricted. We recommend adding this song to a playlist instead!");'
);
js = js.replace(/alert\("Live lyrics sync functionality is currently unavailable.*?\"\);/,
  'showToast("Live lyrics sync functionality is currently unavailable in the YouTube No-Cookie environment.");'
);

js = js.replace('function bindGlobalEvents() {',
`function vibrate() {
  if (navigator.vibrate) {
    try { navigator.vibrate(50); } catch(e) {}
  }
}

function bindGlobalEvents() {`);

// Inject vibrate into click events
js = js.replace('document.addEventListener("click", async (event) => {',
`document.addEventListener("click", async (event) => {
    const btn = event.target.closest("button, .song-row, .card, .home-scroll-card, .nav-link, .mobile-nav-item");
    if (btn) vibrate();`);

fs.writeFileSync('docs/app.js', js);
