const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.fullscreen-player \{\n\s*position: fixed;\n\s*inset: 0;\n\s*z-index: 90;\n\s*background: var\(--dark-gray\);\n\s*display: flex;\n\s*flex-direction: column;\n\s*transform: translateY\(100%\);\n\s*transition: transform 0\.35s cubic-bezier\(0\.32, 0\.72, 0, 1\);\n\s*overflow: hidden;\n\}/,
  `.fullscreen-player {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: #050505;
  display: flex;
  flex-direction: column;
  transform: translateY(100%);
  transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1);
  overflow: hidden;
}`
);

css = css.replace(
  /\.fs-backdrop \{\n\s*position: absolute;\n\s*inset: 0;\n\s*background: linear-gradient\([\s\S]*?\);\n\s*pointer-events: none;\n\}/,
  `.fs-backdrop {
  position: absolute;
  inset: 0;
  filter: blur(60px) brightness(0.5) saturate(1.8);
  transform: scale(1.2);
  pointer-events: none;
  background-position: center;
  background-size: cover;
  z-index: 0;
}
.fs-backdrop::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(5,5,5,1) 90%);
}
.fs-content {
  z-index: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}`
);

fs.writeFileSync('client/styles.css', css);
