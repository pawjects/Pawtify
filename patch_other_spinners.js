const fs = require('fs');
let code = fs.readFileSync('client/src/components/components.js', 'utf-8');

code = code.replace(
  /return '<section class="page"><div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"><\/div><h2>Loading Playlist...<\/h2><\/div><\/section>';/,
  `return \`<section class="page">
    <div class="page-header" style="display:flex; align-items:center; gap:24px; padding-bottom:24px;">
      <div class="skeleton" style="width:160px; height:160px; border-radius:var(--radius-md);"></div>
      <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
        <div class="skeleton skeleton-text-main" style="width:100px; height:14px; border-radius:4px;"></div>
        <div class="skeleton skeleton-text-main" style="width:60%; height:48px; border-radius:8px;"></div>
        <div class="skeleton skeleton-text-sub" style="width:40%; height:14px; border-radius:4px;"></div>
      </div>
    </div>
    <div class="song-table">\${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>
  </section>\`;`
);

fs.writeFileSync('client/src/components/components.js', code);

let artistCode = fs.readFileSync('client/src/components/artistProfile.js', 'utf-8');

artistCode = artistCode.replace(
  /\? '<div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"><\/div><h2>Loading...<\/h2><\/div>'/,
  `? \`<div class="song-table" style="padding:0 24px;">\${Array(6).fill('').map(() => \`
    <div class="skeleton-song-row">
      <div class="skeleton skeleton-cover-sm"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text-main" style="width: 60%;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 40%;"></div>
      </div>
    </div>
  \`).join('')}</div>\``
);

fs.writeFileSync('client/src/components/artistProfile.js', artistCode);
