const fs = require('fs');
let code = fs.readFileSync('client/src/components/home.js', 'utf-8');

code = code.replace(
  /const loaderHTML = \`<div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"><\/div><h2>Loading Music...<\/h2><\/div>\`;\n  let sectionsHTML = state\.isLoading \? loaderHTML : '';\n  if \(\!state\.isLoading\) \{/,
  `
  let sectionsHTML = '';
  let gridHTML = '';

  if (state.isLoading) {
    gridHTML = Array(6).fill('').map(() => \`
      <div class="home-grid-card" style="pointer-events:none;">
        <div class="skeleton" style="width:56px; height:56px; flex-shrink:0;"></div>
        <div class="skeleton skeleton-text-main" style="width: 70%; margin: 0;"></div>
      </div>
    \`).join('');

    sectionsHTML += Array(3).fill('').map(() => \`
      <div class="home-section">
        <div class="skeleton skeleton-text-main" style="width: 200px; height: 24px; margin-bottom: 16px; margin-left: 16px;"></div>
        <div class="home-scroll" style="display:flex; overflow:hidden; gap:16px; padding:0 16px;">
          \${Array(4).fill('').map(() => \`
            <div class="home-scroll-card" style="pointer-events:none;">
              <div class="skeleton" style="width:140px; height:140px; border-radius:var(--radius-md); margin-bottom:12px; aspect-ratio: 1/1;"></div>
              <div class="skeleton skeleton-text-main" style="width: 80%; margin: 0 0 8px 0; border-radius: 4px;"></div>
              <div class="skeleton skeleton-text-sub" style="width: 50%; margin: 0; border-radius: 4px;"></div>
            </div>
          \`).join('')}
        </div>
      </div>
    \`).join('');
  } else {
    gridHTML = \`
      \${state.favorites.length ? renderHomeGridCard(state.favorites[0], 'favorites') : ''}
      \${state.playlists[0]?.songs?.length ? renderHomeGridCard(state.playlists[0].songs[0], 'playlist', state.playlists[0].id) : ''}
      \${heroCandidates.slice(0, 4).map((h) => renderHomeGridCard(h.song, h.source)).join('')}
    \`;
`
);

code = code.replace(
  /\<div class="home-grid"\>\n\s*\$\{state\.favorites\.length \? renderHomeGridCard\(state\.favorites\[0\], 'favorites'\) : ''\}\n\s*\$\{state\.playlists\[0\]\?\.songs\?\.length \? renderHomeGridCard\(state\.playlists\[0\]\.songs\[0\], 'playlist', state\.playlists\[0\]\.id\) : ''\}\n\s*\$\{heroCandidates\n\s*\.slice\(0, 4\)\n\s*\.map\(\(h\) => renderHomeGridCard\(h\.song, h\.source\)\)\n\s*\.join\(''\)\}\n\s*\<\/div\>/,
  '<div class="home-grid">${gridHTML}</div>'
);

fs.writeFileSync('client/src/components/home.js', code);
