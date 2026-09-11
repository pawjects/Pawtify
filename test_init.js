const YTMusic = require("ytmusic-api");
async function test() {
  const yt = new YTMusic();
  await yt.initialize({ gl: 'IN', hl: 'hi' });
  const results = await yt.searchSongs("classical");
  console.log(results[0].name, results[0].artist.name);
}
test();
