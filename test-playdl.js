const play = require('play-dl');
play.stream('https://www.youtube.com/watch?v=lYBUbBu4W08').then(stream => {
  console.log(stream.url);
}).catch(console.error);
