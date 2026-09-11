const fs = require('fs');

let html = fs.readFileSync('docs/index.html', 'utf8');

// Remove YouTube tab from Sidebar
html = html.replace(
  / *<button class="nav-link" data-route="\/youtube" type="button">\s*<i class="fa-brands fa-youtube"><\/i>\s*<span>YouTube<\/span>\s*<\/button>\n/g,
  ''
);

// Remove YouTube tab from Mobile Nav
html = html.replace(
  / *<button class="mobile-nav-item" data-route="\/youtube" type="button">\s*<i class="fa-brands fa-youtube"><\/i>\s*<span>YouTube<\/span>\s*<\/button>\n/g,
  ''
);

fs.writeFileSync('docs/index.html', html);
