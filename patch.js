const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /:root \{[\s\S]*?\}/,
  `:root {
  --black: #050505;
  --dark-gray: rgba(18, 18, 18, 0.5);
  --elevated: rgba(255, 255, 255, 0.05);
  --hover: rgba(255, 255, 255, 0.1);
  --border: rgba(255, 255, 255, 0.08);
  --glass-surface: rgba(20, 20, 20, 0.6);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  --text: #ffffff;
  --muted: rgba(255, 255, 255, 0.65);
  --green: #1db954;
  --green-hover: #1ed760;
  --font-display: 'Playfair Display', Georgia, serif;
  --danger: #e22134;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --sidebar-width: 260px;
  --player-height: 96px;
  --mini-player-height: 72px;
  --mobile-nav-height: 68px;
}`
);

css = css.replace(
  /body \{[\s\S]*?overscroll-behavior-y: none;\n\}/,
  `body {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
  background-color: var(--black);
  background-image: 
    radial-gradient(circle at 15% 15%, rgba(29, 185, 84, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(29, 185, 84, 0.1) 0%, transparent 40%);
  background-attachment: fixed;
  color: var(--text);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior-y: none;
}`
);

css = css.replace(
  /\.sidebar \{\n\s*grid-area: sidebar;\n\s*background: var\(--black\);\n/,
  `.sidebar {
  grid-area: sidebar;
  background: var(--glass-surface);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid var(--glass-border);
`
);

css = css.replace(
  /\.player-bar \{\n\s*grid-area: player;\n\s*background: var\(--black\);\n\s*border-top: 1px solid var\(--border\);\n\s*padding: 12px 16px;/,
  `.player-bar {
  grid-area: player;
  background: rgba(10, 10, 10, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid var(--glass-border);
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  position: relative;
  z-index: 100;`
);

css = css.replace(
  /\.main-stage \{\n\s*grid-area: main;\n\s*overflow-y: auto;\n\s*background: linear-gradient\(to bottom, rgba\(255, 255, 255, 0\.05\) 0%, var\(--dark-gray\) 200px\);\n\s*position: relative;\n\}/,
  `.main-stage {
  grid-area: main;
  overflow-y: auto;
  background: transparent;
  position: relative;
}`
);

css = css.replace(
  /\.card \{\n\s*background: var\(--elevated\);\n\s*border-radius: var\(--radius-md\);\n\s*padding: 16px;\n/,
  `.card {
  background: var(--glass-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--glass-shadow);
  border-radius: var(--radius-md);
  padding: 16px;
`
);

css = css.replace(
  /\.card:hover \{\n\s*background: var\(--hover\);\n\s*transform: translateY\(-3px\);\n\s*box-shadow: 0 8px 24px rgba\(0, 0, 0, 0\.3\);\n\}/,
  `.card:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
}`
);

css = css.replace(
  /\.song-row:hover \{\n\s*background: rgba\(255, 255, 255, 0\.05\);\n\}/,
  `.song-row:hover {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
}`
);

css = css.replace(
  /\.song-row\.active \{\n\s*background: rgba\(255, 255, 255, 0\.08\);\n\}/,
  `.song-row.active {
  background: rgba(29, 185, 84, 0.15);
  backdrop-filter: blur(8px);
  border-left: 3px solid var(--green);
}`
);

css = css.replace(
  /\.song-row\.active \{\n\s*background: rgba\(29, 185, 84, 0\.08\);\n\s*border-left: 3px solid var\(--green\);\n\}/,
  ""
); // Clean up duplicate from animations section

fs.writeFileSync('client/styles.css', css);
