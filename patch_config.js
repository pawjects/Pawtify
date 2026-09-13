const fs = require('fs');
let js = fs.readFileSync('client/src/config/config.js', 'utf-8');

js = js.replace(
  /export const DISCOVERY_CATEGORIES = \[[\s\S]*?\];/,
  `export const DISCOVERY_CATEGORIES = [
  { title: 'Bollywood Top 50', query: 'Bollywood Top 50 hits official music' },
  { title: 'Punjabi Party', query: 'Punjabi pop party upbeat hits official' },
  { title: 'Desi Hip Hop', query: 'Desi hip hop Indian rap hits official' },
  { title: 'Sufi Soul', query: 'Sufi soulful relaxing music official' },
  { title: 'Indie India', query: 'Indian Indie acoustic pop official' },
  { title: 'Chill Vibes', query: 'Lofi Indian chill relaxing study vibes music' },
  { title: 'Late Night Drives', query: 'Bollywood late night drive midnight songs' },
  { title: 'Telugu Chartbusters', query: 'Telugu top hits official songs' },
  { title: 'Tamil Hits', query: 'Tamil superhit songs official' },
  { title: '90s Bollywood Nostalgia', query: '90s Bollywood romantic hits classic' },
];`
);

fs.writeFileSync('client/src/config/config.js', js);
