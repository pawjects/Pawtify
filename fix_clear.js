const fs = require('fs');
const file = 'client/src/core/events.js';
let content = fs.readFileSync(file, 'utf8');

const oldClear = `
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

const newClear = `
      if (action === 'clear-search-input') {
        event.preventDefault();
        state.searchQuery = '';
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [], playlists: [] };
        if (state.route.name === 'search') {
          renderCurrentRoute();
          const input = document.getElementById('search-input');
          if (input) {
            input.value = '';
            input.focus();
          }
        }
        return;
      }
`;

content = content.replace(oldClear.trim(), newClear.trim());
fs.writeFileSync(file, content, 'utf8');
console.log('fixed clear-search-input');
