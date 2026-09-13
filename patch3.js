const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.btn-primary \{\n\s*background: var\(--text\);\n\s*color: var\(--black\);\n\}/,
  `.btn-primary {
  background: rgba(29, 185, 84, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(29, 185, 84, 0.4);
  color: #fff;
  box-shadow: 0 4px 12px rgba(29, 185, 84, 0.2);
}`
);

css = css.replace(
  /\.btn-soft \{\n\s*background: rgba\(255, 255, 255, 0\.1\);\n\s*color: var\(--text\);\n\}/,
  `.btn-soft {
  background: var(--glass-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  color: var(--text);
}`
);

css = css.replace(
  /\.pwa-install-banner \{\n\s*position: fixed;\n\s*bottom: 0;\n\s*left: 0;\n\s*right: 0;\n\s*z-index: 9999;\n\s*background: var\(--elevated\);\n\s*border-top: 1px solid var\(--border\);\n/,
  `.pwa-install-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: rgba(10, 10, 10, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top: 1px solid var(--glass-border);
`
);

css = css.replace(
  /\.pwa-install-btn \{\n\s*background: var\(--green\);\n\s*color: #000;\n/,
  `.pwa-install-btn {
  background: rgba(29, 185, 84, 0.8);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(29, 185, 84, 0.4);
  color: #fff;
`
);

fs.writeFileSync('client/styles.css', css);
