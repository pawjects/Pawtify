const fs = require('fs');
let js = fs.readFileSync('docs/app.js', 'utf8');

// 1. Add route
js = js.replace('if (normalized === "/library") return { name: "library", playlistId: null };',
  'if (normalized === "/library") return { name: "library", playlistId: null };\n   if (normalized === "/youtube") return { name: "youtube", playlistId: null };\n   if (normalized.startsWith("/song/")) return { name: "song", songId: normalized.split("/")[2] };'
);

// 2. markActiveNav
js = js.replace('|| state.route.name === "playlist"));',
  '|| state.route.name === "playlist") ||\n       (route === "/youtube" && state.route.name === "youtube") ||\n       (route === "/youtube" && state.route.name === "profile");'
);

// also for mobile-nav-item
js = js.replace('document.querySelectorAll(".mobile-nav-item").forEach((btn) => {',
  `document.querySelectorAll(".mobile-nav-item").forEach((btn) => {
    const route = btn.dataset.route;
    const active =
      (route === "/" && state.route.name === "home") ||
      (route === "/search" && state.route.name === "search") ||
      (route === "/library" && (state.route.name === "library" || state.route.name === "playlist")) ||
      (route === "/youtube" && state.route.name === "youtube");
    if (active) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  // Prevent original loop from messing it up if we override it, wait just replace the whole function:
`);

js = js.replace(/function markActiveNav\(\) \{[\s\S]*?\}\n/g, 
`function markActiveNav() {
  document.querySelectorAll(".nav-link").forEach((btn) => {
    const route = btn.dataset.route;
    const active =
      (route === "/" && state.route.name === "home") ||
      (route === "/search" && state.route.name === "search") ||
      (route === "/library" && (state.route.name === "library" || state.route.name === "playlist")) ||
      (route === "/youtube" && state.route.name === "youtube");
    if (active) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  document.querySelectorAll(".mobile-nav-item").forEach((btn) => {
    const route = btn.dataset.route;
    const active =
      (route === "/" && state.route.name === "home") ||
      (route === "/search" && state.route.name === "search") ||
      (route === "/library" && (state.route.name === "library" || state.route.name === "playlist")) ||
      (route === "/youtube" && state.route.name === "youtube");
    if (active) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}
`);

fs.writeFileSync('docs/app.js', js);
