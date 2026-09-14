const fs = require('fs');
let file = fs.readFileSync('client/src/core/events.js', 'utf8');

const oldInputEvent = `
  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.id === 'search-input') {
      state.searchQuery = target.value; saveJSON(STORAGE.SEARCH_QUERY, target.value);
      if (!state.searchQuery.trim()) {
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [] };
        globals.searchRequestToken += 1;
        if (globals.searchTimer) {
          window.clearTimeout(globals.searchTimer);
          globals.searchTimer = null;
        }
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }
      state.searchLoading = true;
      if (state.route.name === 'search') {
        renderCurrentRoute();
        const input = document.getElementById('search-input');
        if (input) input.focus();
      }
      if (globals.searchTimer) window.clearTimeout(globals.searchTimer);
      globals.searchTimer = window.setTimeout(() => {
        runSearch(state.searchQuery);
      }, 500);
    }
`;

const newInputEvent = `
  document.addEventListener('input', async (event) => {
    const target = event.target;
    if (target.id === 'search-input') {
      state.searchQuery = target.value; saveJSON(STORAGE.SEARCH_QUERY, target.value);
      if (!state.searchQuery.trim()) {
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [] };
        state.searchSuggestions = [];
        globals.searchRequestToken += 1;
        if (globals.searchTimer) {
          window.clearTimeout(globals.searchTimer);
          globals.searchTimer = null;
        }
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }
      state.searchLoading = true;
      
      // Fast fetch for suggestions
      const currentQuery = state.searchQuery;
      
      if (state.route.name === 'search') {
        renderCurrentRoute();
      }
      
      if (globals.suggestionTimer) window.clearTimeout(globals.suggestionTimer);
      globals.suggestionTimer = window.setTimeout(async () => {
         const { fetchSearchSuggestions } = await import('../services/apiMapping.js');
         if (state.searchQuery === currentQuery) {
            state.searchSuggestions = await fetchSearchSuggestions(currentQuery);
            if (state.route.name === 'search') {
               const { updateSearchPageUI } = await import('../components/components.js');
               updateSearchPageUI();
            }
         }
      }, 150);

      if (globals.searchTimer) window.clearTimeout(globals.searchTimer);
      globals.searchTimer = window.setTimeout(() => {
        runSearch(state.searchQuery);
      }, 500);
    }
`;

file = file.replace(oldInputEvent.trim(), newInputEvent.trim());
fs.writeFileSync('client/src/core/events.js', file);
console.log('Updated events.js');
