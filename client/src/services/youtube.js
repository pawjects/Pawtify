import {
  handlePlaybackError,
  state,
  STORAGE,
  clearYtLoadTimeout,
  showToast,
  initApp,
  globals,
} from '../config/config.js';
import {
  togglePlay,
  pause,
  previousTrack,
  nextTrack,
  seekTo,
} from '../components/player.js';
import { persistPlayer } from '../core/details.js';
import { loadJSON, saveJSON, getOptimizedArtwork } from '../utils/utils.js';
import { refreshPlaybackUI } from '../components/playerBar.js';

export function loadYTApi() {
  if (globals.ytPlayer) return;
  if (window.YT && window.YT.Player) {
    window.onYouTubeIframeAPIReady();
    return;
  }
  if (!document.getElementById('yt-iframe-api-script')) {
    const tag = document.createElement('script');
    tag.id = 'yt-iframe-api-script';
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }
}

window.onYouTubeIframeAPIReady = function () {
  if (globals.ytPlayer) return;
  const hostElem = document.getElementById('yt-player-host');
  if (!hostElem) return;

  try {
    globals.ytPlayer = new YT.Player('yt-player-host', {
      height: '158',
      width: '280',
      host: 'https://www.youtube.com',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        playsinline: 1,
        fs: 0,
        rel: 0,
        enablejsapi: 1,
        iv_load_policy: 3,
        modestbranding: 1,
      },
      events: {
        onReady: onPlayerReady,
        onStateChange: onPlayerStateChange,
        onError: (e) => {
          console.warn('YouTube Player Error:', e.data);
          handlePlaybackError(e.data);
        },
      },
    });
  } catch (err) {
    console.error('Failed to create YT.Player:', err);
  }
};

// Native HTMLMediaElement Audio Anchor for PWA & OS background playback
let nativeAudioElement = null;

export function getNativeAudio() {
  if (typeof document === 'undefined') return null;
  if (!nativeAudioElement) {
    nativeAudioElement = document.getElementById('pawtify-native-audio');
    if (!nativeAudioElement) {
      nativeAudioElement = document.createElement('audio');
      nativeAudioElement.id = 'pawtify-native-audio';
      nativeAudioElement.playsInline = true;
      nativeAudioElement.preload = 'metadata';
      nativeAudioElement.style.display = 'none';
      document.body.appendChild(nativeAudioElement);
    }
  }
  return nativeAudioElement;
}

export function startBackgroundAudio() {
  const audio = getNativeAudio();
  if (!audio) return;
  audio.volume = typeof state.volume === 'number' ? state.volume : 0.7;
}

export function stopBackgroundAudio() {
  const audio = getNativeAudio();
  if (audio && !audio.paused) {
    try {
      audio.pause();
    } catch (e) {}
  }
}

export function updateMediaSession(song) {
  if (!('mediaSession' in navigator)) return;
  if (!song) {
    navigator.mediaSession.playbackState = 'none';
    return;
  }
  navigator.mediaSession.metadata = new MediaMetadata({
    title: song.title || 'Unknown',
    artist: song.artist || 'Unknown',
    album: song.album || '',
    artwork: [{ src: song.coverUrl, sizes: '512x512', type: 'image/jpeg' }],
  });
  navigator.mediaSession.setActionHandler('play', () => {
    if (!state.isPlaying) togglePlay();
  });
  navigator.mediaSession.setActionHandler('pause', () => {
    if (state.isPlaying) pause();
  });
  navigator.mediaSession.setActionHandler('previoustrack', () =>
    previousTrack()
  );
  navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
  navigator.mediaSession.setActionHandler('seekforward', () => {
    if (globals.ytPlayerReady && globals.ytPlayer)
      globals.ytPlayer.seekTo(
        Math.min(state.duration, state.progress + 10),
        true
      );
  });
  navigator.mediaSession.setActionHandler('seekbackward', () => {
    if (globals.ytPlayerReady && globals.ytPlayer)
      globals.ytPlayer.seekTo(Math.max(0, state.progress - 10), true);
  });
  try {
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details && typeof details.seekTime === 'number') {
        seekTo(details.seekTime);
      }
    });
  } catch (e) {}
}

