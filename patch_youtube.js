const fs = require('fs');
let file = fs.readFileSync('client/src/services/youtube.js', 'utf8');

// Remove setupBackgroundPlayback completely
file = file.replace(/export function setupBackgroundPlayback\(\) \{[\s\S]*?\}\n/, '');

// Clean up visibilitychange if it's outside setupBackgroundPlayback?
// Wait, the visibilitychange is inside setupBackgroundPlayback!
