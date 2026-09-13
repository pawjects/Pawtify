import {
  rememberSongs,
  dedupeSongs,
  addRecentlyPlayed,
  persistPlayer,
  seedCatalog,
} from '../core/details.js';
import {
  state,
  STORAGE,
  startYtLoadTimeout,
  handlePlaybackError,
  showToast,
  globals,
} from '../config/config.js';
import { saveJSON } from '../utils/utils.js';
import { updateMediaSession, loadYTApi } from '../services/youtube.js';
import { loadRecommendations } from '../services/dataLoader.js';
import { renderCurrentRoute } from './master.js';
import {
  refreshPlaybackUI,
  renderPlayerBar,
  renderMiniPlayer,
  renderSidebarPlaylists,
} from './playerBar.js';
import { getNextSong } from '../services/apiMapping.js';
import { renderFullscreenPlayer } from './fullscreen.js';

export async function play(song, queue = null, autoplay = true) {
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
  if (navigator.mediaSession)
    navigator.mediaSession.playbackState = autoplay ? 'playing' : 'paused';
  if (autoplay) startYtLoadTimeout();
  if (
    globals.ytPlayerReady &&
    globals.ytPlayer &&
    typeof globals.ytPlayer.loadVideoById === 'function'
  ) {
    try {
      if (autoplay) globals.ytPlayer.loadVideoById(playableSong.id);
      else globals.ytPlayer.cueVideoById(playableSong.id);
    } catch (e) {
      console.warn('loadVideoById error:', e);
      handlePlaybackError(e);
    }
  } else {
    globals.pendingVideoId = playableSong.id;
    globals.pendingAutoplay = autoplay;
    loadYTApi();
  }
  addRecentlyPlayed(playableSong.id);
  persistPlayer();
  await loadRecommendations();
  renderCurrentRoute();
}

export function pause() {
  if (globals.ytPlayerReady && globals.ytPlayer) {
    try {
      if (typeof globals.ytPlayer.pauseVideo === 'function')
        globals.ytPlayer.pauseVideo();
      const iframe =
        typeof globals.ytPlayer.getIframe === 'function'
          ? globals.ytPlayer.getIframe()
          : null;
      if (iframe && iframe.contentWindow)
        iframe.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
          '*'
        );
    } catch (e) {}
  }
  state.isPlaying = false;
  if (navigator.mediaSession) navigator.mediaSession.playbackState = 'paused';
  persistPlayer();
  refreshPlaybackUI();
}

export async function togglePlay() {
  if (!state.currentSong) {
    await playSomething();
    return;
  }
  if (state.isPlaying) pause();
  else {
    startYtLoadTimeout();
    if (globals.ytPlayerReady && globals.ytPlayer) {
      try {
        const pState =
          typeof globals.ytPlayer.getPlayerState === 'function'
            ? globals.ytPlayer.getPlayerState()
            : -1;
        if (pState === -1 || pState === 5) {
          if (typeof globals.ytPlayer.loadVideoById === 'function') {
            globals.ytPlayer.loadVideoById(state.currentSong.id);
          }
        } else if (typeof globals.ytPlayer.playVideo === 'function') {
          globals.ytPlayer.playVideo();
        }
        const iframe =
          typeof globals.ytPlayer.getIframe === 'function'
            ? globals.ytPlayer.getIframe()
            : null;
        if (iframe && iframe.contentWindow)
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
      } catch (e) {
        console.warn('playVideo error:', e);
      }
    } else {
      globals.pendingVideoId = state.currentSong.id;
      globals.pendingAutoplay = true;
      loadYTApi();
    }
    state.isPlaying = true;
  }
  persistPlayer();
  refreshPlaybackUI();
}

export async function nextTrack() {
  if (!state.currentSong) {
    await playSomething();
    return;
  }
  if (state.shuffleMode && state.queue.length > 1) {
    const remaining = state.queue.filter(
      (_, i) => i !== state.currentSongIndex
    );
    const next = remaining[Math.floor(Math.random() * remaining.length)];
    const nextIndex = state.queue.findIndex((s) => s.id === next.id);
    if (nextIndex >= 0) {
      state.currentSongIndex = nextIndex;
      await play(state.queue[nextIndex], state.queue, true);
      return;
    }
  }

  const nextIndex = state.currentSongIndex + 1;
  if (nextIndex < state.queue.length) {
    await play(state.queue[nextIndex], state.queue, true);
    return;
  }
  if (state.repeatMode === 'all' && state.queue.length > 1) {
    await play(state.queue[0], state.queue, true);
    return;
  }
  const nextSong = await getNextSong(state.currentSong.id);
  if (!nextSong) {
    refreshPlaybackUI();
    return;
  }
  state.queue = dedupeSongs([...state.queue, nextSong]);
  await play(nextSong, state.queue, true);
}

