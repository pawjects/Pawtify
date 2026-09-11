const fs = require('fs');
let js = fs.readFileSync('docs/app.js', 'utf8');

js = js.replace('function renderCurrentRoute() {',
`function renderYoutubePage() {
  return \`
    <section class="page fade-in">
      <div class="page-header" style="text-align:center; padding:40px 20px; background: linear-gradient(180deg, rgba(255,0,0,0.15) 0%, transparent 100%); border-radius:12px; margin-bottom:24px;">
        <img src="https://raw.githubusercontent.com/pawjects/Pawtify/refs/heads/main/assets/pawtify.png" alt="Profile" style="width:100px; height:100px; border-radius:50%; margin:0 auto 16px; border:2px solid #ff0000;"/>
        <h1 class="page-title" style="margin-bottom:8px;">John Doe</h1>
        <p class="card-meta" style="font-size:1.1rem; color:var(--text-sub);">Region: United States • Free Tier</p>
      </div>

      <div class="card" style="padding:24px; margin-top:16px;">
        <h2 style="font-size:1.5rem; margin-bottom:16px; color:var(--text-main);"><i class="fa-solid fa-circle-info" style="color:var(--green); margin-right:8px;"></i> About Pawtify</h2>
        <p style="margin-bottom:12px; line-height:1.6; color:var(--text-sub);">
          Pawtify is a free, privacy-respecting music player. It allows you to search and play YouTube Music audio securely.
        </p>
        <p style="margin-bottom:12px; line-height:1.6; color:var(--text-sub);">
          No ads, no tracking. Enjoy your favorite tunes safely.
        </p>
        <div style="margin-top:24px; display:flex; gap:12px;">
           <button class="btn btn-primary" onclick="window.open('https://github.com/pawjects', '_blank')" type="button">Source Code</button>
        </div>
      </div>
    </section>
  \`;
}

function renderCurrentRoute() {`);

js = js.replace(/else if \(state\.route\.name === "search"\) \{[\s\S]*?appMain\.innerHTML = renderSearchPage\(\);[\s\S]*?\}/,
`else if (state.route.name === "search") {
    appMain.innerHTML = renderSearchPage();
  }
  else if (state.route.name === "youtube") {
    appMain.innerHTML = renderYoutubePage();
  }
  else if (state.route.name === "song") {
    appMain.innerHTML = \`<div class="empty-state"><div class="spinner"></div><h2>Loading track...</h2></div>\`;
    const songId = state.route.songId;
    fetch(\`/api/search?q=\${encodeURIComponent(songId)}\`)
      .then(res => res.json())
      .then(data => {
        if (!data || !data.items || data.items.length === 0) {
          showToast("Song not found.");
          navigate("/");
          return;
        }
        const song = data.items.find(i => i.videoId === songId || i.id === songId) || data.items[0];
        playSong({
          id: song.videoId || song.id,
          title: song.title,
          artist: song.artist || song.uploaderName,
          coverUrl: song.thumbnail,
          duration: song.durationString || song.duration
        }, "shared");
        navigate("/");
      })
      .catch(() => {
        showToast("Error loading track.");
        navigate("/");
      });
  }`);

fs.writeFileSync('docs/app.js', js);
