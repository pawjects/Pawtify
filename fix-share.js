const fs = require('fs');
let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace(/async function shareCurrentSong\(\) \{[\s\S]*?\}\n/, 
`async function shareCurrentSong() {
  if (!state.currentSong) return;
  const song = state.currentSong;
  const shareText = \`\${song.title} by \${song.artist} on Pawtify\`;
  const shareUrl = \`\${window.location.origin}\${window.location.pathname}#/song/\${song.id}\`;
  try {
    if (navigator.share) { await navigator.share({ title: song.title, text: shareText, url: shareUrl }); return; }
  } catch (error) { console.warn("Native share failed:", error); }
  try {
    await navigator.clipboard.writeText(\`\${shareText}\\n\${shareUrl}\`);
    showToast("Song link copied to clipboard.");
  } catch (err) {
    showToast("Failed to copy link.");
  }
}
`);

fs.writeFileSync('docs/app.js', js);
