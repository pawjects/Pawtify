const fetch = require('undici').fetch;
async function run() {
  const res = await fetch('https://piped-instances.kavin.rocks/');
  if (!res.ok) { console.log("Failed to fetch instances", res.status); return; }
  const data = await res.json();
  const apis = data.map(i => i.api_url);
  for (const api of apis) {
    console.log("Testing", api);
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
