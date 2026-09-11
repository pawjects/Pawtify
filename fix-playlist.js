const fs = require('fs');
let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace(/function renderPlaylistPage\(playlistId\) \{[\s\S]*?return \`[\s\S]*?<\/section>\n   \`;\n \}/,
`function renderPlaylistPage(playlistId) {
  const isFavorites = playlistId === "favorites";
  const playlist = isFavorites
    ? { id: "favorites", name: "Favorites", songs: state.favorites }
    : state.playlists.find((p) => p.id === playlistId);

  if (!playlist) return \`<div class="empty-state">Playlist not found</div>\`;

  return \`
    <section class="page playlist-view fade-in">
      <div style="display:flex; align-items:flex-end; gap:24px; padding:40px 20px; background: linear-gradient(transparent 0%, rgba(255,255,255,0.05) 100%); margin:-20px -20px 24px -20px;">
        <div style="width:200px; height:200px; background:var(--surface-light); box-shadow:0 10px 30px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
          <i class="\${isFavorites ? 'fa-solid fa-heart' : 'fa-solid fa-music'}" style="font-size:4rem; color:\${isFavorites ? 'var(--green)' : 'var(--text-sub)'}"></i>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px;">
          <span style="text-transform:uppercase; font-size:0.85rem; font-weight:700; letter-spacing:1px; color:var(--text-sub);">Playlist</span>
          <h1 style="font-size:3rem; font-weight:900; margin:0; line-height:1.1; word-break:break-word;">\${escapeHTML(playlist.name)}</h1>
          <p style="color:var(--text-sub); font-size:1rem; margin-top:8px;">\${playlist.songs.length} \${playlist.songs.length === 1 ? 'song' : 'songs'}</p>
        </div>
      </div>
      
      <div style="display:flex; align-items:center; gap:24px; padding:0 0 24px 0;">
        \${playlist.songs.length > 0 ? \`<button class="btn btn-primary" data-action="play-playlist" data-playlist-id="\${escapeHTML(playlist.id)}" type="button" style="width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 8px 16px rgba(29, 185, 84, 0.3);"><i class="fa-solid fa-play" style="font-size:1.5rem; margin-left:4px;"></i></button>\` : ''}
        \${!isFavorites ? \`<button class="btn btn-soft" data-action="delete-playlist" data-playlist-id="\${escapeHTML(playlist.id)}" type="button" style="padding:12px 24px;">Delete Playlist</button>\` : ''}
      </div>

      <div class="song-table">
        \${playlist.songs.length > 0 
          ? playlist.songs.map((song, i) => renderSongRow(song, i + 1, "playlist", playlist.id)).join("") 
          : '<div class="empty-state">No songs in this playlist yet.</div>'
        }
      </div>
    </section>
  \`;
}`);

fs.writeFileSync('docs/app.js', js);
