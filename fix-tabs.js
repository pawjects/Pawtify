const fs = require('fs');

const path = 'docs/app.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<button class="${state.searchTab === "songs" ? "active" : ""}" type="button">Songs</button>',
  '<button class="tab-btn ${state.searchTab === "songs" ? "active" : ""}" type="button">Songs</button>'
);

content = content.replace(
  '<button class="${state.searchTab === "artists" ? "active" : ""}" type="button">Artists</button>',
  '<button class="tab-btn ${state.searchTab === "artists" ? "active" : ""}" type="button">Artists</button>'
);

fs.writeFileSync(path, content);
