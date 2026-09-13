const fs = require('fs');
let code = fs.readFileSync('client/src/components/components.js', 'utf-8');

code = code.replace(
  /export function renderSearchPage\(\) \{[\s\S]*?export function renderLibraryPage/,
  `export function renderSearchPage() {
  const hasQuery = state.searchQuery.trim().length > 0;
  return \`
    <section class="page">
      <div class="page-header" style="flex-direction:column; align-items:flex-start; margin-bottom: 24px; gap: 16px;">
        <h1 class="page-title">Search</h1>
        <div class="search-container">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" id="search-input" class="search-input" placeholder="What do you want to listen to?" value="\${escapeHTML(state.searchQuery)}" />
          \${hasQuery ? \`<button class="clear-search" type="button" aria-label="Clear Search"><i class="fa-solid fa-xmark" style="font-size: 1rem;"></i></button>\` : ''}
        </div>
      </div>
      \${hasQuery ? renderSearchResults() : renderSearchCategories()}
    </section>
  \`;
}
export function renderLibraryPage`
);

code = code.replace(
  /export function renderSearchCategories\(\) \{[\s\S]*?<\/div>\n    <\/div>\n  `;\n\}/,
  `export function renderSearchCategories() {
  return \`
    <div style="margin-top: 8px;">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Browse All</h2>
      <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
        \${SEARCH_CATEGORIES.map(cat => \`
          <div class="category-card" data-action="search-category" data-category="\${escapeHTML(cat.name)}" tabindex="0" style="background: \${cat.color};">
            <span>\${escapeHTML(cat.name)}</span>
            <div class="bg-accent"></div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;
}`
);

fs.writeFileSync('client/src/components/components.js', code);
