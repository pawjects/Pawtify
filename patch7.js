const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.hero-player \{\n\s*display: grid;\n\s*grid-template-columns: auto 1fr;\n\s*gap: 32px;\n\s*align-items: end;\n\s*padding: 40px 32px 24px;\n\s*background: linear-gradient\([\s\S]*?\);\n\s*border-radius: 0 0 var\(--radius-xl\) var\(--radius-xl\);\n\s*margin: -32px -32px 0;\n\}/,
  `.hero-player {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 32px;
  align-items: end;
  padding: 40px 32px 24px;
  background: linear-gradient(
    180deg,
    rgba(29, 185, 84, 0.2) 0%,
    transparent 100%
  );
  border-bottom: 1px solid var(--glass-border);
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
  margin: -32px -32px 0;
}`
);

fs.writeFileSync('client/styles.css', css);
