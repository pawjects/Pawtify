const fs = require('fs');
let js = fs.readFileSync('client/src/services/youtube.js', 'utf-8');

js = js.replace(
  /setInterval\(\(\) => \{\n\s*if \(state\.isPlaying\) \{\n\s*if \(globals\.ytPlayerReady && globals\.ytPlayer\) \{\n\s*try \{\n\s*if \(globals\.ytPlayer\.getPlayerState\(\) === 2\)\n\s*globals\.ytPlayer\.playVideo\(\);\n\s*\} catch \(e\) \{\}\n\s*\}\n\s*\}\n\s*\}, 2000\);/g,
  `// Removed aggressive 2s playback enforcement loop to prevent race conditions`
);

js = js.replace(
  /\} else if \(event\.data === 2\) \{\n\s*\/\/ PAUSED\n\s*if \(\!document\.hidden\) \{\n\s*state\.isPlaying = false;\n\s*if \(navigator\.mediaSession\)\n\s*navigator\.mediaSession\.playbackState = 'paused';\n\s*\}\n\s*clearInterval\(globals\.ytPollInterval\);\n\s*\}/g,
  `} else if (event.data === 2) {
    // PAUSED
    state.isPlaying = false;
    if (navigator.mediaSession) {
      navigator.mediaSession.playbackState = 'paused';
    }
    clearInterval(globals.ytPollInterval);
  }`
);

fs.writeFileSync('client/src/services/youtube.js', js);
