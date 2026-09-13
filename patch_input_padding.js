const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /padding: 12px 16px 12px 44px;/,
  `padding: 12px 44px 12px 44px;`
);

fs.writeFileSync('client/styles.css', css);
