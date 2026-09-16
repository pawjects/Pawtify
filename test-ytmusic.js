const YTMusic = require('ytmusic-api');
const ytmusic = new YTMusic();
ytmusic.initialize().then(() => ytmusic.searchSongs('Never gonna give you up')).then(res => {
  return ytmusic.getSong(res[0].videoId);
}).then(song => {
  console.log(song);
}).catch(err => {
  console.log('error:', err.message);
});
