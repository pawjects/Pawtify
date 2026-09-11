const fs = require('fs');

let js = fs.readFileSync('docs/app.js', 'utf8');

// Update search queries
js = js.replace(
  /fetch\(\`\/api\/search\?q=official\+top\+hits\+english\+music\+video\`\)/,
  'fetch(`/api/search?q=classical+semi+classical+hindi+music`)'
);
js = js.replace(
  /fetch\(\`\/api\/search\?q=official\+indie\+music\+video\`\)/,
  'fetch(`/api/search?q=indian+indie+bollywood+music`)'
);
js = js.replace(
  /fetch\(\`\/api\/search\?q=official\+pop\+hits\+music\+video\`\)/,
  'fetch(`/api/search?q=lofi+bollywood+mashup+music`)'
);

// Update headings in renderHomePage
js = js.replace(
  /<h2 class="home-section-title"><i class="fa-solid fa-fire" style="margin-right:8px; color:var\(--green\);"><\/i>Trending Now<\/h2>/,
  '<h2 class="home-section-title"><i class="fa-solid fa-om" style="margin-right:8px; color:var(--green);"></i>Classical & Semi Classical</h2>'
);

js = js.replace(
  /<h2 class="home-section-title"><i class="fa-solid fa-guitar" style="margin-right:8px; color:var\(--green\);"><\/i>Indie Hits<\/h2>/,
  '<h2 class="home-section-title"><i class="fa-solid fa-guitar" style="margin-right:8px; color:var(--green);"></i>Indian Indie</h2>'
);

js = js.replace(
  /<h2 class="home-section-title"><i class="fa-solid fa-globe" style="margin-right:8px; color:var\(--green\);"><\/i>Global Top 50<\/h2>/,
  '<h2 class="home-section-title"><i class="fa-solid fa-headphones" style="margin-right:8px; color:var(--green);"></i>Lofi Bollywood</h2>'
);

fs.writeFileSync('docs/app.js', js);