export function onPlayerReady(event) {
  globals.ytPlayerReady = true;
  globals.ytPlayer.setVolume(state.volume * 100);
  if (globals.pendingVideoId) {
    if (globals.pendingAutoplay)
      globals.ytPlayer.loadVideoById(globals.pendingVideoId);
    else globals.ytPlayer.cueVideoById(globals.pendingVideoId);
    globals.pendingVideoId = null;
  } else if (state.currentSong) {
    globals.ytPlayer.cueVideoById(state.currentSong.id);
    setTimeout(() => {
      const savedPos = Number.parseFloat(loadJSON(STORAGE.CURRENT_TIME, 0));
      if (savedPos > 0) globals.ytPlayer.seekTo(savedPos, true);
    }, 1000);
  }
}

let lastSaveTime = 0;

export function startYTPoll() {
  if (globals.ytPollInterval) clearInterval(globals.ytPollInterval);
  globals.ytPollInterval = setInterval(() => {
    if (
      globals.ytPlayerReady &&
      globals.ytPlayer &&
      typeof globals.ytPlayer.getPlayerState === 'function' &&
      globals.ytPlayer.getPlayerState() === 1
    ) {
      state.progress = globals.ytPlayer.getCurrentTime() || 0;
      const dur = globals.ytPlayer.getDuration();
      if (dur && dur > 0) state.duration = dur;

      // Keep OS lock screen progress position synchronized
      if (
        'mediaSession' in navigator &&
        'setPositionState' in navigator.mediaSession &&
        state.duration > 0
      ) {
        try {
          navigator.mediaSession.setPositionState({
            duration: Math.max(1, state.duration),
            playbackRate: 1,
            position: Math.max(0, Math.min(state.progress, state.duration)),
          });
        } catch (e) {}
      }

      const now = Date.now();
      if (state.currentSong && now - lastSaveTime > 2000) {
        saveJSON(STORAGE.CURRENT_TIME, state.progress);
        lastSaveTime = now;
      }
      refreshPlaybackUI();
      syncLyricsWithPlayback();
    }
  }, 250);
}

export function onPlayerStateChange(event) {
  if (event.data === 1) {
    // PLAYING
    clearYtLoadTimeout();
    globals.isFallingBack = false;
    state.isPlaying = true;
    state.isLoading = false;
    if (state.currentSong) state.currentSong._triedFallback = false;
    if (navigator.mediaSession)
      navigator.mediaSession.playbackState = 'playing';
    startBackgroundAudio();
    startYTPoll();
  } else if (event.data === 3) {
    // BUFFERING
    state.isLoading = true;
    refreshPlaybackUI();
  } else if (event.data === 2) {
    // PAUSED
    // If the browser/OS paused playback automatically because the tab or PWA
    // was backgrounded, minimized, or the screen locked, but the app was in playing state:
    if (document.hidden && state.isPlaying) {
      if (navigator.mediaSession) {
        navigator.mediaSession.playbackState = 'playing';
      }
      return;
    }
    state.isPlaying = false;
    if (navigator.mediaSession) {
      navigator.mediaSession.playbackState = 'paused';
    }
    stopBackgroundAudio();
    clearInterval(globals.ytPollInterval);
  } else if (event.data === 0) {
    // ENDED
    clearInterval(globals.ytPollInterval);
    if (state.repeatMode === 'one') {
      globals.ytPlayer.seekTo(0);
      globals.ytPlayer.playVideo();
    } else if (state.autoplay !== false) {
      nextTrack();
    } else {
      state.isPlaying = false;
      stopBackgroundAudio();
      refreshPlaybackUI();
    }
  }
  refreshPlaybackUI();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // PWA returned to foreground:
      // If we are in playing state and the player was suspended by the background policy, resume
      if (state.isPlaying) {
        if (
          globals.ytPlayerReady &&
          globals.ytPlayer &&
          typeof globals.ytPlayer.getPlayerState === 'function'
        ) {
          try {
            const ps = globals.ytPlayer.getPlayerState();
            if (ps === 2 || ps === -1 || ps === 5) {
              globals.ytPlayer.playVideo();
            }
          } catch (e) {}
        }
        refreshPlaybackUI();
      }
    }
  });
}

