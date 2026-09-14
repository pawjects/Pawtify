const fs = require('fs');
const file = 'client/src/core/events.js';
let content = fs.readFileSync(file, 'utf8');

const injection = `
      if (action === 'clear-search-input') {
        event.preventDefault();
        state.searchQuery = '';
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [], playlists: [] };
        if (state.route.name === 'search') {
          renderCurrentRoute();
        }
        return;
      }
`;

content = content.replace(
  "if (action === 'search-category') {",
  injection.trim() + "\n      if (action === 'search-category') {"
);

fs.writeFileSync(file, content, 'utf8');
console.log('events.js updated for clear-search');
