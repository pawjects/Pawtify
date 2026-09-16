const play = require('play-dl');
play.stream('lYBUbBu4W08').then(stream => console.log('url:', stream.url)).catch(err => console.error(err.message));
