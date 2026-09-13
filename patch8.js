const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.yt-player-container \{\n\s*position: fixed;\n\s*bottom: 12px;\n\s*right: 12px;\n\s*width: 280px;\n\s*height: 158px;\n\s*opacity: 0\.001;\n\s*pointer-events: none;\n\s*z-index: -1;\n\s*overflow: hidden;\n\s*border-radius: var\(--radius-md\);\n\s*background: #000;\n/,
  `.yt-player-container {
  position: fixed;
  bottom: 12px;
  right: 12px;
  width: 280px;
  height: 158px;
  opacity: 0.001;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: rgba(10, 10, 10, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
`
);

css = css.replace(
  /\.yt-player-container \.yt-player-header \{\n\s*display: none;\n\s*align-items: center;\n\s*justify-content: space-between;\n\s*padding: 6px 12px;\n\s*background: rgba\(18, 18, 18, 0\.95\);\n\s*border-bottom: 1px solid rgba\(255, 255, 255, 0\.1\);\n/,
  `.yt-player-container .yt-player-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-bottom: 1px solid var(--glass-border);
`
);

fs.writeFileSync('client/styles.css', css);
