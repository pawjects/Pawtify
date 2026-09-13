const fs = require('fs');
let css = fs.readFileSync('client/styles.css', 'utf-8');

css = css.replace(
  /padding: 10px 14px 10px 40px;/,
  `padding: 10px 40px 10px 40px;`
);

fs.writeFileSync('client/styles.css', css);
