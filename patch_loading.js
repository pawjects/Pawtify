const fs = require('fs');
let code = fs.readFileSync('docs/app.js', 'utf8');

const searchTarget = `
  function onPlayerStateChange(event) {
    if (event.data === 1) { // PLAYING
`;

code = code.replace(searchTarget, `
  function onPlayerStateChange(event) {
    if (event.data === 1) { // PLAYING
      if (ytLoadTimeout) { clearTimeout(ytLoadTimeout); ytLoadTimeout = null; }
`);

const searchOnError = `
        'onError': (e) => { 
          console.warn("YouTube Player Error:", e.data); 
          setTimeout(() => { nextTrack(); }, 2000); 
        }
`;

code = code.replace(searchOnError, `
        'onError': (e) => { 
          console.warn("YouTube Player Error:", e.data);
          handlePlaybackError();
        }
`);

const searchPlayDef1 = `
 async function play(song, queue = null, autoplay = true) {
`;

// Wait, I should make sure I only replace the actual play implementation.
// Let's first clean up the duplicate play function.
