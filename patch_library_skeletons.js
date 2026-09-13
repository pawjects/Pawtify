const fs = require('fs');
let code = fs.readFileSync('client/src/components/components.js', 'utf-8');

code = code.replace(
  /export function renderLibraryPage\(\) \{[\s\S]*?return \`\n    <section class="page">/,
  `export function renderLibraryPage() {
  let tabContent = '';
  
  if (state.isLoading) {
    if (state.libraryTab === 'playlists') {
      tabContent = \`<div class="card-grid">\${Array(8).fill('').map(() => renderCardSkeleton()).join('')}</div>\`;
    } else {
      tabContent = \`<div class="song-table">\${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>\`;
    }
  } else {
    if (state.libraryTab === 'playlists') {
      tabContent = \`<div class="card-grid">\${state.playlists.length ? state.playlists.map((p, i) => renderPlaylistCard(p, i)).join('') : '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>No playlists yet</h2><p>Create a playlist to get started.</p></div>'}</div>\`;
    } else if (state.libraryTab === 'favorites') {
      tabContent = \`<div class="song-table">\${state.favorites.length ? state.favorites.map((s, i) => renderSongRow(s, i + 1, 'favorites')).join('') : '<div class="empty-state"><i class="fa-solid fa-heart"></i><h2>No favorites yet</h2><p>Like a song to add it here.</p></div>'}</div>\`;
    } else {
      const uniqueAddedSongs = dedupeSongs(
        [...state.favorites, ...state.playlists.flatMap((p) => p.songs)]
          .filter((s) => s.addedAt)
          .sort((a, b) => b.addedAt - a.addedAt)
      );
      const recentSongs = uniqueAddedSongs.slice(0, 50);
      tabContent = \`<div class="song-table">\${recentSongs.length ? recentSongs.map((s, i) => renderSongRow(s, i + 1, 'recent')).join('') : '<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><h2>No recent songs</h2><p>Your recent activity will appear here.</p></div>'}</div>\`;
    }
  }

  return \`
    <section class="page">`
);

fs.writeFileSync('client/src/components/components.js', code);
