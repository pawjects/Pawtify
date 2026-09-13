const fs = require('fs');
let file = fs.readFileSync('client/src/services/youtube.js', 'utf-8');

file = file.replace(
  /export function mapServerSong\(x\) \{[\s\S]*$/,
  `export function mapServerSong(x) {
  if (!x || !x.id) return null;
  
  let artistName = 'Unknown Artist';
  if (typeof x.uploaderName === 'string') {
    artistName = x.uploaderName;
  } else if (Array.isArray(x.uploaderName)) {
    artistName = x.uploaderName.map(a => a.name || a).join(', ');
  } else if (x.uploaderName && typeof x.uploaderName === 'object') {
    artistName = x.uploaderName.name || 'Unknown Artist';
  } else if (x.artist) {
    if (typeof x.artist === 'string') artistName = x.artist;
    else if (Array.isArray(x.artist)) artistName = x.artist.map(a => a.name || a).join(', ');
    else if (typeof x.artist === 'object') artistName = x.artist.name || 'Unknown Artist';
  }

  return {
    id: x.id,
    title: x.title || 'Unknown Song',
    artist: artistName,
    album: 'Single',
    coverUrl: x.thumbnail || \`https://i.ytimg.com/vi/\${x.id}/hqdefault.jpg\`,
    audioUrl: x.id,
    durationSec: x.duration || 0,
    duration: x.durationString || '',
    releaseDate: '',
    genre: 'Streaming',
  };
}`
);

fs.writeFileSync('client/src/services/youtube.js', file);
