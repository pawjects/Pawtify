const fs = require('fs');
let js = fs.readFileSync('client/src/core/events.js', 'utf-8');

js = js.replace(
  /if \(action === 'play-something'\) \{/,
  `if (action === 'search-category') {
        event.preventDefault();
        const category = actionNode.dataset.category;
        if (category) {
          state.searchQuery = category;
          const searchInput = document.querySelector('.search-input');
          if (searchInput) searchInput.value = category;
          // Trigger search using performSearch or by dispatching an event
          // It looks like search is handled elsewhere, let's trigger the input event
          if (searchInput) {
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        return;
      }
      if (action === 'play-something') {`
);

js = js.replace(
  /button, \.song-row, \.card, \.home-scroll-card, \.nav-link, \.mobile-nav-item/,
  'button, .song-row, .card, .home-scroll-card, .nav-link, .mobile-nav-item, .category-card'
)

fs.writeFileSync('client/src/core/events.js', js);
