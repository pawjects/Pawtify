import { state, showToast } from '../config/config.js';
import { appMain } from '../config/dom.js';
import { parseRoute, isValidSongId, navigate } from '../config/router.js';
import {
  markActiveNav,
  renderPlayerBar,
  renderMiniPlayer,
  renderSidebarPlaylists,
  refreshPlaybackUI,
} from './playerBar.js';
import {
  renderSearchPage,
  renderLibraryPage,
  renderPlaylistPage,
  updateSearchPageUI,
} from './components.js';
import { runSearch } from '../services/search.js';
import { renderHomePage } from './home.js';
import { renderYouPage } from './you.js';
import { renderFullscreenPlayer } from './fullscreen.js';
import { renderLyricsPanel } from './lyrics.js';
import { renderArtistProfile } from './artistProfile.js';
import { renderQueuePanel } from './queuePanel.js';
import { renderOverlay } from './overlay.js';
import { fetchSongById } from '../services/dataLoader.js';
import { play } from './player.js';

let currentDeepLinkSongId = null;
let isHandlingDeepLink = false;

export async function handleSongDeepLink(songId) {
  if (!songId || !isValidSongId(songId)) {
    showToast('Invalid music link. Redirected to Home.');
    navigate('/');
    return;
  }

  // If already playing this song, open fullscreen player view
  if (state.currentSong?.id === songId) {
    state.fullscreenPlayer = true;
    renderFullscreenPlayer();
    renderPlayerBar();
    renderMiniPlayer();
    refreshPlaybackUI();
    return;
  }

  if (isHandlingDeepLink && currentDeepLinkSongId === songId) {
    return;
  }

  isHandlingDeepLink = true;
  currentDeepLinkSongId = songId;

  try {
    showToast('Loading shared track...');
    const song = await fetchSongById(songId);
    if (!song) {
      showToast('Could not load track. Redirected to Home.');
      navigate('/');
      return;
    }

    // Directly open corresponding music/player view
    state.fullscreenPlayer = true;
    renderFullscreenPlayer();

    // Make sure the correct track is loaded into the player
    await play(song, [song], true);
  } catch (err) {
    console.error('Failed to handle song deep link:', err);
    showToast('Failed to load shared music track.');
    navigate('/');
  } finally {
    isHandlingDeepLink = false;
    renderFullscreenPlayer();
    renderPlayerBar();
    renderMiniPlayer();
    refreshPlaybackUI();
  }
}

export function renderCurrentRoute() {
  if (!appMain) return;
  try {
    state.route = parseRoute();
    markActiveNav();

    if (state.route.name === 'search') {
      const activeId = document.activeElement
        ? document.activeElement.id
        : null;

      const existingInput = document.getElementById('search-input');
      const isAlreadyOnSearchPage =
        !!existingInput &&
        appMain.querySelector('.page-title')?.textContent === 'Search';

      if (isAlreadyOnSearchPage) {
        updateSearchPageUI();
      } else {
        appMain.innerHTML = renderSearchPage();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.value = state.searchQuery;
          if (activeId === 'search-input') {
            searchInput.focus();
            const len = searchInput.value.length;
            searchInput.setSelectionRange(len, len);
          }
        }
      }

      if (state.pendingSearchQuery) {
        const pending = state.pendingSearchQuery;
        state.pendingSearchQuery = '';
        runSearch(pending);
      } else if (
        state.searchQuery &&
        (!state.searchResults.songs || state.searchResults.songs.length === 0)
      ) {
        runSearch(state.searchQuery);
      }
    } else if (state.route.name === 'library') {
      appMain.innerHTML = renderLibraryPage();
    } else if (state.route.name === 'you') {
      appMain.innerHTML = renderYouPage();
    } else if (state.route.name === 'playlist') {
      appMain.innerHTML = renderPlaylistPage(state.route.playlistId);
    } else if (state.route.name === 'song') {
      appMain.innerHTML = renderHomePage();
      if (state.route.songId) {
        handleSongDeepLink(state.route.songId);
      } else {
        navigate('/');
      }
    } else {
      appMain.innerHTML = renderHomePage();
    }

    renderPlayerBar();
    renderMiniPlayer();
    renderFullscreenPlayer();
    renderLyricsPanel();
    renderArtistProfile();
    renderQueuePanel();
    renderOverlay();
    renderSidebarPlaylists();
    refreshPlaybackUI();
  } catch (e) {
    console.error('renderCurrentRoute error:', e);
  }
}
