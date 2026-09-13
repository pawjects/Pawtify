const fs = require('fs');
let js = fs.readFileSync('client/src/components/fullscreen.js', 'utf-8');

js = js.replace(
  /<div class="fs-backdrop"><\/div>/,
  `<div class="fs-backdrop" style="background-image: url('\${escapeHTML(song.coverUrl)}')"></div>`
);

fs.writeFileSync('client/src/components/fullscreen.js', js);
