import { appMain } from './dom.js';
import { refreshPlaybackUI } from '../components/playerBar.js';
import {
  rememberSongs,
  persistPlayer,
  normalizeRecentSearches,
  dedupeSongs,
  normalizePlaylists,
  seedCatalog,
  restoreCurrentSongIndex,
} from '../core/details.js';
import { nextTrack } from '../components/player.js';
import { loadJSON, saveJSON } from '../utils/utils.js';
import {
  loadYTApi,
  setupBackgroundPlayback,
  updateMediaSession,
} from '../services/youtube.js';
import { bindGlobalEvents } from '../core/events.js';
import { renderCurrentRoute } from '../components/master.js';
import {
  loadTrendingSongs,
  loadRecommendations,
} from '../services/dataLoader.js';

export const LOGO_URL =
  '/assets/pawtify.png';

export const STORAGE = {
  THEME: 'pawtify-theme',
  REPEAT: 'pawtify-repeat',
  SHUFFLE: 'pawtify-shuffle',
  FAVORITES: 'pawtify-favorites',
  PLAYLISTS: 'pawtify-playlists',
  QUEUE: 'pawtify-queue',
  CURRENT_SONG: 'pawtify-current-song',
  CURRENT_TIME: 'pawtify-current-time',
  VOLUME: 'pawtify-volume',
  RECENT_SEARCHES: 'pawtify-recent-searches',
  SEARCH_QUERY: 'pawtify-search-query',
  RECENT_PLAYED: 'pawtify-recently-played',
};

export const songCatalog = new Map();
// YouTube Audio Engine State

