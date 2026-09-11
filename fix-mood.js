const fs = require('fs');
let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace(/function renderSearchHistory\(\) \{[\s\S]*?\}\n/, 
`function renderSearchHistory() {
  const moods = [
    { name: 'Pop', color: '#ff4b4b' },
    { name: 'Hip Hop', color: '#f59e0b' },
    { name: 'Chill', color: '#10b981' },
    { name: 'Workout', color: '#3b82f6' },
    { name: 'Focus', color: '#8b5cf6' },
    { name: 'Party', color: '#ec4899' }
  ];

  const moodGrid = \`
    <div style="margin-top:24px;">
      <h2 class="page-title" style="font-size:1.25rem; margin-bottom:16px;">Browse All</h2>
      <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:16px;">
        \${moods.map(m => \`
          <div class="card mood-card" data-action="search-mood" data-mood="\${m.name}" style="background: linear-gradient(135deg, \${m.color}, #111); height:100px; display:flex; align-items:flex-end; padding:12px; border-radius:12px; cursor:pointer;">
            <h3 style="font-size:1.1rem; font-weight:700;">\${m.name}</h3>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;

  return \`
    <div>
      \${state.recentSearches.length ? \`
        <div class="page-header">
          <h2 class="page-title" style="font-size:1.25rem;">Recent Searches</h2>
          <button class="btn btn-soft" data-action="clear-search-history" type="button">Clear All</button>
        </div>
        <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));">
          \${state.recentSearches.map((item) => \`
            <div class="card" style="display:flex; align-items:center; justify-content:space-between; padding:16px 20px;">
              <span style="font-weight:600; cursor:pointer;" data-action="use-recent-search" data-query="\${escapeHTML(item)}">\${escapeHTML(item)}</span>
              <button class="icon-btn" data-action="remove-recent-search" data-query="\${escapeHTML(item)}" type="button" aria-label="Remove recent search">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          \`).join("")}
        </div>
      \` : ""}
      \${moodGrid}
    </div>
  \`;
}
`);

// Add action handler for search-mood
js = js.replace('if (action === "clear-search-history") { event.preventDefault(); state.recentSearches = []; saveJSON(STORAGE.RECENT_SEARCHES, []); if (state.route.name === "search") renderCurrentRoute(); return; }',
`if (action === "clear-search-history") { event.preventDefault(); state.recentSearches = []; saveJSON(STORAGE.RECENT_SEARCHES, []); if (state.route.name === "search") renderCurrentRoute(); return; }
      if (action === "search-mood") {
        event.preventDefault();
        const mood = actionNode.dataset.mood;
        state.searchQuery = mood;
        state.searchLoading = true;
        if (state.route.name === "search") {
           renderCurrentRoute();
           runSearch(mood);
        } else {
           state.pendingSearchQuery = mood;
           navigate("/search");
        }
        return;
      }`);

fs.writeFileSync('docs/app.js', js);
