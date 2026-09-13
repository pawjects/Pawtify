const fs = require('fs');
let js = fs.readFileSync('client/src/components/components.js', 'utf-8');

js = js.replace(
  /export function renderPlaylistPage\(playlistId\) \{[\s\S]*?if \(!playlist\) return '<div class="empty-state">Playlist not found\.<\/div>';/,
  `export function renderPlaylistPage(playlistId) {
  let playlist;
  if (playlistId === 'history') {
    const historySongs = state.recentlyPlayed
      .map((id) => getSongById(id))
      .filter(Boolean);
    playlist = {
      id: 'history',
      name: 'Listening History',
      songs: historySongs,
      isSystem: true,
    };
  } else {
    playlist = state.playlists.find((p) => p.id === playlistId);
    if (!playlist && state.ytPlaylists && state.ytPlaylists[playlistId]) {
      playlist = state.ytPlaylists[playlistId];
    }
  }

  if (!playlist) return '<div class="empty-state">Playlist not found.</div>';
  
  if (playlist.isLoading) {
    return '<section class="page"><div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"></div><h2>Loading Playlist...</h2></div></section>';
  }`
);

fs.writeFileSync('client/src/components/components.js', js);
