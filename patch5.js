const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.mobile-nav \{\n\s*display: none;\n\s*position: fixed;\n\s*bottom: 0;\n\s*left: 0;\n\s*right: 0;\n\s*z-index: 60;\n\s*background: var\(--black\);\n\s*border-top: 1px solid var\(--border\);\n\s*height: var\(--mobile-nav-height\);\n\s*padding-bottom: env\(safe-area-inset-bottom\);\n\s*grid-template-columns: repeat\(3, 1fr\);\n\s*place-items: center;\n\}/,
  `.mobile-nav {
  display: none;
  position: fixed;
  bottom: calc(env(safe-area-inset-bottom) + 12px);
  left: 12px;
  right: 12px;
  z-index: 60;
  background: rgba(20, 20, 20, 0.75);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--glass-shadow);
  height: var(--mobile-nav-height);
  grid-template-columns: repeat(3, 1fr);
  place-items: center;
}`
);

css = css.replace(
  /\.mini-player \{\n\s*display: none;\n\s*position: fixed;\n\s*left: 0;\n\s*right: 0;\n\s*bottom: var\(--mobile-nav-height\);\n\s*z-index: 55;\n\s*background: var\(--black\);\n\s*border-top: 1px solid var\(--border\);\n\s*padding: 0;\n\s*height: var\(--mini-player-height\);\n\}/,
  `.mini-player {
  display: none;
  position: fixed;
  left: 12px;
  right: 12px;
  bottom: calc(var(--mobile-nav-height) + env(safe-area-inset-bottom) + 24px);
  z-index: 55;
  background: rgba(30, 30, 30, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  box-shadow: var(--glass-shadow);
  padding: 0;
  height: var(--mini-player-height);
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

fs.writeFileSync('client/styles.css', css);
