const fs = require('fs');
let js = fs.readFileSync('client/src/components/components.js', 'utf-8');

// I will replace the incorrect block in renderLibraryPage back to what it was.
// The incorrect block starts at `const coverUrl = playlist.coverUrl...` just before `export function renderPlaylistPage(playlistId) {`
js = js.replace(
  /const coverUrl = playlist\.coverUrl[\s\S]*?<\/section>\n\s*`;\n\}\n\nexport function renderPlaylistPage/,
  `return \`
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">Your Library</h1>
      </div>
      <div class="tab-list">
        <button class="tab-btn \${state.libraryTab === 'recent' ? 'active' : ''}" data-action="set-library-tab" data-value="recent" type="button">Recently Added</button>
        <button class="tab-btn \${state.libraryTab === 'favorites' ? 'active' : ''}" data-action="set-library-tab" data-value="favorites" type="button">Favorites</button>
        <button class="tab-btn \${state.libraryTab === 'playlists' ? 'active' : ''}" data-action="set-library-tab" data-value="playlists" type="button">Playlists</button>
      </div>
      \${tabContent}
    </section>
  \`;
}

export function renderPlaylistPage`
);

fs.writeFileSync('client/src/components/components.js', js);
