import { state, globals } from '../config/config.js';
import { renderLyricsPanel } from '../components/lyrics.js';
import { renderFullscreenPlayer } from '../components/fullscreen.js';

const lyricsCache = new Map();
let userScrollTimestamp = 0;
let lastActiveIndex = -1;

function notifyLyricsUpdate() {
  if (state.lyricsPanel) {
    if (state.fullscreenPlayer) {
      renderFullscreenPlayer(true);
    } else {
      renderLyricsPanel();
    }
  }
}

export function cleanSongMetadata(title = '', artist = '') {
  let cleanTitle = title
    .replace(/\s*[\(\[](?:official\s*(?:music\s*)?video|official\s*audio|lyric\s*video|lyrics|visualizer|audio|4k|hd|remastered|remaster|live)[\)\]]/gi, '')
    .replace(/\s*[\(\[]feat\.?.*?[\)\]]/gi, '')
    .replace(/\s*[\(\[]ft\.?.*?[\)\]]/gi, '')
    .trim();

  // If title is "Artist - Title", extract title
  if (cleanTitle.includes(' - ')) {
    const parts = cleanTitle.split(' - ');
    if (parts.length === 2 && !artist) {
      artist = parts[0].trim();
      cleanTitle = parts[1].trim();
    } else if (parts.length === 2 && parts[0].toLowerCase() === artist.toLowerCase()) {
      cleanTitle = parts[1].trim();
    }
  }

  let cleanArtist = artist
    .replace(/\s*-\s*topic/gi, '')
    .replace(/\s*vevo/gi, '')
    .trim();

  if (cleanArtist.includes(',')) {
    cleanArtist = cleanArtist.split(',')[0].trim();
  }

  return { title: cleanTitle || title, artist: cleanArtist || artist };
}

export function parseLRC(lrcText) {
  if (!lrcText || typeof lrcText !== 'string') return [];
  const lines = lrcText.split('\n');
  const parsed = [];
  const timeRegex = /\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Ignore header tags like [ar:Artist], [ti:Title], [re:...]
    if (/^\[[a-zA-Z]+:/.test(trimmed)) continue;

    timeRegex.lastIndex = 0;
    let match;
    const timestamps = [];
    while ((match = timeRegex.exec(trimmed)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseFloat(match[2]);
      timestamps.push(min * 60 + sec);
    }

    if (timestamps.length > 0) {
      const text = trimmed.replace(timeRegex, '').trim();
      for (const time of timestamps) {
        parsed.push({ time, text: text || '♪' });
      }
    }
  }

  parsed.sort((a, b) => a.time - b.time);
  return parsed;
}

export async function fetchLyricsForSong(song) {
  if (!song || !song.id) {
    state.lyricsData = null;
    state.lyricsLoading = false;
    return null;
  }

  const cacheKey = String(song.id);
  if (lyricsCache.has(cacheKey)) {
    const cached = lyricsCache.get(cacheKey);
    state.lyricsData = cached;
    state.lyricsLoading = false;
    notifyLyricsUpdate();
    return cached;
  }

  state.lyricsLoading = true;
  state.lyricsData = null;
  lastActiveIndex = -1;
  notifyLyricsUpdate();

  const { title, artist } = cleanSongMetadata(song.title, song.artist);
  const duration = Math.round(Number(song.durationSec || state.duration || 0));

  let data = null;

  // 1. Try LRCLIB exact match API
  try {
    const params = new URLSearchParams({
      track_name: title,
      artist_name: artist,
    });
    if (duration > 0) {
      params.append('duration', duration.toString());
    }

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`, {
      headers: { 'User-Agent': 'Pawtify/1.0.0 (https://github.com/pawjects/Pawtify)' },
    });

    if (res.ok) {
      data = await res.json();
    }
  } catch (err) {
    console.warn('[LRCLIB] Exact match failed, falling back to search:', err);
  }

  // 2. Fallback to LRCLIB Search API if exact match failed or gave no lyrics
  if (!data || (!data.syncedLyrics && !data.plainLyrics)) {
    try {
      const query = `${title} ${artist}`.trim();
      const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Pawtify/1.0.0 (https://github.com/pawjects/Pawtify)' },
      });

      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0) {
          // Prioritize items with syncedLyrics
          const withSynced = results.find((r) => r.syncedLyrics);
          const withPlain = results.find((r) => r.plainLyrics);
          data = withSynced || withPlain || results[0];
        }
      }
    } catch (err) {
      console.warn('[LRCLIB] Search failed:', err);
    }
  }

  const parsedSynced = data?.syncedLyrics ? parseLRC(data.syncedLyrics) : [];
  const plainText = data?.plainLyrics || '';

  const lyricResult = {
    songId: song.id,
    title: data?.trackName || title,
    artist: data?.artistName || artist,
    synced: parsedSynced,
    hasSynced: parsedSynced.length > 0,
    plain: plainText,
    isInstrumental: Boolean(data?.instrumental),
  };

  lyricsCache.set(cacheKey, lyricResult);
  state.lyricsData = lyricResult;
  state.lyricsLoading = false;

  notifyLyricsUpdate();

  return lyricResult;
}

export function recordUserLyricsScroll() {
  userScrollTimestamp = Date.now();
}

export function syncLyricsWithPlayback() {
  if (!state.lyricsPanel) return;
  const data = state.lyricsData;
  if (!data || !data.hasSynced || !data.synced || data.synced.length === 0) return;

  const currentSec = Number(state.progress || 0);

  // Find index of current lyric line
  let activeIndex = -1;
  for (let i = 0; i < data.synced.length; i++) {
    if (currentSec >= data.synced[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  if (activeIndex === -1) {
    activeIndex = 0;
  }

  if (activeIndex === lastActiveIndex) return;
  lastActiveIndex = activeIndex;

  const bodyEl = document.getElementById('lyrics-body-scroller');
  if (!bodyEl) return;

  const allLines = bodyEl.querySelectorAll('.lyrics-line');
  allLines.forEach((el, idx) => {
    if (idx === activeIndex) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Only auto-scroll if the user hasn't scrolled manually within the last 3.5 seconds
  const now = Date.now();
  if (now - userScrollTimestamp > 3500) {
    const activeEl = bodyEl.querySelector(`.lyrics-line[data-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }
}
