const fs = require('fs');
let file = fs.readFileSync('client/src/services/apiMapping.js', 'utf-8');

file = file.replace(
  /uploaderName: x\.uploaderName \|\| '',/g,
  `uploaderName: typeof x.uploaderName === 'string' ? x.uploaderName : (Array.isArray(x.uploaderName) ? x.uploaderName.map(a => a.name || a).join(', ') : (x.uploaderName?.name || '')),`
);

file = file.replace(
  /name: x\.uploaderName \|\| x\.title \|\| 'Unknown Artist',/g,
  `name: (typeof x.uploaderName === 'string' ? x.uploaderName : (Array.isArray(x.uploaderName) ? x.uploaderName.map(a => a.name || a).join(', ') : x.uploaderName?.name)) || x.title || 'Unknown Artist',`
);

fs.writeFileSync('client/src/services/apiMapping.js', file);
