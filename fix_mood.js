const fs = require('fs');
const file = 'client/src/core/events.js';
let content = fs.readFileSync(file, 'utf8');

const oldMood = `
      if (action === 'search-mood') {
        event.preventDefault();
        const mood = actionNode.dataset.mood;
        state.searchQuery = mood;
        state.searchLoading = true;
        if (state.route.name === 'search') {
          renderCurrentRoute();
          runSearch(mood);
        } else {
`;

const newMood = `
      if (action === 'search-mood') {
        event.preventDefault();
        const mood = actionNode.dataset.mood;
        state.searchQuery = mood;
        state.searchLoading = true;
        if (state.route.name === 'search') {
          renderCurrentRoute();
          const input = document.getElementById('search-input');
          if (input) input.value = mood;
          runSearch(mood);
        } else {
`;

content = content.replace(oldMood.trim(), newMood.trim());
fs.writeFileSync(file, content, 'utf8');
console.log('fixed search-mood');
