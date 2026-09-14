const fs = require('fs');
const file = 'client/src/components/master.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'renderPlaylistPage,\n} from \'./components.js\';',
  'renderPlaylistPage,\n  updateSearchPageUI\n} from \'./components.js\';'
);

const oldSearchRoute = `    if (state.route.name === 'search') {
      const activeId = document.activeElement
        ? document.activeElement.id
        : null;
      appMain.innerHTML = renderSearchPage();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = state.searchQuery;
        if (activeId === 'search-input') {
          searchInput.focus();
          const len = searchInput.value.length;
          searchInput.setSelectionRange(len, len);
        }
      }
      if (state.pendingSearchQuery) {
        const pending = state.pendingSearchQuery;
        state.pendingSearchQuery = '';
        runSearch(pending);
      }`;

const newSearchRoute = `    if (state.route.name === 'search') {
      const activeId = document.activeElement
        ? document.activeElement.id
        : null;
        
      const existingInput = document.getElementById('search-input');
      const isAlreadyOnSearchPage = !!existingInput && appMain.querySelector('.page-title')?.textContent === 'Search';

      if (isAlreadyOnSearchPage) {
        updateSearchPageUI();
      } else {
        appMain.innerHTML = renderSearchPage();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.value = state.searchQuery;
          if (activeId === 'search-input') {
            searchInput.focus();
            const len = searchInput.value.length;
            searchInput.setSelectionRange(len, len);
          }
        }
      }

      if (state.pendingSearchQuery) {
        const pending = state.pendingSearchQuery;
        state.pendingSearchQuery = '';
        runSearch(pending);
      }`;

content = content.replace(oldSearchRoute, newSearchRoute);
fs.writeFileSync(file, content, 'utf8');
console.log('master.js updated');
