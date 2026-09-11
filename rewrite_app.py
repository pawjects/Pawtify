import re

with open('orig_app.js', 'r') as f:
    content = f.read()

# 1. Replace Piped Network Layer
old_network = """/* ================================================================
   PIPED API NETWORK LAYER
================================================================ */
let apiBase = null;
const FALLBACK_APIS = ["""
network_start = content.find(old_network)
network_end = content.find("/* ================================================================\n   RENDER: CARDS & ROWS")
if network_start != -1 and network_end != -1:
    new_network = """/* ================================================================
   API NETWORK LAYER
================================================================ */
function mapServerSong(x) {
  if (!x || !x.id) return null;
  return {
    id: x.id,
    title: x.title || "Unknown Song",
    artist: x.uploaderName || "YouTube Artist",
    album: "Single",
    coverUrl: x.thumbnail || `https://i.ytimg.com/vi/${x.id}/hqdefault.jpg`,
    audioUrl: x.id,
    durationSec: x.duration || 0,
    duration: x.durationString || "",
    releaseDate: "",
    genre: "Streaming"
  };
}

async function loadTrendingSongs() {
  try {
    const results = await Promise.allSettled([
      fetch(`/api/search?q=trending+pop+music`),
      fetch(`/api/search?q=indie+acoustic+songs`),
      fetch(`/api/search?q=top+hits+english`)
    ]);
    const parseSafe = (res) => (res && res.items) ? res.items.map(mapServerSong).filter(s => s && s.id) : [];
    
    state.trendingSongs = parseSafe(results[0].status === 'fulfilled' ? await results[0].value.json() : null);
    state.indieSongs = parseSafe(results[1].status === 'fulfilled' ? await results[1].value.json() : null);
    state.englishSongs = parseSafe(results[2].status === 'fulfilled' ? await results[2].value.json() : null);
    
    const all = dedupeSongs([...state.trendingSongs, ...state.indieSongs, ...state.englishSongs]);
    rememberSongs(all);
    if (!state.currentSong && all.length && !state.queue.length) {
      state.queue = dedupeSongs(all);
      saveJSON(STORAGE.QUEUE, state.queue);
    }
  } catch (error) { console.error(error); } finally {
    state.isLoading = false;
    renderCurrentRoute();
  }
}

async function searchSongs(query, page = 0, limit = 10) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map(mapServerSong).filter(s => s && s.id);
  } catch (e) { return []; }
}

async function searchArtists(query, page = 0, limit = 10) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map(x => ({
      id: x.id,
      name: x.uploaderName || x.title || "Unknown Artist",
      imageUrl: x.thumbnail || "https://raw.githubusercontent.com/pawjects/Pawtify/refs/heads/main/assets/pawtify.png",
      type: "Artist",
      bio: ""
    }));
  } catch (e) { return []; }
}

async function getSongRecommendations(id, limit = 10) {
  if (!state.currentSong) return [];
  const query = state.currentSong.artist + " " + state.currentSong.title;
  return await searchSongs(query, 0, limit);
}

async function getNextSong(currentSongId) {
  if (!currentSongId) {
    const trending = state.trendingSongs.length ? state.trendingSongs : [];
    if (!trending.length) return null;
    return trending[Math.floor(Math.random() * trending.length)];
  }
  const suggestions = await getSongRecommendations(currentSongId, 14);
  const next = suggestions.find(song => !state.recentlyPlayed.includes(song.id));
  return next || suggestions[0] || null;
}
"""
    content = content[:network_start] + new_network + "\n\n" + content[network_end:]


# 2. Update YouTube Iframe API initialization
old_yt_init = """    host: 'https://www.youtube.com',
    playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'playsinline': 1, 'fs': 0, 'rel': 0, 'origin': window.location.origin },"""
new_yt_init = """    host: 'https://www.youtube-nocookie.com',
    playerVars: { 'autoplay': 0, 'controls': 0, 'disablekb': 1, 'playsinline': 1, 'fs': 0, 'rel': 0, 'origin': window.location.origin, 'enablejsapi': 1 },"""
content = content.replace(old_yt_init, new_yt_init)

# Add fallback auto-skip for unplayable embed
content = content.replace('function onPlayerError(event) {\n  console.warn("YouTube Player Error:", event.data);\n}', 'function onPlayerError(event) {\n  console.warn("YouTube Player Error:", event.data);\n  setTimeout(() => { nextTrack(); }, 2000);\n}')

# 3. Rip out Direct Audio Engine
audio_engine_start = content.find("/* ================================================================\n   DIRECT AUDIO ENGINE (for background playback via <audio> element)")
audio_engine_end = content.find("/* ================================================================\n   STATE & LOCAL STORAGE")
if audio_engine_start != -1 and audio_engine_end != -1:
    content = content[:audio_engine_start] + "\n\n" + content[audio_engine_end:]

# Remove unused vars from state block
content = content.replace('let audioEl = null;\nlet useAudioEl = false;\nlet audioStreamCache = new Map();', 'let useAudioEl = false;')

