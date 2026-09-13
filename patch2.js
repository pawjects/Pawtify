const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.mini-player \{\n\s*display: none;\n\s*position: fixed;\n\s*bottom: var\(--mobile-nav-height\);\n\s*left: 0;\n\s*width: 100%;\n\s*height: var\(--mini-player-height\);\n\s*background: var\(--elevated\);\n\s*border-top: 1px solid var\(--border\);\n\s*border-bottom: 1px solid var\(--border\);\n\s*padding: 0 16px;\n\s*z-index: 50;\n\}/,
  `.mini-player {
  display: none;
  position: fixed;
  bottom: calc(var(--mobile-nav-height) + 8px);
  left: 8px;
  width: calc(100% - 16px);
  height: var(--mini-player-height);
  background: rgba(20, 20, 20, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  box-shadow: var(--glass-shadow);
  padding: 0 16px;
  z-index: 50;
}`
);

css = css.replace(
  /\.mobile-nav \{\n\s*display: none;\n\s*position: fixed;\n\s*bottom: 0;\n\s*left: 0;\n\s*width: 100%;\n\s*height: var\(--mobile-nav-height\);\n\s*background: rgba\(18, 18, 18, 0\.95\);\n\s*backdrop-filter: blur\(10px\);\n\s*-webkit-backdrop-filter: blur\(10px\);\n\s*grid-template-columns: repeat\(4, 1fr\);\n\s*border-top: 1px solid var\(--border\);\n\s*z-index: 40;\n\s*padding-bottom: env\(safe-area-inset-bottom\);\n\}/,
  `.mobile-nav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  height: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom));
  background: rgba(10, 10, 10, 0.65);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  grid-template-columns: repeat(4, 1fr);
  border-top: 1px solid var(--glass-border);
  z-index: 40;
  padding-bottom: env(safe-area-inset-bottom);
}`
);

css = css.replace(
  /\.modal \{\n\s*background: var\(--elevated\);\n\s*width: 100%;\n\s*max-width: 440px;\n\s*border-radius: var\(--radius-lg\);\n\s*padding: 24px;\n\s*position: relative;\n\s*box-shadow: 0 16px 40px rgba\(0, 0, 0, 0\.5\);\n\s*z-index: 1001;\n\s*animation: modalSlide 0\.3s ease;\n\}/,
  `.modal {
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  width: 100%;
  max-width: 440px;
  border-radius: var(--radius-lg);
  padding: 24px;
  position: relative;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
  z-index: 1001;
  animation: modalSlide 0.3s ease;
}`
);

css = css.replace(
  /\.search-input \{\n\s*width: 100%;\n\s*background: var\(--elevated\);\n\s*border: 1px solid transparent;\n\s*border-radius: 999px;\n\s*padding: 12px 16px 12px 44px;\n\s*color: var\(--text\);\n\s*font-size: 0\.875rem;\n\s*outline: none;\n\s*transition:\n\s*border-color 0\.2s,\n\s*box-shadow 0\.2s;\n\}/,
  `.search-input {
  width: 100%;
  background: var(--glass-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  padding: 12px 16px 12px 44px;
  color: var(--text);
  font-size: 0.875rem;
  outline: none;
  transition:
    background 0.2s,
    border-color 0.2s,
    box-shadow 0.2s;
}`
);

css = css.replace(
  /\.search-dropdown \{\n\s*position: absolute;\n\s*top: 100%;\n\s*left: 0;\n\s*width: 100%;\n\s*background-color: var\(--surface\);\n\s*border: 1px solid var\(--border\);\n\s*border-radius: 12px;\n\s*box-shadow: 0 8px 24px rgba\(0, 0, 0, 0\.4\);\n\s*margin-top: 8px;\n/,
  `.search-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background: rgba(30, 30, 30, 0.7);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: 12px;
  box-shadow: var(--glass-shadow);
  margin-top: 8px;
`
);

fs.writeFileSync('client/styles.css', css);
