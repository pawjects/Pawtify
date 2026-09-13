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
} from '../components/player.js';
import { persistPlayer } from '../core/details.js';
import { loadJSON, saveJSON } from '../utils/utils.js';
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
}

export function setupBackgroundPlayback() {
  let audioCtx = null;
  function initAudioCtx() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const buf = audioCtx.createBuffer(1, 1, 22050);
      const src = audioCtx.createBufferSource();
      src.buffer = buf;
      const gain = audioCtx.createGain();
      gain.gain.value = 0;
      src.connect(gain);
      gain.connect(audioCtx.destination);
      src.start();
    } catch (e) {}
  }
  document.addEventListener(
    'click',
    () => {
      if (!audioCtx) initAudioCtx();
    },
    { once: true }
  );
  document.addEventListener(
    'touchstart',
    () => {
      if (!audioCtx) initAudioCtx();
    },
    { once: true }
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      persistPlayer();
    } else {
      if (state.isPlaying) {
        if (globals.ytPlayerReady && globals.ytPlayer) {
          try {
            if (globals.ytPlayer.getPlayerState() === 2)
              globals.ytPlayer.playVideo();
          } catch (e) {}
        }
      }
    }
  });

  setInterval(() => {
    if (state.isPlaying) {
      if (globals.ytPlayerReady && globals.ytPlayer) {
        try {
          if (globals.ytPlayer.getPlayerState() === 2)
            globals.ytPlayer.playVideo();
        } catch (e) {}
      }
    }
  }, 2000);

  setInterval(() => {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'ping' });
    }
  }, 30000);
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

export function startYTPoll() {
  if (globals.ytPollInterval) clearInterval(globals.ytPollInterval);
  globals.ytPollInterval = setInterval(() => {
    if (
      globals.ytPlayerReady &&
      globals.ytPlayer &&
      globals.ytPlayer.getPlayerState() === 1
    ) {
      state.progress = globals.ytPlayer.getCurrentTime() || 0;
      const dur = globals.ytPlayer.getDuration();
      if (dur) state.duration = dur;
      if (state.currentSong) saveJSON(STORAGE.CURRENT_TIME, state.progress);
      refreshPlaybackUI();
      syncLyricsWithPlayback();
    }
  }, 1000);
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
    startYTPoll();
  } else if (event.data === 3) {
    // BUFFERING
    state.isLoading = true;
    refreshPlaybackUI();
  } else if (event.data === 2) {
    // PAUSED
    if (!document.hidden) {
      state.isPlaying = false;
      if (navigator.mediaSession)
        navigator.mediaSession.playbackState = 'paused';
    }
    clearInterval(globals.ytPollInterval);
  } else if (event.data === 0) {
    // ENDED
    clearInterval(globals.ytPollInterval);
    if (state.repeatMode === 'one') {
      globals.ytPlayer.seekTo(0);
      globals.ytPlayer.playVideo();
    } else {
      nextTrack();
    }
  }
  refreshPlaybackUI();
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
  return {
    id: x.id,
    title: x.title || 'Unknown Song',
    artist: x.uploaderName || 'YouTube Artist',
    album: 'Single',
    coverUrl: x.thumbnail || `https://i.ytimg.com/vi/${x.id}/hqdefault.jpg`,
    audioUrl: x.id,
    durationSec: x.duration || 0,
    duration: x.durationString || '',
    releaseDate: '',
    genre: 'Streaming',
  };
}
