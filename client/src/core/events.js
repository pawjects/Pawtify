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
  saveRecentItem,
  dedupeSongs,
  rememberSongs,
  seedCatalog,
  saveRecentSearch,
} from './details.js';
import { state, STORAGE, showToast, globals } from '../config/config.js';
import { renderOverlay } from '../components/overlay.js';
import {
  renderSidebarPlaylists,
  refreshPlaybackUI,
  renderPlayerBar,
} from '../components/playerBar.js';
import {
  renderFullscreenPlayer,
  playYTPlaylist,
} from '../components/fullscreen.js';
import { downloadCurrentSong, openLyrics, saveJSON } from '../utils/utils.js';
import { renderLyricsPanel } from '../components/lyrics.js';
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

export function vibrate() {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(50);
    } catch (e) {}
  }
}

export function bindGlobalEvents() {
  window.addEventListener('hashchange', renderCurrentRoute);

  document.addEventListener('click', async (event) => {
    const btn = event.target.closest(
      'button, .song-row, .card, .home-scroll-card, .nav-link, .mobile-nav-item, .category-card'
    );
    if (btn) vibrate();
    const routeButton = event.target.closest('[data-route]');
    if (routeButton) {
      event.preventDefault();
      navigate(routeButton.dataset.route);
      return;
    }

    const actionNode = event.target.closest('[data-action]');
    if (!actionNode) return;

    const action = actionNode.dataset.action;
    const songId = actionNode.dataset.songId || null;
    const source = actionNode.dataset.source || null;
    const playlistId = actionNode.dataset.playlistId || null;

    try {
      if (action === 'clear-search-input') {
        event.preventDefault();
        state.searchQuery = ''; saveJSON(STORAGE.SEARCH_QUERY, '');
        state.searchLoading = false;
        state.searchResults = { songs: [], artists: [], playlists: [] }; state.searchSuggestions = [];
        if (state.route.name === 'search') {
          renderCurrentRoute();
          const input = document.getElementById('search-input');
          if (input) {
            input.value = '';
            input.focus();
          }
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
      if (action === 'open-playlist-picker' && songId) {
        event.preventDefault();
        state.modal = { type: 'playlistPicker', songId };
        renderOverlay();
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
        state.modal = { type: 'createPlaylist' };
        renderOverlay();
        return;
      }
      if (action === 'close-modal') {
        event.preventDefault();
        state.modal = null;
        renderOverlay();
        return;
      }
      if (action === 'open-fullscreen-player') {
        event.preventDefault();
        state.fullscreenPlayer = true;
        renderFullscreenPlayer();
        return;
      }
      if (action === 'close-fullscreen-player') {
        event.preventDefault();
        state.fullscreenPlayer = false;
        renderFullscreenPlayer();
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
        return;
      }
      if (action === 'toggle-repeat') {
        event.preventDefault();
        toggleRepeat();
        return;
      }
      if (action === 'toggle-shuffle') {
        event.preventDefault();
        toggleShuffle();
        return;
      }
      if (action === 'download-song') {
        event.preventDefault();
        downloadCurrentSong();
        return;
      }
      if (action === 'open-lyrics') {
        event.preventDefault();
        openLyrics();
        return;
      }
      if (action === 'close-lyrics') {
        event.preventDefault();
        state.lyricsPanel = false;
        renderLyricsPanel();
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
        state.artistProfile = null;
        renderArtistProfile();
        return;
      }
      if (action === 'open-queue') {
        event.preventDefault();
        state.queuePanel = true;
        renderQueuePanel();
        return;
      }
      if (action === 'close-queue') {
        event.preventDefault();
        state.queuePanel = false;
        renderQueuePanel();
        return;
      }
      if (action === 'remove-from-queue' && songId) {
        event.preventDefault();
        removeFromQueue(songId);
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
        state.modal = { type: 'appInfo' };
        renderOverlay();
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

      if (action === 'play-all-playlist' && playlistId) {
        event.preventDefault();
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (playlist?.songs.length)
          await play(playlist.songs[0], playlist.songs, true);
        return;
      }

      if (action === 'shuffle-playlist' && playlistId) {
        event.preventDefault();
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

      if (action === 'delete-playlist' && playlistId) {
        event.preventDefault();
        if (playlistId === 'default') return;
        const playlist = state.playlists.find(
          (entry) => entry.id === playlistId
        );
        if (!playlist) return;
        if (window.confirm(`Delete "${playlist.name}"?`)) {
          deletePlaylist(playlistId);
          if (
            state.route.name === 'playlist' &&
            state.route.playlistId === playlistId
          )
            navigate('/library');
          else renderCurrentRoute();
        }
        return;
      }
      if (action === 'dismiss-overlay' && event.target === actionNode) {
        event.preventDefault();
        state.modal = null;
        renderOverlay();
        return;
      }
    } catch (err) {
      console.error('Action error:', err);
    }
  });

  document.addEventListener('input', async (event) => {
    const target = event.target;
    if (target.id === 'search-input') {
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
      const nextTime = Number.parseFloat(target.value);
      if (!Number.isNaN(nextTime)) seekTo(nextTime);
    }
    if (target.id === 'volume-slider' || target.id === 'fs-volume-slider') {
      const nextVolume = Number.parseFloat(target.value) / 100;
      if (!Number.isNaN(nextVolume)) setVolume(nextVolume);
    }
  });

  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (form.id !== 'create-playlist-form') return;
    event.preventDefault();
    const input = form.querySelector("input[name='playlistName']");
    const name = (input?.value || '').trim();
    if (!name) return;
    createPlaylist(name);
    state.modal = null;
    renderCurrentRoute();
    renderOverlay();
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
      if (state.lyricsPanel) {
        state.lyricsPanel = false;
        renderLyricsPanel();
        return;
      }
      if (state.artistProfile) {
        state.artistProfile = null;
        renderArtistProfile();
        return;
      }
      if (state.queuePanel) {
        state.queuePanel = false;
        renderQueuePanel();
        return;
      }
      if (state.fullscreenPlayer) {
        state.fullscreenPlayer = false;
        renderFullscreenPlayer();
        return;
      }
      if (state.modal) {
        state.modal = null;
        renderOverlay();
      }
    }
  });
}

window.addEventListener('resize', () => {
  if (state.fullscreenPlayer) renderFullscreenPlayer();
});
