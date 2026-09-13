const fs = require('fs');
let js = fs.readFileSync('client/src/components/components.js', 'utf-8');

js = js.replace(
  /export function renderSearchPage\(\) \{[\s\S]*?export function renderLibraryPage/,
  `export function renderSearchPage() {
  const hasQuery = state.searchQuery.trim().length > 0;
  return \`
    <section class="page">
      <div class="page-header" style="flex-direction:column; align-items:flex-start; margin-bottom: 24px;">
        <h1 class="page-title">Search</h1>
        <div class="search-container" style="width: 100%; max-width: 500px;">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" class="search-input" placeholder="What do you want to listen to?" value="\${escapeHTML(state.searchQuery)}" />
          \${hasQuery ? \`<button class="clear-search" type="button" aria-label="Clear Search">&times;</button>\` : ''}
        </div>
      </div>
      \${hasQuery ? renderSearchResults() : renderSearchCategories()}
    </section>
  \`;
}

export function renderLibraryPage`
);

fs.writeFileSync('client/src/components/components.js', js);
