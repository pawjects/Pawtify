const fs = require('fs');

const path = 'docs/app.js';
let content = fs.readFileSync(path, 'utf8');

const replacement = `function renderSearchResults() {
  const songs = state.searchResults.songs;
  const artists = state.searchResults.artists;
  
  if (state.searchLoading) {
    return \`
      <div class="tab-list">
        <button class="\${state.searchTab === "songs" ? "active" : ""}" type="button">Songs</button>
        <button class="\${state.searchTab === "artists" ? "active" : ""}" type="button">Artists</button>
      </div>
      \${state.searchTab === "songs" 
        ? '<div class="song-table">' + Array(5).fill(0).map(() => \`
            <div class="skeleton-song-row">
              <div class="skeleton-cover-sm skeleton"></div>
              <div class="skeleton-text-wrap">
                <div class="skeleton-text-main skeleton"></div>
                <div class="skeleton-text-sub skeleton"></div>
              </div>
            </div>
          \`).join('') + '</div>'
        : '<div class="card-grid">' + Array(5).fill(0).map(() => \`
            <article class="skeleton-card">
              <div class="skeleton-card-cover skeleton"></div>
              <div class="skeleton-card-title skeleton"></div>
              <div class="skeleton-card-meta skeleton"></div>
            </article>
          \`).join('') + '</div>'
      }
    \`;
  }

  return \`
    <div class="tab-list">
      <button class="tab-btn \${state.searchTab === "songs" ? "active" : ""}" data-action="set-search-tab" data-value="songs" type="button">Songs</button>
      <button class="tab-btn \${state.searchTab === "artists" ? "active" : ""}" data-action="set-search-tab" data-value="artists" type="button">Artists</button>
    </div>
    \${state.searchTab === "songs"
      ? \`<div class="song-table">\${songs.length ? songs.map((s, i) => renderSongRow(s, i + 1, "search")).join("") : '<div class="empty-state">No songs found.</div>'}</div>\`
      : \`<div class="card-grid">\${artists.length ? artists.map((a, i) => renderArtistSearchCard(a, i)).join("") : '<div class="empty-state">No artists found.</div>'}</div>\`}
  \`;
}`;

content = content.replace(/function renderSearchResults\(\) \{[\s\S]*?function renderSearchHistory\(\)/, replacement + '\n\nfunction renderSearchHistory()');

fs.writeFileSync(path, content);
console.log('Done!');
