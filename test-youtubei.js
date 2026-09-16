const { Innertube, UniversalCache } = require('youtubei.js');
async function run() {
  try {
    const yt = await Innertube.create({ cache: new UniversalCache(false) });
    const info = await yt.getBasicInfo('lYBUbBu4W08');
    const formats = info.streaming_data?.formats || [];
    const adaptive = info.streaming_data?.adaptive_formats || [];
    const all = [...formats, ...adaptive].filter(f => f.has_audio);
    const bestAudio = all.find(f => !f.has_video && f.has_audio);
    console.log("Audio URL:", bestAudio ? bestAudio.url || bestAudio.signature_cipher : "None");
  } catch (err) {
    console.error(err.message);
  }
}
run();
