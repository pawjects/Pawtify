const YTMusic = require('ytmusic-api');
const ytmusic = new YTMusic();
ytmusic.initialize().then(() => ytmusic.constructRequest("player", { videoId: 'lYBUbBu4W08' }).then(console.log));
