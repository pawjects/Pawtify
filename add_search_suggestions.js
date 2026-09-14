const fs = require('fs');
let file = fs.readFileSync('client/src/services/apiMapping.js', 'utf8');
const addFunc = `
export async function fetchSearchSuggestions(query) {
  try {
    const res = await fetch(\`/api/search?q=\${encodeURIComponent(query)}&type=suggestions\`);
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    return [];
  }
}
`;
fs.writeFileSync('client/src/services/apiMapping.js', file + '\n' + addFunc);
console.log('Added fetchSearchSuggestions to apiMapping.js');
