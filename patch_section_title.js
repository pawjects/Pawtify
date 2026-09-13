const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /\.home-section-title \{\n\s*font-size: 1\.25rem;\n\s*font-weight: 800;\n\s*letter-spacing: -0\.01em;\n\}/,
  `.home-section-title {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
  margin-bottom: 20px;
}`
);

fs.writeFileSync('client/styles.css', css);
