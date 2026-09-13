const fs = require('fs');
let js = fs.readFileSync('client/src/components/components.js', 'utf-8');

js = js.replace(
  /return `\n\s*<section class="page">\n\s*<div class="page-header">[\s\S]*?<\/section>\n\s*`;/,
  `const coverUrl = playlist.coverUrl || (playlist.songs && playlist.songs.length > 0 ? playlist.songs[0].coverUrl : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300');
  
  return \`
    <section class="page" style="padding-top: 0;">
      <div style="margin-bottom: 24px; margin-top: 16px;">
        <button class="btn btn-soft" data-action="navigate" data-path="/" type="button" style="padding: 8px 16px; font-size: 0.875rem;">
          <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back to Home
        </button>
      </div>
      <div class="hero-player" style="margin-bottom: 32px; border-radius: var(--radius-lg); background: var(--glass-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); padding: 32px;">
        <img class="hero-cover" src="\${escapeHTML(coverUrl)}" alt="\${escapeHTML(playlist.name)}" />
        <div class="hero-info" style="display: flex; flex-direction: column; justify-content: flex-end;">
          <h4 style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 8px; color: var(--muted);">Playlist</h4>
          <h1 class="hero-title" style="font-size: 3rem; line-height: 1.1; margin-bottom: 16px; font-family: var(--font-display); font-weight: 800;">\${escapeHTML(playlist.name)}</h1>
          <p class="hero-artist" style="margin-bottom: 24px; color: var(--muted);">
            \${playlist.isSystem ? 'System Playlist' : (playlist.songs ? playlist.songs.length : 0) + ' songs'}
          </p>
          <div class="hero-actions" style="display: flex; gap: 12px;">
            <button class="btn btn-primary" data-action="play-all-playlist" data-playlist-id="\${escapeHTML(playlist.id)}" type="button">
              <i class="fa-solid fa-play"></i> Play All
            </button>
            <button class="btn btn-soft" data-action="share-playlist" data-playlist-id="\${escapeHTML(playlist.id)}" type="button" aria-label="Share Playlist">
              <i class="fa-solid fa-share-nodes"></i> Share
            </button>
            \${
              playlist.id !== 'default' && !playlist.isSystem
                ? \`<button class="btn btn-danger" data-action="delete-playlist" data-playlist-id="\${escapeHTML(playlist.id)}" type="button" aria-label="Delete Playlist"><i class="fa-solid fa-trash"></i></button>\`
                : ''
            }
          </div>
        </div>
      </div>
      <div class="song-table">
        \${playlist.songs && playlist.songs.length ? playlist.songs.map((s, i) => renderSongRow(s, i + 1, 'playlist', playlist.id)).join('') : '<div class="empty-state">This playlist is empty. Search for songs to add them.</div>'}
      </div>
    </section>
  \`;`
);

fs.writeFileSync('client/src/components/components.js', js);