window.addEventListener('online', () => {
  showToast('Back online. Features restored.');
});
window.addEventListener('offline', () => {
  showToast('You are offline. Playing from cache.');
});

export function syncLyricsWithPlayback() {
  // Placeholder - live lyrics sync not available in YouTube audio mode
}

export function isValidMusicContent(item) {
  if (!item || !item.id) return false;
  if (item.resultType !== 'song' && item.resultType !== 'playlist')
    return false;
  const title = (item.title || '').toLowerCase();
  if (
    title.includes('karaoke') ||
    title.includes('tribute version') ||
    title.includes('instrumental version')
  )
    return false;
  return true;
}

export function prioritizeMusic(a, b) {
  // Prefer individual single songs (< 12 min) over marathon non-stop mix videos (> 45 min)
  const aLong = (a.duration || 0) > 2700;
  const bLong = (b.duration || 0) > 2700;
  if (!aLong && bLong) return -1;
  if (aLong && !bLong) return 1;

  return 0;
}

export function mapServerSong(x) {
  if (!x || !x.id) return null;
  
  let artistName = 'Unknown Artist';
  if (typeof x.uploaderName === 'string') {
    artistName = x.uploaderName;
  } else if (Array.isArray(x.uploaderName)) {
    artistName = x.uploaderName.map(a => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ');
  } else if (x.uploaderName && typeof x.uploaderName === 'object') {
    artistName = x.uploaderName.name || 'Unknown Artist';
  } else if (x.artist) {
    if (typeof x.artist === 'string') artistName = x.artist;
    else if (Array.isArray(x.artist)) artistName = x.artist.map(a => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ');
    else if (typeof x.artist === 'object') artistName = x.artist.name || 'Unknown Artist';
  }

  artistName = (artistName || 'Unknown Artist').trim();
  if (artistName === 'undefined' || artistName === 'null' || artistName.startsWith('[object')) {
    artistName = 'Unknown Artist';
  }

  let cleanTitle = (x.title || x.name || 'Unknown Track').trim();
  if (cleanTitle === 'undefined' || cleanTitle === 'null' || cleanTitle.startsWith('[object')) {
    cleanTitle = 'Unknown Track';
  }

  const durationSec = typeof x.duration === 'number' ? x.duration : (x.durationSec || 0);
  let durationStr = x.durationString || '';
  if (!durationStr && durationSec > 0) {
    const m = Math.floor(durationSec / 60);
    const s = durationSec % 60;
    durationStr = m + ':' + s.toString().padStart(2, '0');
  }

  const rawCover = x.thumbnail || x.coverUrl || `https://i.ytimg.com/vi/${x.id}/hqdefault.jpg`;
  const cleanCover = (typeof rawCover === 'string' && !rawCover.startsWith('[object') && rawCover !== 'undefined')
    ? rawCover
    : `https://i.ytimg.com/vi/${x.id}/hqdefault.jpg`;

  return {
    id: String(x.id),
    title: cleanTitle,
    artist: artistName,
    album: (typeof x.album === 'string' && x.album.trim()) ? x.album.trim() : 'Single',
    coverUrl: getOptimizedArtwork(cleanCover, 540),
    audioUrl: String(x.id),
    durationSec: durationSec,
    duration: durationStr || '0:00',
    releaseDate: x.releaseDate || '',
    genre: 'Streaming',
  };
}