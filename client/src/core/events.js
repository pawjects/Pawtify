import { renderCurrentRoute } from '../components/master.js';
import { navigate } from '../config/router.js';
import {
  togglePlay,
  nextTrack,
  previousTrack,
  toggleFavorite,
  removeFromPlaylist,
  addToPlaylist,
  toggleRepeat,
  toggleShuffle,
  play,
  deletePlaylist,
  seekTo,
  setVolume,
  createPlaylist,
} from '../components/player.js';
import {
  playSongById,
  getSongById,
  openSongDetails,
  shareCurrentSong,
  shareSpecificSong,
  sharePlaylist,
  saveRecentItem,
  dedupeSongs,
  rememberSongs,
  seedCatalog,
  saveRecentSearch,
} from './details.js';
import { state, STORAGE, showToast, globals, applyTheme } from '../config/config.js';
import { renderOverlay } from '../components/overlay.js';
import {
  renderSidebarPlaylists,
  refreshPlaybackUI,
  renderPlayerBar,
  markActiveNav,
} from '../components/playerBar.js';
import {
  renderFullscreenPlayer,
  playYTPlaylist,
} from '../components/fullscreen.js';
import { downloadCurrentSong, formatTime, openLyrics, saveJSON } from '../utils/utils.js';
import { renderLyricsPanel } from '../components/lyrics.js';
import { updateWavyProgress } from '../components/wavyProgress.js';
import {
  openArtistProfile,
  renderArtistProfile,
} from '../components/artistProfile.js';
import {
  renderQueuePanel,
  removeFromQueue,
  clearQueue,
} from '../components/queuePanel.js';
import { loadTrendingSongs } from '../services/dataLoader.js';
import { runSearch } from '../services/search.js';
import { searchSongs } from '../services/apiMapping.js';
import {
  openFullscreenPlayer,
  closeFullscreenPlayer,
  openQueuePanel,
  closeQueuePanel,
  openLyricsPanel,
  closeLyricsPanel,
  closeArtistProfile,
  openModal,
  closeModal,
  handleGlobalPopState,
  isSearchModeActive,
  exitSearchMode,
  pushHistoryLayer,
  popHistoryLayer,
  dismissKeyboard,
} from './navigationHistory.js';

export function vibrate() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(10);
    } catch (e) {}
  }
}