export function previousTrack() {
  if (!state.currentSong) return;
  if (state.progress > 3) {
    seekTo(0);
    return;
  }
  if (!state.queue.length) return;
  const prevIndex =
    (state.currentSongIndex - 1 + state.queue.length) % state.queue.length;
  const song = state.queue[prevIndex];
  play(song, state.queue, state.isPlaying);
}

export function seekTo(seconds) {
  if (!Number.isFinite(seconds)) return;
  if (globals.ytPlayerReady && globals.ytPlayer && globals.ytPlayer.getIframe) {
    try {
      globals.ytPlayer.seekTo(seconds, true);
      const iframe = globals.ytPlayer.getIframe();
      if (iframe && iframe.contentWindow)
        iframe.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [seconds, true],
          }),
          '*'
        );
    } catch (e) {}
  }
  state.progress = Math.max(0, seconds);
  saveJSON(STORAGE.CURRENT_TIME, state.progress);
  refreshPlaybackUI();
}

export function setVolume(value) {
  const clamped = Math.max(0, Math.min(1, value));
  state.volume = clamped;
  if (globals.ytPlayerReady && globals.ytPlayer)
    globals.ytPlayer.setVolume(clamped * 100);
  saveJSON(STORAGE.VOLUME, clamped);
  refreshPlaybackUI();
}

export function toggleFavorite(song) {
  const exists = state.favorites.some((item) => item.id === song.id);
  if (exists) {
    state.favorites = state.favorites.filter((item) => item.id !== song.id);
    showToast('Removed from favorites');
  } else {
    const songWithTimestamp = { ...song, addedAt: Date.now() };
    state.favorites = dedupeSongs([...state.favorites, songWithTimestamp]);
    rememberSongs([songWithTimestamp]);
    showToast('Added to favorites');
  }
  saveJSON(STORAGE.FAVORITES, state.favorites);
  renderCurrentRoute();
  renderPlayerBar();
  renderMiniPlayer();
  renderFullscreenPlayer();
}

export function toggleRepeat() {
  const modes = ['none', 'all', 'one'];
  const currentIdx = modes.indexOf(state.repeatMode);
  state.repeatMode = modes[(currentIdx + 1) % modes.length];
  saveJSON(STORAGE.REPEAT, state.repeatMode);
  refreshPlaybackUI();
  let msg = 'Repeat off';
  if (state.repeatMode === 'all') msg = 'Repeat all';
  if (state.repeatMode === 'one') msg = 'Repeat one';
  showToast(msg);
}

export function toggleShuffle() {
  state.shuffleMode = !state.shuffleMode;
  saveJSON(STORAGE.SHUFFLE, state.shuffleMode);
  if (state.shuffleMode && state.queue.length > 1) {
    const current = state.queue[state.currentSongIndex];
    const rest = state.queue.filter((s, i) => i !== state.currentSongIndex);
    const shuffled = rest.sort(() => Math.random() - 0.5);
    state.queue = [current, ...shuffled];
    state.currentSongIndex = 0;
    saveJSON(STORAGE.QUEUE, state.queue);
  }
  refreshPlaybackUI();
  showToast(state.shuffleMode ? 'Shuffle on' : 'Shuffle off');
}

export function addToPlaylist(song, playlistId) {
  let playlistName = '';
  state.playlists = state.playlists.map((playlist) => {
    if (playlist.id !== playlistId) return playlist;
    playlistName = playlist.name;
    if (playlist.songs.some((item) => item.id === song.id)) {
      showToast(`Already in ${playlist.name}`);
      return playlist;
    }
    const songWithTimestamp = { ...song, addedAt: Date.now() };
    showToast(`Added to ${playlist.name}`);
    return {
      ...playlist,
      songs: dedupeSongs([...playlist.songs, songWithTimestamp]),
    };
  });
  saveJSON(STORAGE.PLAYLISTS, state.playlists);
  seedCatalog();
}

export function removeFromPlaylist(songId, playlistId) {
  state.playlists = state.playlists.map((playlist) => {
    if (playlist.id !== playlistId) return playlist;
    return {
      ...playlist,
      songs: playlist.songs.filter((song) => song.id !== songId),
    };
  });
  saveJSON(STORAGE.PLAYLISTS, state.playlists);
}

export function createPlaylist(name) {
  const playlist = {
    id: `playlist-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    name,
    songs: [],
  };
  state.playlists = [...state.playlists, playlist];
  saveJSON(STORAGE.PLAYLISTS, state.playlists);
  renderCurrentRoute();
  renderSidebarPlaylists();
}

export function deletePlaylist(playlistId) {
  state.playlists = state.playlists.filter(
    (playlist) => playlist.id !== playlistId
  );
  if (!state.playlists.length)
    state.playlists = [{ id: 'default', name: 'My Playlist', songs: [] }];
  saveJSON(STORAGE.PLAYLISTS, state.playlists);
  renderSidebarPlaylists();
}
