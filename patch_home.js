const fs = require('fs');
let code = fs.readFileSync('client/src/components/home.js', 'utf-8');

code = code.replace(
  /const loaderHTML = [\s\S]*?if \(!state\.isLoading\) \{/,
  `
  let sectionsHTML = '';
  let gridHTML = '';

  if (state.isLoading) {
    gridHTML = Array(6).fill('').map(() => \`
      <div class="home-grid-card" style="pointer-events:none;">
        <div class="skeleton" style="width:56px; height:56px; flex-shrink:0;"></div>
        <div class="skeleton skeleton-text-main" style="width: 70%; margin: 0; border-radius: 4px; height: 14px;"></div>
      </div>
    \`).join('');

    sectionsHTML += Array(3).fill('').map(() => \`
      <div class="home-section">
        <div class="skeleton skeleton-text-main" style="width: 200px; height: 24px; margin-bottom: 16px; margin-left: 16px;"></div>
        <div class="home-scroll" style="display:flex; overflow:hidden; gap:16px; padding:0 16px;">
          \${Array(4).fill('').map(() => \`
            <div class="home-scroll-card" style="pointer-events:none; flex-shrink:0;">
              <div class="skeleton" style="width:140px; height:140px; border-radius:var(--radius-md); margin-bottom:12px;"></div>
              <div class="skeleton skeleton-text-main" style="width: 80%; margin: 0 0 8px 0; border-radius: 4px; height:14px;"></div>
              <div class="skeleton skeleton-text-sub" style="width: 50%; margin: 0; border-radius: 4px; height:12px;"></div>
            </div>
          \`).join('')}
        </div>
      </div>
    \`).join('');
  } else {
`
);

// We need to close the `} else {` at the end of the `if (!state.isLoading)` block.
// The block ends around the `return \` <section class="page">...`
code = code.replace(
  /\n  return \`\n    <section class="page">/,
  `\n  }\n  return \`\n    <section class="page">`
);

// We also need to add gridHTML to the template and remove the old ternary logic
code = code.replace(
  /<div class="home-grid">[\s\S]*?<\/div>/,
  '<div class="home-grid">${gridHTML || `\n      ${state.favorites.length ? renderHomeGridCard(state.favorites[0], \'favorites\') : \'\'}\n      ${state.playlists[0]?.songs?.length ? renderHomeGridCard(state.playlists[0].songs[0], \'playlist\', state.playlists[0].id) : \'\'}\n      ${heroCandidates.slice(0, 4).map((h) => renderHomeGridCard(h.song, h.source)).join(\'\')}\n    `}</div>'
);

fs.writeFileSync('client/src/components/home.js', code);
