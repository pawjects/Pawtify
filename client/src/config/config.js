import { appMain } from './dom.js';
import { parseRoute } from './router.js';
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
import { idbGet } from '../utils/idb.js';
import {
  loadYTApi,
  updateMediaSession,
  getNativeAudio,
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
  AUTOPLAY: 'pawtify-autoplay',
  FAVORITES: 'pawtify-favorites',
  PLAYLISTS: 'pawtify-playlists',
  QUEUE: 'pawtify-queue',
  CURRENT_SONG: 'pawtify-current-song',
  CURRENT_TIME: 'pawtify-current-time',
  VOLUME: 'pawtify-volume',
  RECENT_SEARCHES: 'pawtify-recent-searches',
  SEARCH_QUERY: 'pawtify-search-query',
  RECENT_PLAYED: 'pawtify-recently-played',
  FOLLOWED_ARTISTS: 'pawtify-followed-artists',
  SAVED_PLAYLISTS: 'pawtify-saved-playlists',
  SAVED_ALBUMS: 'pawtify-saved-albums',
  USER_NAME: 'pawtify-user-name',
  AUDIO_QUALITY: 'pawtify-audio-quality',
};

export function applyTheme(themeName) {
  let effective = themeName || 'amoled';
  if (effective === 'system') {
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    effective = prefersDark ? 'amoled' : 'light';
  }
  document.documentElement.setAttribute('data-theme', effective);
}

export const songCatalog = new Map();
// YouTube Audio Engine State

let toastTimer = null;
export function showToast(msg, duration = 3200) {
  let toast = document.getElementById('toast-container');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-container';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  const str = String(msg || '');
  const isErr = /error|fail|restrict|invalid|could not/i.test(str);
  const iconClass = isErr ? 'fa-circle-exclamation' : 'fa-circle-info';
  const iconColor = isErr ? 'var(--danger, #ef4444)' : 'var(--green, #1db954)';
  
  toast.innerHTML = `
    <i class="fa-solid ${iconClass}" style="color:${iconColor}; flex-shrink:0; font-size:1rem;"></i>
    <span class="toast-text">${str.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>
  `;
  toast.classList.add('show');
  
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, duration);
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
        console.info(
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
  userName: loadJSON(STORAGE.USER_NAME, '') || '',
  route: { name: 'home', playlistId: null },
  theme: loadJSON(STORAGE.THEME, 'dark'),
  repeatMode: loadJSON(STORAGE.REPEAT, 'none'),
  shuffleMode: loadJSON(STORAGE.SHUFFLE, false),
  autoplay: loadJSON(STORAGE.AUTOPLAY, true),
  audioQuality: loadJSON(STORAGE.AUDIO_QUALITY, 'high'),
  searchQuery: loadJSON(STORAGE.SEARCH_QUERY, ''),
  searchSuggestions: [],
  searchDropdownOpen: false,
  searchTab: 'all',
  libraryTab: 'recent',
  searchLoading: false,
  searchResults: { songs: [], artists: [], playlists: [], albums: [] },
  ytPlaylists: {},
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
  followedArtists: loadJSON(STORAGE.FOLLOWED_ARTISTS, []),
  savedPlaylists: loadJSON(STORAGE.SAVED_PLAYLISTS, []),
  savedAlbums: loadJSON(STORAGE.SAVED_ALBUMS, []),
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

export async function initApp() {
  try {
    // Restore from IndexedDB
    const idbPlaylists = await idbGet(STORAGE.PLAYLISTS);
    if (idbPlaylists) state.playlists = normalizePlaylists(idbPlaylists);

    const idbFavorites = await idbGet(STORAGE.FAVORITES);
    if (idbFavorites) state.favorites = dedupeSongs(idbFavorites);

    const idbQueue = await idbGet(STORAGE.QUEUE);
    if (idbQueue) state.queue = dedupeSongs(idbQueue);

    const idbRecent = await idbGet(STORAGE.RECENT_PLAYED);
    if (idbRecent) state.recentlyPlayed = idbRecent;

    const idbFollowedArtists = await idbGet(STORAGE.FOLLOWED_ARTISTS);
    if (idbFollowedArtists) state.followedArtists = idbFollowedArtists;

    const idbSavedPlaylists = await idbGet(STORAGE.SAVED_PLAYLISTS);
    if (idbSavedPlaylists) state.savedPlaylists = idbSavedPlaylists;

    const idbSavedAlbums = await idbGet(STORAGE.SAVED_ALBUMS);
    if (idbSavedAlbums) state.savedAlbums = idbSavedAlbums;

    const idbSong = await idbGet(STORAGE.CURRENT_SONG);
    if (idbSong !== undefined) state.currentSong = idbSong;
    
    const idbTime = await idbGet(STORAGE.CURRENT_TIME);
    if (idbTime !== undefined) state.progress = Number(idbTime) || 0;

    seedCatalog();
    restoreCurrentSongIndex();
    loadYTApi();

    if (state.currentSong) updateMediaSession(state.currentSong);
    document.body.classList.toggle('has-active-track', !!state.currentSong);
    applyTheme(state.theme);
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (state.theme === 'system') applyTheme('system');
      });
    }

    // Prevent pause() calls on the global HTMLMediaElement when document.hidden becomes true
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        const globalAudio =
          getNativeAudio() ||
          (typeof document !== 'undefined'
            ? document.getElementById('pawtify-native-audio')
            : null);
        if (!globalAudio) return;

        if (document.hidden) {
          if (!globalAudio._originalPause) {
            globalAudio._originalPause = globalAudio.pause;
          }
          globalAudio.pause = function preventedHiddenPause() {
            if (document.hidden) {
              return;
            }
            return globalAudio._originalPause.apply(this, arguments);
          };
        } else {
          if (globalAudio._originalPause) {
            globalAudio.pause = globalAudio._originalPause;
          }
        }
      });
    }

    bindGlobalEvents();

    const initialRoute = parseRoute();
    if (initialRoute.name === 'song' && initialRoute.songId) {
      window.location.hash = `#/song/${encodeURIComponent(initialRoute.songId)}`;
    } else if (initialRoute.name === 'playlist' && initialRoute.playlistId) {
      window.location.hash = `#/playlist/${encodeURIComponent(initialRoute.playlistId)}`;
    } else if (initialRoute.name !== 'home') {
      window.location.hash = `#/${initialRoute.name}`;
    } else if (!window.location.hash) {
      window.location.hash = '#/';
    }

    const savedName = loadJSON(STORAGE.USER_NAME, '');
    state.userName = savedName || '';
    const welcomeSeen = loadJSON('pawtify-welcome-seen', false);
    if (!welcomeSeen && !state.userName && initialRoute.name !== 'song') {
      state.modal = { type: 'welcome' };
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