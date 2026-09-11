const fs = require('fs');

let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace(/function renderYoutubePage\(\) \{[\s\S]*?\}\n\nfunction renderCurrentRoute/, 'function renderCurrentRoute');
js = js.replace(/else if \(state\.route\.name === "youtube"\) \{\s*appMain\.innerHTML = renderYoutubePage\(\);\s*\}/, '');

fs.writeFileSync('docs/app.js', js);
