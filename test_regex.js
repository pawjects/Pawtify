const fs = require('fs');
let code = fs.readFileSync('client/src/components/home.js', 'utf-8');
const match = code.match(/const loaderHTML = `<div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"><\/div><h2>Loading Music...<\/h2><\/div>`;\n  let sectionsHTML = state\.isLoading \? loaderHTML : '';\n  if \(\!state\.isLoading\) \{/);
console.log('Match found:', match !== null);
if (!match) {
  console.log(code.substring(code.indexOf('const loaderHTML'), code.indexOf('const loaderHTML') + 500));
}
