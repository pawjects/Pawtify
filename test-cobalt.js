const fetch = require('undici').fetch;
fetch('https://api.cobalt.tools/api/json', {
  method: 'POST',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://www.youtube.com/watch?v=lYBUbBu4W08',
    isAudioOnly: true
  })
}).then(res => res.json()).then(console.log).catch(console.error);