export function showToast(msg) {
  let toast = document.getElementById('toast-container');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-container';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

export function clearYtLoadTimeout() {
  if (globals.ytLoadTimeout) {
    clearTimeout(globals.ytLoadTimeout);
    globals.ytLoadTimeout = null;
  }
}

export function startYtLoadTimeout() {
  clearYtLoadTimeout();
  state.isLoading = true;
  refreshPlaybackUI();
  globals.ytLoadTimeout = setTimeout(() => {
    console.warn('YouTube Player timed out loading video');
    handlePlaybackError('TIMEOUT');
  }, 20000);
}

export async function handlePlaybackError(errorCode) {
  clearYtLoadTimeout();
  console.warn(
    'handlePlaybackError triggered. Code:',
    errorCode,
    'Song:',
    state.currentSong?.title
  );

  if (globals.isFallingBack) return;

  const current = state.currentSong;
  if (current && !current._triedFallback) {
    current._triedFallback = true;
    globals.isFallingBack = true;
    showToast(`Finding alternative stream for "${current.title}"...`);
    try {
      const cleanTitle = (current.title || '')
        .replace(/\s*\(.*?\)\s*/g, '')
        .replace(/\s*\[.*?\]\s*/g, '')
        .trim();
      const cleanArtist = (current.artist || '').trim();
      const query = `${cleanTitle} ${cleanArtist} official`;
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      const alternatives = (data?.items || []).filter(
        (item) =>
          item.id && item.id !== current.id && item.resultType !== 'artist'
      );

      if (alternatives.length > 0) {
        const altSong = alternatives[0];
        console.log(
          `Switching to alternative playable stream: ${altSong.id} (${altSong.title})`
        );
        current.id = altSong.id;
        if (altSong.thumbnail) current.coverUrl = altSong.thumbnail;
        rememberSongs([current]);
        persistPlayer();

        if (
          globals.ytPlayerReady &&
          globals.ytPlayer &&
          typeof globals.ytPlayer.loadVideoById === 'function'
        ) {
          startYtLoadTimeout();
          globals.ytPlayer.loadVideoById(current.id);
          globals.isFallingBack = false;
          refreshPlaybackUI();
          return;
        }
      }
    } catch (err) {
      console.error('Alternative stream search failed:', err);
    }
    globals.isFallingBack = false;
  }

  state.isLoading = false;
  state.isPlaying = false;
  refreshPlaybackUI();
  showToast('Track unavailable on embed. Skipping to next song...');
  setTimeout(() => {
    if (state.queue.length > 1) {
      nextTrack();
    }
  }, 1500);
}

// Audio Engine State Removed

export const storedVol = loadJSON(STORAGE.VOLUME, 0.7);
export const initialVol =
  typeof storedVol === 'number' && !isNaN(storedVol) ? storedVol : 0.7;

export const DISCOVERY_CATEGORIES = [
  { title: 'Late Night Indie', query: 'Indian indie late night vibes The Local Train official' },
  { title: 'Acoustic Love', query: 'Anuv Jain acoustic romantic indie songs official' },
  { title: 'Soothing Hindi', query: 'Prateek Kuhad soothing Hindi mellow official' },
  { title: 'Melancholic Moods', query: 'Indian indie sad melancholic songs official' },
  { title: 'Dreamy Pop', query: 'Mitraz dreamy lo-fi pop aesthetic official' },
  { title: 'Lo-Fi Chill', query: 'Hindi lo-fi chill romantic aesthetic vibes official' },
  { title: 'Aesthetic Indie', query: 'Indian aesthetic indie pop love songs official' },
  { title: 'Late Night Drives', query: 'Hindi indie late night drive soothing official' },
  { title: 'Midnight Acoustic', query: 'Acoustic indie Hindi midnight calm official' },
  { title: 'Indie Rock Vibes', query: 'The Local Train Indian indie rock official' },
];

export const globals = {
  ytPlayer: null,
  ytPlayerReady: null,
  ytPollInterval: null,
  ytLoadTimeout: null,
  isFallingBack: null,
  pendingVideoId: null,
  pendingAutoplay: null,
  searchTimer: null,
  searchRequestToken: null,
  lyricsScrollTimeout: null,
};
export const state = {};
Object.assign(state, {
  feedCategories: [],
  route: { name: 'home', playlistId: null },
  theme: loadJSON(STORAGE.THEME, 'dark'),
  repeatMode: loadJSON(STORAGE.REPEAT, 'none'),
  shuffleMode: loadJSON(STORAGE.SHUFFLE, false),
  searchQuery: loadJSON(STORAGE.SEARCH_QUERY, ''),
  searchSuggestions: [],
  searchTab: 'songs',
  libraryTab: 'recent',
  searchLoading: false,
  searchResults: { songs: [], artists: [] },
  recentSearches: normalizeRecentSearches(
    loadJSON(STORAGE.RECENT_SEARCHES, [])
  ),
  currentSong: loadJSON(STORAGE.CURRENT_SONG, null),
  queue: dedupeSongs(loadJSON(STORAGE.QUEUE, [])),
  currentSongIndex: 0,
  isPlaying: false,
  isLoading: true,
  progress: 0,
  duration: 0,
  volume: Math.max(0, Math.min(1, initialVol)),
  favorites: dedupeSongs(loadJSON(STORAGE.FAVORITES, [])),
  playlists: normalizePlaylists(
    loadJSON(STORAGE.PLAYLISTS, [
      { id: 'default', name: 'My Playlist', songs: [] },
    ])
  ),
  trendingSongs: [],
  indieBandsSongs: [],
  acousticSongs: [],
  melodicIndieSongs: [],
  lofiSongs: [],
  classicalSongs: [],
  anuvSongs: [],
  prateekSongs: [],
  indieSongs: [],
  englishSongs: [],
  recommendedSongs: [],
  recentlyPlayed: loadJSON(STORAGE.RECENT_PLAYED, []),
  pendingSearchQuery: '',
  modal: null,
  fullscreenPlayer: false,
  lyricsPanel: false,
  lyricsData: null,
  lyricsLoading: false,
  artistProfile: null,
  queuePanel: false,
  videoVisible: false,
});

export function initApp() {
  try {
    seedCatalog();
    restoreCurrentSongIndex();
    loadYTApi();

    setupBackgroundPlayback();
    if (state.currentSong) updateMediaSession(state.currentSong);

    bindGlobalEvents();

    if (!window.location.hash) {
      window.location.hash = '#/';
    }

    const firstVisit = loadJSON('pawtify-welcome-seen', false);
    if (!firstVisit) {
      state.modal = { type: 'welcome' };
      saveJSON('pawtify-welcome-seen', true);
    }

    renderCurrentRoute();

    loadTrendingSongs().then(() => {
      if (state.currentSong) {
        loadRecommendations();
      }
    });
  } catch (e) {
    console.error('Critical initialization error:', e);
    if (appMain) {
      appMain.innerHTML = `<div class="empty-state"><h2>App Error</h2><p>Something went wrong loading Pawtify. Please refresh the page.</p></div>`;
    }
  }
}
