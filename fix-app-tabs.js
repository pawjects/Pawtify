const fs = require('fs');

let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace(/   if \(normalized === "\/youtube"\) return \{ name: "youtube", playlistId: null \};\n/, '');

js = js.replace(/ \|\|\n      \(route === "\/youtube" && state.route.name === "youtube"\)/g, '');

fs.writeFileSync('docs/app.js', js);