# 4. Fix play() function
old_play_start = content.find("async function play(song, queue = null, autoplay = true) {")
old_play_end = content.find("function pause() {")
if old_play_start != -1 and old_play_end != -1:
    new_play = """async function play(song, queue = null, autoplay = true) {
  if (!song) return;
  let playableSong = song;
  rememberSongs([playableSong]);
  state.currentSong = playableSong;
  if (queue?.length) {
    state.queue = dedupeSongs(queue);
    const index = state.queue.findIndex((item) => item.id === playableSong.id);
    state.currentSongIndex = index >= 0 ? index : 0;
  } else {
    const index = state.queue.findIndex((item) => item.id === playableSong.id);
    if (index >= 0) state.currentSongIndex = index;
    else {
      state.queue = dedupeSongs([playableSong, ...state.queue]);
      state.currentSongIndex = 0;
    }
  }
  state.progress = 0;
  state.duration = playableSong.durationSec || 0;
  state.isPlaying = autoplay;
  saveJSON(STORAGE.CURRENT_TIME, 0);
  updateMediaSession(playableSong);
  if (navigator.mediaSession) navigator.mediaSession.playbackState = autoplay ? 'playing' : 'paused';
  useAudioEl = false;
  if (ytPlayerReady && ytPlayer) {
    if (autoplay) ytPlayer.loadVideoById(playableSong.id);
    else ytPlayer.cueVideoById(playableSong.id);
  } else {
    pendingVideoId = playableSong.id;
    pendingAutoplay = autoplay;
  }
  addRecentlyPlayed(playableSong.id);
  persistPlayer();
  renderCurrentRoute();
}

"""
    content = content[:old_play_start] + new_play + content[old_play_end:]

# 5. Fix pause, togglePlay, seekTo, setVolume
content = re.sub(r'function pause\(\) \{.*?\n\}', """function pause() {
  if (ytPlayerReady && ytPlayer && ytPlayer.getIframe) {
    try {
      ytPlayer.pauseVideo();
      const iframe = ytPlayer.getIframe();
      if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), '*');
    } catch(e) {}
  }
  state.isPlaying = false;
  if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
  persistPlayer();
  refreshPlaybackUI();
}""", content, flags=re.DOTALL)

content = re.sub(r'async function togglePlay\(\) \{.*?\n\}', """async function togglePlay() {
  if (!state.currentSong) { await playSomething(); return; }
  if (state.isPlaying) pause();
  else {
    if (ytPlayerReady && ytPlayer && ytPlayer.getIframe) {
      try {
        ytPlayer.playVideo();
        const iframe = ytPlayer.getIframe();
        if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'playVideo', args: [] }), '*');
      } catch(e) {}
    }
    state.isPlaying = true;
  }
  persistPlayer();
  refreshPlaybackUI();
}""", content, flags=re.DOTALL)

content = re.sub(r'function seekTo\(seconds\) \{.*?\n\}', """function seekTo(seconds) {
  if (!Number.isFinite(seconds)) return;
  if (ytPlayerReady && ytPlayer && ytPlayer.getIframe) {
    try {
      ytPlayer.seekTo(seconds, true);
      const iframe = ytPlayer.getIframe();
      if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }), '*');
    } catch(e) {}
  }
  state.progress = Math.max(0, seconds);
  saveJSON(STORAGE.CURRENT_TIME, state.progress);
  refreshPlaybackUI();
}""", content, flags=re.DOTALL)

content = re.sub(r'function setVolume\(value\) \{.*?\n\}', """function setVolume(value) {
  const clamped = Math.max(0, Math.min(1, value));
  state.volume = clamped;
  if (ytPlayerReady && ytPlayer) ytPlayer.setVolume(clamped * 100);
  saveJSON(STORAGE.VOLUME, clamped);
  refreshPlaybackUI();
}""", content, flags=re.DOTALL)

# 6. Fix startYTPoll
old_poll_start = content.find("function startYTPoll() {")
old_poll_end = content.find("function onPlayerStateChange(event) {")
if old_poll_start != -1 and old_poll_end != -1:
    new_poll = """function startYTPoll() {
  if (ytPollInterval) clearInterval(ytPollInterval);
  ytPollInterval = setInterval(() => {
    if (ytPlayerReady && ytPlayer && ytPlayer.getPlayerState() === 1) {
      state.progress = ytPlayer.getCurrentTime() || 0;
      const dur = ytPlayer.getDuration();
      if (dur) state.duration = dur;
      if (state.currentSong) saveJSON(STORAGE.CURRENT_TIME, state.progress);
      refreshPlaybackUI();
      syncLyricsWithPlayback();
    }
  }, 1000);
}

"""
    content = content[:old_poll_start] + new_poll + content[old_poll_end:]

# 7. Remove any // Switched to YouTube / Piped API logic
content = content.replace('// Switched to YouTube / Piped API logic\n', '')

with open('docs/app.js', 'w') as f:
    f.write(content)
