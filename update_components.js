const fs = require('fs');
let file = fs.readFileSync('client/src/components/components.js', 'utf8');

const newRenderDynamic = `export function renderSearchDynamicUI() {
  const hasQuery = state.searchQuery.trim().length > 0;
  const recentQueries = (state.recentSearches || [])
    .filter((item) => item.type === 'query')
    .slice(0, 5);
  const suggestions = state.searchSuggestions || [];

  let html = '';
  if (hasQuery) {
    html += \`<button class="clear-search" data-action="clear-search-input" type="button" aria-label="Clear Search"><i class="fa-solid fa-xmark" style="font-size: 1rem;"></i></button>\`;
  }
  
  if (hasQuery && suggestions.length > 0) {
    html += \`
      <div class="recent-searches-dropdown">
        \${suggestions.map(s => \`
          <button class="recent-search-item" data-action="use-recent-search" data-query="\${escapeHTML(s)}" type="button" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: transparent; border: none; color: var(--text-main); text-align: left; cursor: pointer; width: 100%; transition: background 0.2s;">
            <div style="display: flex; align-items: center; gap: 12px; pointer-events: none;">
              <i class="fa-solid fa-magnifying-glass" style="color: var(--muted);"></i>
              <span>\${escapeHTML(s)}</span>
            </div>
          </button>
        \`).join('')}
      </div>
    \`;
  } else if (!hasQuery && recentQueries.length > 0) {
    html += \`
      <div class="recent-searches-dropdown">
        <div style="padding: 12px 16px; font-size: 0.85rem; color: var(--text-sub); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid var(--border);">
          Recent Searches
        </div>
        \${recentQueries.map(item => \`
          <button class="recent-search-item" data-action="use-recent-search" data-query="\${escapeHTML(item.query)}" type="button" style="display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: transparent; border: none; color: var(--text-main); text-align: left; cursor: pointer; width: 100%; transition: background 0.2s;">
            <div style="display: flex; align-items: center; gap: 12px; pointer-events: none;">
              <i class="fa-solid fa-clock-rotate-left" style="color: var(--muted);"></i>
              <span>\${escapeHTML(item.query)}</span>
            </div>
            <div data-action="remove-recent-search" data-type="query" data-id="\${escapeHTML(item.query)}" style="padding: 4px; color: var(--muted); cursor: pointer;" title="Remove">
              <i class="fa-solid fa-xmark" style="pointer-events: none;"></i>
            </div>
          </button>
        \`).join('')}
      </div>
    \`;
  }
  return html;
}`;

// I need to replace the old renderSearchDynamicUI implementation.
// Let's use string split or something more robust.
const startStr = "export function renderSearchDynamicUI() {";
const endStr = "export function updateSearchPageUI() {";
const startIdx = file.indexOf(startStr);
const endIdx = file.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  file = file.slice(0, startIdx) + newRenderDynamic + '\n\n' + file.slice(endIdx);
  fs.writeFileSync('client/src/components/components.js', file);
  console.log('Updated components.js');
} else {
  console.log('Could not find boundaries');
}
