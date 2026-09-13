const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.app-container \{\n\s*display: grid;\n\s*grid-template-columns: var\(--sidebar-width\) 1fr;\n\s*grid-template-rows: 1fr auto;\n\s*grid-template-areas:\n\s*'sidebar main'\n\s*'player player';\n\s*height: 100vh;\n\s*height: 100dvh;\n\s*width: 100vw;\n\s*overflow: hidden;\n\}/,
  `.app-container {
  display: grid;
  grid-template-columns: var(--sidebar-width) 1fr;
  grid-template-rows: 1fr auto;
  grid-template-areas:
    'sidebar main'
    'player player';
  height: 100vh;
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  padding: 12px;
  gap: 12px;
  box-sizing: border-box;
}`
);

css = css.replace(
  /\.sidebar \{\n\s*grid-area: sidebar;\n\s*background: var\(--glass-surface\);\n\s*backdrop-filter: blur\(20px\);\n\s*-webkit-backdrop-filter: blur\(20px\);\n\s*border-right: 1px solid var\(--glass-border\);\n/,
  `.sidebar {
  grid-area: sidebar;
  background: var(--glass-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
`
);

css = css.replace(
  /\.player-bar \{\n\s*grid-area: player;\n\s*background: rgba\(10, 10, 10, 0\.65\);\n\s*backdrop-filter: blur\(24px\);\n\s*-webkit-backdrop-filter: blur\(24px\);\n\s*border-top: 1px solid var\(--glass-border\);\n\s*box-shadow: 0 -8px 32px rgba\(0, 0, 0, 0\.2\);\n/,
  `.player-bar {
  grid-area: player;
  background: rgba(10, 10, 10, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`
);

css = css.replace(
  /\.main-stage \{\n\s*grid-area: main;\n\s*overflow-y: auto;\n\s*background: transparent;\n\s*position: relative;\n\}/,
  `.main-stage {
  grid-area: main;
  overflow-y: auto;
  background: var(--glass-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  position: relative;
}`
);

fs.writeFileSync('client/styles.css', css);
