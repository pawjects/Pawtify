const fs = require('fs');
let js = fs.readFileSync('client/src/components/playerBar.js', 'utf-8');

js = js.replace(
  /fsSeek\.style\.background = \`linear-gradient\(90deg, var\(--green\) 0%, var\(--green-hover\) \$\{fsPct\}%, rgba\(255,255,255,0\.15\) \$\{fsPct\}%\)\`;\n\s*\}/,
  `fsSeek.style.background = \`linear-gradient(90deg, var(--green) 0%, var(--green-hover) \${fsPct}%, rgba(255,255,255,0.15) \${fsPct}%)\`;
  }
  
  const miniFill = document.querySelector('.mini-progress-fill');
  if (miniFill) {
    const maxVal = Math.max(1, Math.floor(state.duration || state.currentSong?.durationSec || 1));
    const pct = maxVal > 0 ? (Math.floor(state.progress || 0) / maxVal) * 100 : 0;
    miniFill.style.width = \`\${pct}%\`;
  }`
);

fs.writeFileSync('client/src/components/playerBar.js', js);
