const fetch = require('undici').fetch;
async function run() {
  const res = await fetch('https://raw.githubusercontent.com/TeamPiped/Piped/refs/heads/trunk/instances.json');
  if (!res.ok) { console.log("Failed to fetch instances"); return; }
  const data = await res.json();
  const apis = data.map(i => i.api_url);
  for (const api of apis) {
    try {
      const st = await fetch(api + '/streams/lYBUbBu4W08');
      if (st.ok) {
        const json = await st.json();
        if (json.audioStreams && json.audioStreams.length > 0) {
          console.log("WORKING API:", api);
          console.log("URL:", json.audioStreams[0].url);
          return;
        }
      }
    } catch(e) {}
  }
}
run();
