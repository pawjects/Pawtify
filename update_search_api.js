const fs = require('fs');
let file = fs.readFileSync('server/api/search.js', 'utf8');

file = file.replace(
  "if (type === 'playlist_videos') {",
  "if (type === 'suggestions') {\n      const results = await ytmusic.getSearchSuggestions(query).catch(() => []);\n      return res.status(200).json({ items: results });\n    } else if (type === 'playlist_videos') {"
);

fs.writeFileSync('server/api/search.js', file);
console.log('server/api/search.js updated');
