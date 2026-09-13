const fs = require('fs');
let js = fs.readFileSync('client/src/components/components.js', 'utf-8');

const renderSearchCategories = `
const SEARCH_CATEGORIES = [
  { name: 'Bollywood Hits', color: 'linear-gradient(135deg, #f97316, #c2410c)' },
  { name: 'Punjabi Pop', color: 'linear-gradient(135deg, #f43f5e, #c026d3)' },
  { name: 'Lo-Fi Chill', color: 'linear-gradient(135deg, #6366f1, #3b82f6)' },
  { name: 'Desi Hip Hop', color: 'linear-gradient(135deg, #10b981, #059669)' },
  { name: 'Sufi Soul', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { name: 'Workout', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
  { name: 'Tamil Classics', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  { name: 'Telugu Top 50', color: 'linear-gradient(135deg, #14b8a6, #0f766e)' },
  { name: 'Indie India', color: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { name: 'Devotional', color: 'linear-gradient(135deg, #0ea5e9, #0369a1)' },
  { name: 'Romantic', color: 'linear-gradient(135deg, #fb7185, #e11d48)' },
  { name: 'Ghazals', color: 'linear-gradient(135deg, #a855f7, #7e22ce)' },
];

export function renderSearchCategories() {
  return \`
    <div style="margin-top: 24px;">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Browse All</h2>
      <div class="category-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
        \${SEARCH_CATEGORIES.map(cat => \`
          <div class="category-card" data-action="search-category" data-category="\${escapeHTML(cat.name)}" tabindex="0" style="background: \${cat.color}; border-radius: var(--radius-md); padding: 16px; height: 120px; display: flex; align-items: flex-end; justify-content: flex-start; cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: hidden; position: relative;">
            <span style="color: white; font-weight: 700; font-size: 1.125rem; z-index: 2; line-height: 1.2; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">\${escapeHTML(cat.name)}</span>
            <div style="position: absolute; right: -20px; bottom: -20px; width: 80px; height: 80px; background: rgba(255,255,255,0.15); border-radius: 50%; transform: rotate(25deg);"></div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;
}
`;

js = js.replace(
  /export function renderSearchPage\(\) \{[\s\S]*?\}\n/,
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
`
);

js = js + '\n' + renderSearchCategories;

fs.writeFileSync('client/src/components/components.js', js);

let css = fs.readFileSync('client/styles.css', 'utf-8');
if (!css.includes('.category-card:hover')) {
  css += `
.category-card:hover {
  transform: scale(1.03);
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.category-card:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}
`;
  fs.writeFileSync('client/styles.css', css);
}

