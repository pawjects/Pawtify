const fs = require('fs');
let js = fs.readFileSync('client/src/components/components.js', 'utf-8');

js = js.replace(
  /<input type="text" class="search-input"/,
  '<input type="text" id="search-input" class="search-input"'
);

fs.writeFileSync('client/src/components/components.js', js);
