const fs = require('fs');
let html = fs.readFileSync('docs/index.html', 'utf8');

// Fix the mess I just made with sed:
html = html.replace(/<button class="nav-link" data-route="\/library" type="button">[\s\S]*?<button class="nav-link-tmp" style="display:none;" data-route="\/library" type="button">/, '<button class="nav-link" data-route="/library" type="button">');

// Now cleanly insert YouTube after Library in Sidebar
html = html.replace(
  '<span>Your Library</span>\n        </button>',
  '<span>Your Library</span>\n        </button>\n        <button class="nav-link" data-route="/youtube" type="button">\n          <i class="fa-brands fa-youtube"></i>\n          <span>YouTube</span>\n        </button>'
);

// Mobile bottom nav
html = html.replace(
  '<span>Library</span>\n      </button>',
  '<span>Library</span>\n      </button>\n      <button class="mobile-nav-item" data-route="/youtube" type="button">\n        <i class="fa-brands fa-youtube"></i>\n        <span>YouTube</span>\n      </button>'
);

fs.writeFileSync('docs/index.html', html);
