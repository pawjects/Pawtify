const fs = require('fs');

let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace(/const moods = \[[\s\S]*?\];/, 
`const moods = [
    { name: 'Bollywood', color: '#ff4b4b' },
    { name: 'Desi Hip Hop', color: '#f59e0b' },
    { name: 'Ghazals', color: '#10b981' },
    { name: 'Punjabi Hits', color: '#3b82f6' },
    { name: 'Classical', color: '#8b5cf6' },
    { name: 'Sufi', color: '#ec4899' }
  ];`);

fs.writeFileSync('docs/app.js', js);