export function bindGlobalEvents() {
  window.addEventListener('hashchange', renderCurrentRoute);
  window.addEventListener('popstate', handleGlobalPopState);
  window.addEventListener('resize', () => markActiveNav());

  // Instantaneous tactile feedback on touch/click: start moving liquid pill immediately
  document.addEventListener(
    'pointerdown',
    (event) => {
      const routeButton = event.target.closest(
        '.nav-link, .mobile-nav-item, [data-route]'
      );
      if (routeButton && routeButton.dataset.route) {
        markActiveNav(routeButton.dataset.route);
      }
    },
    { passive: true }
  );

  // Image protection: Prevent accidental context menu & drag ghosting on media/artwork
  document.addEventListener('contextmenu', (event) => {
    if (event.target && event.target.closest('img, picture, video, canvas, .card-img-wrap, .scroll-cover-wrap, .fs-cover-wrap, .home-grid-cover-wrap')) {
      event.preventDefault();
    }
  });

  document.addEventListener('dragstart', (event) => {
    if (
      event.target &&
      (event.target.tagName === 'IMG' ||
        event.target.tagName === 'PICTURE' ||
        event.target.closest('img, picture, video, canvas, svg, a img, .card-img-wrap, .scroll-cover-wrap, .fs-cover-wrap, .home-grid-cover-wrap, .you-avatar-wrap, .you-hub-cover-wrap'))
    ) {
      event.preventDefault();
    }
  });

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest(
      'button, .song-row, .card, .home-scroll-card, .nav-link, .mobile-nav-item, .category-card, .queue-item, .list-item, .search-dropdown-item'
    );
    if (btn) vibrate();
    const actionNode = event.target.closest('[data-action]');
    const routeButton = event.target.closest('[data-route]');
    if (actionNode && (!routeButton || routeButton.contains(actionNode))) {
      // Prioritize specific action
    } else if (routeButton) {
      event.preventDefault();
      dismissKeyboard();
      if (state.modal) closeModal();
      if (state.queuePanel) closeQueuePanel();
      if (state.artistProfile) closeArtistProfile();
      if (state.lyricsPanel) closeLyricsPanel();
      if (state.fullscreenPlayer) closeFullscreenPlayer();
      const targetRoute = routeButton.dataset.route;
      markActiveNav(targetRoute);
      navigate(targetRoute);
      return;
    }

    if (!actionNode) return;

    const action = actionNode.dataset.action;
    const songId = actionNode.dataset.songId || null;
    const source = actionNode.dataset.source || null;
    const playlistId = actionNode.dataset.playlistId || null;

    try {
      if (action === 'clear-search-input') {
        event.preventDefault();
        exitSearchMode(true);
        const input = document.getElementById('search-input');
        if (input) {
          input.value = '';
          input.focus();
        }
        return;
      }
      if (action === 'search-category') {
        event.preventDefault();
        const category = actionNode.dataset.category;
        if (category) {
          state.searchQuery = category; saveJSON(STORAGE.SEARCH_QUERY, category);
          const searchInput = document.querySelector('.search-input');
          if (searchInput) searchInput.value = category;
          // Trigger search using performSearch or by dispatching an event
          // It looks like search is handled elsewhere, let's trigger the input event
          if (searchInput) {
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        return;
      }
      if (action === 'play-something') {
        event.preventDefault();
        await playSomething();
        return;
      }
      if (action === 'toggle-play') {
        event.preventDefault();
        await togglePlay();
        return;
      }
      if (action === 'next-track') {
        event.preventDefault();
        await nextTrack();
        return;
      }
      if (action === 'prev-track') {
        event.preventDefault();
        previousTrack();
        return;
      }
      if (action === 'play-song' && songId) {
        event.preventDefault();
        await playSongById(songId, source, playlistId);
        return;
      }
      if (action === 'toggle-favorite' && songId) {
        event.preventDefault();
        const song = getSongById(songId);
        if (song) toggleFavorite(song);
        return;
      }
      if (action === 'open-song-details') {
        event.preventDefault();
        openSongDetails();
        return;
      }
      if (action === 'share-song') {
        event.preventDefault();
        await shareCurrentSong();
        return;
      }
      if (action === 'share-specific-song' && songId) {
        event.preventDefault();
        await shareSpecificSong(songId);
        return;
      }
      if (action === 'share-playlist' && playlistId) {
        event.preventDefault();
        await sharePlaylist(playlistId);
        return;
      }
      if (action === 'open-playlist-picker' && songId) {
        event.preventDefault();
        openModal({ type: 'playlistPicker', songId });
        return;
      }
      if (action === 'playlist-toggle-song' && songId && playlistId) {
        event.preventDefault();
        const song = getSongById(songId);
        if (!song) return;
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (!playlist) return;
        if (playlist.songs.some((item) => item.id === song.id))
          removeFromPlaylist(song.id, playlistId);
        else addToPlaylist(song, playlistId);
        state.modal = { type: 'playlistPicker', songId };
        renderOverlay();
        renderSidebarPlaylists();
        return;
      }

      if (action === 'open-create-playlist') {
        event.preventDefault();
        openModal({ type: 'createPlaylist' });
        return;
      }
      if (action === 'close-modal') {
        event.preventDefault();
        closeModal();
        return;
      }
      if (action === 'open-fullscreen-player') {
        event.preventDefault();
        openFullscreenPlayer();
        return;
      }
      if (action === 'close-fullscreen-player') {
        event.preventDefault();
        closeFullscreenPlayer();
        return;
      }
      if (action === 'toggle-video') {
        event.preventDefault();
        state.videoVisible = !state.videoVisible;
        const container = document.getElementById('yt-player-container');
        if (container) {
          if (state.videoVisible) container.classList.add('video-visible');
          else container.classList.remove('video-visible');
        }
        refreshPlaybackUI();
        renderPlayerBar();
        renderFullscreenPlayer();
        renderOverlay();
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        return;
      }
      if (action === 'toggle-repeat') {
        event.preventDefault();
        toggleRepeat();
        renderOverlay();
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        return;
      }
      if (action === 'toggle-shuffle') {
        event.preventDefault();
        toggleShuffle();
        renderOverlay();
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        return;
      }
      if (action === 'download-song') {
        event.preventDefault();
        downloadCurrentSong();
        return;
      }
      if (action === 'open-lyrics') {
        event.preventDefault();
        openLyricsPanel();
        return;
      }
      if (action === 'close-lyrics') {
        event.preventDefault();
        closeLyricsPanel();
        return;
      }
      if (action === 'open-artist-profile') {
        event.preventDefault();
        const artistName = actionNode.dataset.artist || '';
        if (artistName) openArtistProfile(artistName);
        return;
      }
      if (action === 'open-playlist-profile') {
        event.preventDefault();
        const pid = actionNode.dataset.playlistId;
        if (pid) {
          const titleNode =
            actionNode.querySelector('span') ||
            actionNode.querySelector('.card-title');
          const name = titleNode ? titleNode.innerText : 'Playlist';
          const img = actionNode.querySelector('img')?.src || '';
          
          if (titleNode) {
            saveRecentItem('playlist', {
              id: pid,
              title: name,
              subtitle: 'Playlist',
              imageUrl: img,
            });
          }
          
          // Pre-populate temporary playlist to show loading state
          if (!state.ytPlaylists) state.ytPlaylists = {};
          if (!state.ytPlaylists[pid]) {
             state.ytPlaylists[pid] = { id: pid, name: name, coverUrl: img, songs: [], isLoading: true, isSystem: true };
             
             fetch(`/api/search?type=playlist_videos&q=${pid}`)
               .then(res => res.json())
               .then(data => {
                  state.ytPlaylists[pid].songs = data.items || [];
                  state.ytPlaylists[pid].isLoading = false;
                  window.dispatchEvent(new CustomEvent('routechange'));
               })
               .catch(e => {
                  state.ytPlaylists[pid].isLoading = false;
                  showToast('Error loading playlist.');
                  window.dispatchEvent(new CustomEvent('routechange'));
               });
          }
          
          window.location.hash = '/playlist/' + pid;
        }
        return;
      }
      if (action === 'close-artist-profile') {
        event.preventDefault();
        closeArtistProfile();
        return;
      }
      if (action === 'open-queue') {
        event.preventDefault();
        openQueuePanel();
        return;
      }
      if (action === 'close-queue') {
        event.preventDefault();
        closeQueuePanel();
        return;
      }
      if (action === 'remove-from-queue' && songId) {
        event.preventDefault();
        removeFromQueue(songId);
        return;
      }
      if (action === 'navigate') {
        event.preventDefault();
        dismissKeyboard();
        if (state.modal) closeModal();
        if (state.queuePanel) closeQueuePanel();
        if (state.artistProfile) closeArtistProfile();
        if (state.lyricsPanel) closeLyricsPanel();
        if (state.fullscreenPlayer) closeFullscreenPlayer();
        const target = actionNode.dataset.path || actionNode.dataset.route || '/';
        markActiveNav(target);
        navigate(target);
        return;
      }
      if (action === 'go-back') {
        event.preventDefault();
        if (state.fullscreenPlayer) closeFullscreenPlayer();
        const fallback = actionNode.dataset.fallback || (state.route.name === 'settings' ? '/you' : '/');
        if (window.history.length > 1) {
          window.history.back();
        } else {
          markActiveNav(fallback);
          navigate(fallback);
        }
        return;
      }
      if (action === 'clear-queue') {
        event.preventDefault();
        clearQueue();
        return;
      }
      if (action === 'refresh-feed') {
        event.preventDefault();
        loadTrendingSongs(true);
        return;
      }
      if (action === 'open-app-info') {
        event.preventDefault();
        openModal({ type: 'appInfo' });
        return;
      }
      if (action === 'open-welcome-modal') {
        event.preventDefault();
        openModal({ type: 'welcome' });
        return;
      }
      if (action === 'show-offline-info') {
        event.preventDefault();
        showToast('PWA Service Worker active: App shell and offline cache ready');
        return;
      }
      if (action === 'clear-history') {
        event.preventDefault();
        openModal({
          type: 'confirm',
          title: 'Clear History',
          message: 'Are you sure you want to clear your listening history? This cannot be undone.',
          confirmText: 'Clear History',
          isDanger: true,
          onConfirmAction: 'execute-clear-history',
        });
        return;
      }

      if (action === 'execute-clear-history') {
        event.preventDefault();
        closeModal();
        state.recentlyPlayed = [];
        saveJSON(STORAGE.RECENT_PLAYED, []);
        renderCurrentRoute();
        renderSidebarPlaylists();
        showToast('Listening history cleared.');
        return;
      }
      if (action === 'set-search-tab') {
        event.preventDefault();
        state.searchTab = actionNode.dataset.value || 'songs';
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }
      if (action === 'set-library-tab') {
        event.preventDefault();
        state.libraryTab = actionNode.dataset.value || 'recent';
        if (state.route.name === 'library') renderCurrentRoute();
        return;
      }
      if (action === 'clear-search-history') {
        event.preventDefault();
        state.recentSearches = [];
        saveJSON(STORAGE.RECENT_SEARCHES, []);
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }

      if (action === 'export-library') {
        event.preventDefault();
        const data = { favorites: state.favorites, playlists: state.playlists };
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pawtify-library-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Library exported successfully');
        return;
      }

      if (action === 'import-library') {
        event.preventDefault();
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => {
            try {
              const data = JSON.parse(ev.target.result);
              let imported = false;
              if (data.favorites && Array.isArray(data.favorites)) {
                state.favorites = dedupeSongs([
                  ...state.favorites,
                  ...data.favorites,
                ]);
                rememberSongs(state.favorites);
                saveJSON(STORAGE.FAVORITES, state.favorites);
                imported = true;
              }
              if (data.playlists && Array.isArray(data.playlists)) {
                data.playlists.forEach((importedPlaylist) => {
                  const existing = state.playlists.find(
                    (p) =>
                      p.id === importedPlaylist.id ||
                      p.name === importedPlaylist.name
                  );
                  if (existing) {
                    existing.songs = dedupeSongs([
                      ...existing.songs,
                      ...(importedPlaylist.songs || []),
                    ]);
                  } else {
                    state.playlists.push({
                      ...importedPlaylist,
                      id: importedPlaylist.id || generateId(),
                    });
                  }
                });
                saveJSON(STORAGE.PLAYLISTS, state.playlists);
                seedCatalog();
                imported = true;
              }
              if (imported) {
                renderCurrentRoute();
                renderSidebarPlaylists();
                showToast('Library imported successfully');
              } else {
                showToast('No valid library data found');
              }
            } catch (err) {
              showToast('Failed to parse library file');
            }
          };
          reader.readAsText(file);
        };
        input.click();
        return;
      }
      if (action === 'search-mood') {
        event.preventDefault();
        const mood = actionNode.dataset.mood;
        state.searchQuery = mood; saveJSON(STORAGE.SEARCH_QUERY, mood);
        state.searchLoading = true;
        if (state.route.name === 'search') {
          renderCurrentRoute();
          const input = document.getElementById('search-input');
          if (input) input.value = mood;
          runSearch(mood);
        } else {
          state.pendingSearchQuery = mood;
          navigate('/search');
        }
        return;
      }
      if (action === 'use-recent-search') {
        event.preventDefault();
        const query = actionNode.dataset.query || '';
        state.searchQuery = query; saveJSON(STORAGE.SEARCH_QUERY, query);
        if (state.route.name !== 'search') {
          state.pendingSearchQuery = query;
          navigate('/search');
          return;
        }
        renderCurrentRoute();
        const input = document.getElementById('search-input');
        if (input) {
          input.value = query;
          input.focus();
        }
        runSearch(query);
        return;
      }
      if (action === 'remove-recent-search') {
        event.preventDefault();
        const id = actionNode.dataset.id || '';
        const type = actionNode.dataset.type || 'query';
        state.recentSearches = state.recentSearches.filter((entry) => {
          if (type === 'query')
            return entry.type !== 'query' || entry.query !== id;
          return entry.type !== type || entry.id !== id;
        });
        saveJSON(STORAGE.RECENT_SEARCHES, state.recentSearches);
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }

      if (action === 'clear-recent-searches') {
        event.preventDefault();
        state.recentSearches = [];
        saveJSON(STORAGE.RECENT_SEARCHES, []);
        showToast('Recent searches cleared.');
        if (state.route.name === 'search' || state.route.name === 'you' || state.route.name === 'settings') {
          renderCurrentRoute();
        }
        return;
      }

      if (action === 'play-all-playlist' && playlistId) {
        event.preventDefault();
        if (playlistId === 'liked' || playlistId === 'favorites') {
          if (state.favorites && state.favorites.length > 0) {
            await play(state.favorites[0], state.favorites, true);
          } else {
            showToast('No liked songs yet.');
          }
          return;
        }
        if (playlistId === 'history') {
          const historySongs = (state.recentlyPlayed || [])
            .map((id) => getSongById(id))
            .filter(Boolean);
          if (historySongs.length > 0) {
            await play(historySongs[0], historySongs, true);
          } else {
            showToast('Listening history is empty.');
          }
          return;
        }
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (playlist?.songs.length)
          await play(playlist.songs[0], playlist.songs, true);
        return;
      }

      if (action === 'shuffle-playlist' && playlistId) {
        event.preventDefault();
        if (playlistId === 'liked' || playlistId === 'favorites') {
          if (state.favorites && state.favorites.length > 0) {
            const shuffled = [...state.favorites].sort(() => Math.random() - 0.5);
            await play(shuffled[0], shuffled, true);
          } else {
            showToast('No liked songs to shuffle.');
          }
          return;
        }
        if (playlistId === 'history') {
          const historySongs = (state.recentlyPlayed || [])
            .map((id) => getSongById(id))
            .filter(Boolean);
          if (historySongs.length > 0) {
            const shuffled = [...historySongs].sort(() => Math.random() - 0.5);
            await play(shuffled[0], shuffled, true);
          } else {
            showToast('Listening history is empty.');
          }
          return;
        }
        if (playlistId.startsWith('artist-')) {
          const artistName = playlistId.replace('artist-', '');
          if (state.artistProfile?.songs?.length) {
            const shuffled = [...state.artistProfile.songs].sort(
              () => Math.random() - 0.5
            );
            await play(shuffled[0], shuffled, true);
          } else {
            const songs = await searchSongs(artistName, 0, 20);
            if (songs.length) {
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              await play(shuffled[0], shuffled, true);
            }
          }
          return;
        }
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (!playlist?.songs.length) return;
        const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
        await play(shuffled[0], shuffled, true);
        return;
      }

      if (action === 'open-favorites') {
        event.preventDefault();
        navigate('/playlist/liked');
        return;
      }

      if (action === 'play-favorites') {
        event.preventDefault();
        if (state.favorites && state.favorites.length > 0) {
          await play(state.favorites[0], state.favorites, true);
        } else {
          showToast('No liked songs yet.');
        }
        return;
      }

      if (action === 'open-settings') {
        event.preventDefault();
        markActiveNav('/settings');
        navigate('/settings');
        return;
      }

      if (action === 'set-settings-tab') {
        event.preventDefault();
        const tab = actionNode.dataset.tab || 'all';
        if (state.modal && state.modal.type === 'settings') {
          state.modal.tab = tab;
          renderOverlay();
        }
        return;
      }

      if (action === 'set-theme') {
        event.preventDefault();
        const newTheme = actionNode.dataset.theme || 'dark';
        state.theme = newTheme;
        saveJSON(STORAGE.THEME, newTheme);
        applyTheme(newTheme);
        renderOverlay();
        if (state.route.name === 'you') renderCurrentRoute();
        const labels = {
          dark: 'Material Dark',
          amoled: 'AMOLED Black',
          light: 'Material Light',
          system: 'System Mode',
        };
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        showToast(`Theme set to ${labels[newTheme] || newTheme}`);
        return;
      }

      if (action === 'set-audio-quality') {
        event.preventDefault();
        const quality = actionNode.dataset.quality || 'high';
        state.audioQuality = quality;
        saveJSON(STORAGE.AUDIO_QUALITY, quality);
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        const labels = {
          normal: 'Normal (128 kbps)',
          high: 'High (160 kbps Opus)',
          'very-high': 'Very High (256 kbps Opus)',
        };
        showToast(`Audio quality set to ${labels[quality] || quality}`);
        return;
      }

      if (action === 'toggle-autoplay') {
        event.preventDefault();
        state.autoplay = state.autoplay === false;
        saveJSON(STORAGE.AUTOPLAY, state.autoplay);
        renderOverlay();
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        showToast(
          state.autoplay
            ? 'Continuous Autoplay enabled'
            : 'Continuous Autoplay disabled'
        );
        return;
      }

      if (action === 'set-repeat') {
        event.preventDefault();
        const mode = actionNode.dataset.mode || 'none';
        state.repeatMode = mode;
        saveJSON(STORAGE.REPEAT, mode);
        renderPlayerBar();
        renderFullscreenPlayer();
        renderOverlay();
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        const labels = { none: 'Off', all: 'Repeat All', one: 'Repeat 1 Track' };
        showToast(`Repeat mode: ${labels[mode] || mode}`);
        return;
      }

      if (action === 'clear-cache') {
        event.preventDefault();
        openModal({
          type: 'confirm',
          title: 'Clear Cache',
          message: 'Clear cached application data and temp storage? Your saved playlists and liked tracks will remain intact.',
          confirmText: 'Clear Cache',
          isDanger: false,
          onConfirmAction: 'execute-clear-cache',
        });
        return;
      }

      if (action === 'execute-clear-cache') {
        event.preventDefault();
        closeModal();
        if ('caches' in window) {
          try {
            const keys = await caches.keys();
            await Promise.all(keys.map((k) => caches.delete(k)));
          } catch (err) {
            console.warn('Cache clear error:', err);
          }
        }
        showToast('App cache cleared successfully.');
        if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
        return;
      }

      if (action === 'install-pwa') {
        event.preventDefault();
        if (window.deferredPrompt) {
          window.deferredPrompt.prompt();
          window.deferredPrompt.userChoice.then(() => {
            window.deferredPrompt = null;
            renderOverlay();
            if (state.route.name === 'you' || state.route.name === 'settings') renderCurrentRoute();
          });
        } else {
          const isStandalone =
            typeof window !== 'undefined' &&
            window.matchMedia &&
            window.matchMedia('(display-mode: standalone)').matches;
          if (isStandalone) {
            showToast('Pawtify is already installed and running in app mode.');
          } else {
            showToast('Install prompt is not supported by your browser or already active.');
          }
        }
        return;
      }

      if (action === 'reset-all-data') {
        event.preventDefault();
        openModal({
          type: 'confirm',
          title: 'Reset All Data',
          message: 'Are you sure you want to reset all data? This will permanently wipe all local playlists, favorites, listening history, and personal settings.',
          confirmText: 'Reset Everything',
          isDanger: true,
          onConfirmAction: 'execute-reset-all-data',
        });
        return;
      }

      if (action === 'execute-reset-all-data') {
        event.preventDefault();
        closeModal();
        localStorage.clear();
        if (window.indexedDB) {
          try {
            window.indexedDB.deleteDatabase('pawtify_db');
          } catch (e) {}
        }
        showToast('All data has been reset.');
        setTimeout(() => {
          window.location.hash = '#/';
          window.location.reload();
        }, 500);
        return;
      }

      if (action === 'edit-user-name') {
        event.preventDefault();
        openModal({ type: 'editName' });
        return;
      }

      if (action === 'reset-user-name') {
        event.preventDefault();
        state.userName = '';
        saveJSON(STORAGE.USER_NAME, '');
        closeModal();
        renderCurrentRoute();
        showToast('Name reset to default.');
        return;
      }

      if (action === 'delete-playlist' && playlistId) {
        event.preventDefault();
        if (playlistId === 'default' || playlistId === 'history' || playlistId === 'liked') return;
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (!playlist) return;
        openModal({
          type: 'confirm',
          title: 'Delete Playlist',
          message: `Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`,
          confirmText: 'Delete',
          isDanger: true,
          onConfirmAction: 'execute-delete-playlist',
          targetPlaylistId: playlistId,
        });
        return;
      }

      if (action === 'execute-delete-playlist') {
        event.preventDefault();
        const pId = state.modal?.targetPlaylistId;
        closeModal();
        if (pId) {
          deletePlaylist(pId);
          if (
            state.route.name === 'playlist' &&
            state.route.playlistId === pId
          ) {
            navigate('/library');
          } else {
            renderCurrentRoute();
          }
          renderSidebarPlaylists();
          showToast('Playlist deleted.');
        }
        return;
      }
      if (action === 'dismiss-overlay' && event.target === actionNode) {
        event.preventDefault();
        closeModal();
        return;
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  });

  document.addEventListener('focusin', (event) => {
    if (event.target && event.target.id === 'search-input') {
      if (!state.searchLayerActive && state.route?.name === 'search') {
        state.searchLayerActive = true;
        pushHistoryLayer('search');
      }
    }
  });

  document.addEventListener('input', async (event) => {
    const target = event.target;
    if (target.id === 'search-input') {
      if (!state.searchLayerActive && state.route?.name === 'search') {
        state.searchLayerActive = true;
        pushHistoryLayer('search');
      }
      state.searchQuery = target.value; saveJSON(STORAGE.SEARCH_QUERY, target.value);
      if (!state.searchQuery.trim()) {
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [] };
        state.searchSuggestions = [];
        globals.searchRequestToken += 1;
        if (globals.searchTimer) {
          window.clearTimeout(globals.searchTimer);
          globals.searchTimer = null;
        }
        if (state.route.name === 'search') renderCurrentRoute();
        return;
      }
      state.searchLoading = true;
      
      // Fast fetch for suggestions
      const currentQuery = state.searchQuery;
      
      if (state.route.name === 'search') {
        renderCurrentRoute();
      }
      
      if (globals.suggestionTimer) window.clearTimeout(globals.suggestionTimer);
      globals.suggestionTimer = window.setTimeout(async () => {
         const { fetchSearchSuggestions } = await import('../services/apiMapping.js');
         if (state.searchQuery === currentQuery) {
            state.searchSuggestions = await fetchSearchSuggestions(currentQuery);
            if (state.route.name === 'search') {
               const { updateSearchPageUI } = await import('../components/components.js');
               updateSearchPageUI();
            }
         }
      }, 150);

      if (globals.searchTimer) window.clearTimeout(globals.searchTimer);
      globals.searchTimer = window.setTimeout(() => {
        runSearch(state.searchQuery);
      }, 500);
    }
    if (target.id === 'seekbar' || target.id === 'fs-seekbar') {
      state.isSeeking = true;
      const nextTime = Number.parseFloat(target.value);
      if (!Number.isNaN(nextTime)) {
        state.progress = nextTime;
        const maxVal = Number.parseFloat(target.max) || 1;
        const pct = maxVal > 0 ? (nextTime / maxVal) * 100 : 0;
        target.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
        const currentLabel = document.getElementById('time-current');
        if (currentLabel) currentLabel.textContent = formatTime(nextTime);
        const fsCurrentLabel = document.getElementById('fs-time-current');
        if (fsCurrentLabel) fsCurrentLabel.textContent = formatTime(nextTime);
        if (target.id === 'fs-seekbar') {
          updateWavyProgress();
        }
      }
    }
    if (target.id === 'volume-slider' || target.id === 'fs-volume-slider') {
      const nextVolume = Number.parseFloat(target.value) / 100;
      if (!Number.isNaN(nextVolume)) setVolume(nextVolume);
    }
  });

  document.addEventListener('change', (event) => {
    const target = event.target;
    if (target.id === 'seekbar' || target.id === 'fs-seekbar') {
      state.isSeeking = false;
      const nextTime = Number.parseFloat(target.value);
      if (!Number.isNaN(nextTime)) seekTo(nextTime);
    }
  });

  const endSeeking = () => {
    if (state.isSeeking) {
      state.isSeeking = false;
    }
  };
  document.addEventListener('pointerup', endSeeking);
  document.addEventListener('touchend', endSeeking);

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id === 'save-name-form') {
      event.preventDefault();
      const input = form.querySelector("input[name='userName']");
      const name = (input?.value || '').trim();
      state.userName = name;
      saveJSON(STORAGE.USER_NAME, name);
      saveJSON('pawtify-welcome-seen', true);
      closeModal();
      renderCurrentRoute();
      showToast(name ? `Welcome to Pawtify, ${name}!` : 'Welcome to Pawtify!');
      return;
    }
    if (form.id !== 'create-playlist-form') return;
    event.preventDefault();
    const input = form.querySelector("input[name='playlistName']");
    const name = (input?.value || '').trim();
    if (!name) return;
    createPlaylist(name);
    closeModal();
    renderCurrentRoute();
    renderSidebarPlaylists();
  });

  document.addEventListener('keydown', (event) => {
    if (event.target.id === 'search-input' && event.key === 'Enter') {
      event.preventDefault();
      event.target.blur();
      const q = state.searchQuery.trim();
      if (q) {
        saveRecentSearch(q);
        runSearch(q);
      }
    }
    if (event.key === 'Escape') {
      if (state.modal) {
        closeModal();
        return;
      }
      if (state.queuePanel) {
        closeQueuePanel();
        return;
      }
      if (state.artistProfile) {
        closeArtistProfile();
        return;
      }
      if (state.lyricsPanel) {
        closeLyricsPanel();
        return;
      }
      if (state.fullscreenPlayer) {
        closeFullscreenPlayer();
        return;
      }
      if (isSearchModeActive()) {
        exitSearchMode(true);
        return;
      }
    }
  });
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (state.fullscreenPlayer) renderFullscreenPlayer(true);
  }, 200);
});
