const fs = require('fs');
let file = fs.readFileSync('client/src/components/master.js', 'utf8');

file = file.replace(
  "runSearch(pending);\n      }",
  "runSearch(pending);\n      } else if (state.searchQuery && (!state.searchResults.songs || state.searchResults.songs.length === 0)) {\n        runSearch(state.searchQuery);\n      }"
);

fs.writeFileSync('client/src/components/master.js', file);
console.log('master.js updated');
