const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /@media \(max-width: 900px\) \{\n\s*:root \{\n\s*--player-height: 0px;\n\s*\}\n\s*\.app-container \{\n\s*grid-template-columns: 1fr;\n\s*grid-template-rows: 1fr auto;\n\s*grid-template-areas:\n\s*'main'\n\s*'player';\n\s*\}/,
  `@media (max-width: 900px) {
  :root {
    --player-height: 0px;
  }
  .app-container {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
    grid-template-areas:
      'main'
      'player';
    padding: 0;
    gap: 0;
  }
  .main-stage {
    border-radius: 0;
    border: none;
  }`
);

fs.writeFileSync('client/styles.css', css);
