const YTMusic = require("ytmusic-api");
const ytmusic = new YTMusic();

async function run() {
  await ytmusic.initialize();
  const results = await ytmusic.searchVideos("coldplay");
  console.log(JSON.stringify(results.slice(0, 2), null, 2));
}
run();
