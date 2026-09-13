const fs = require('fs');
let code = fs.readFileSync('client/src/components/components.js', 'utf-8');

code = code.replace(
  /export function renderSearchResults\(\) \{[\s\S]*?return \`\n    <div class="tab-list">/,
  `export function renderSearchResults() {
  const songs = state.searchResults.songs || [];
  const artists = state.searchResults.artists || [];
  const playlists = state.searchResults.playlists || [];

  let content = '';

  if (state.searchLoading) {
    if (state.searchTab === 'songs') {
      content = \`<div class="song-table">\${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>\`;
    } else {
      content = \`<div class="card-grid">\${Array(8).fill('').map(() => renderCardSkeleton(state.searchTab === 'artists')).join('')}</div>\`;
    }
  } else {
    if (state.searchTab === 'songs') {
      content = \`<div class="song-table">\${songs.length ? songs.map((s, i) => renderSongRow(s, i + 1, 'search')).join('') : '<div class="empty-state"><i class="fa-solid fa-music"></i><h2>No songs found</h2><p>Try searching with different keywords.</p></div>'}</div>\`;
    } else if (state.searchTab === 'artists') {
      content = \`<div class="card-grid">\${artists.length ? artists.map((a, i) => renderArtistSearchCard(a, i)).join('') : '<div class="empty-state"><i class="fa-solid fa-microphone"></i><h2>No artists found</h2><p>Try searching with different keywords.</p></div>'}</div>\`;
    } else {
      content = \`<div class="card-grid">\${playlists.length ? playlists.map((p, i) => renderPlaylistSearchCard(p, i)).join('') : '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>No playlists found</h2><p>Try searching with different keywords.</p></div>'}</div>\`;
    }
  }

  return \`
    <div class="tab-list">`
);

fs.writeFileSync('client/src/components/components.js', code);
