const fs = require('fs');
let code = fs.readFileSync('client/src/core/events.js', 'utf-8');

code = code.replace(
  /state\.searchLoading = true;\n      if \(globals\.searchTimer\) window\.clearTimeout\(globals\.searchTimer\);\n      globals\.searchTimer = window\.setTimeout\(\(\) => \{\n        runSearch\(state\.searchQuery\);\n      \}, 500\);/,
  `state.searchLoading = true;\n      if (state.route.name === 'search') {\n        renderCurrentRoute();\n        const input = document.getElementById('search-input');\n        if (input) input.focus();\n      }\n      if (globals.searchTimer) window.clearTimeout(globals.searchTimer);\n      globals.searchTimer = window.setTimeout(() => {\n        runSearch(state.searchQuery);\n      }, 500);`
);

fs.writeFileSync('client/src/core/events.js', code);
