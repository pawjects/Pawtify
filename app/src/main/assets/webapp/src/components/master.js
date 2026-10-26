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
import { renderYouPage, renderSettingsPage } from './you.js';
import { renderFullscreenPlayer } from './fullscreen.js';
import { renderLyricsPanel } from './lyrics.js';
import { renderArtistProfile } from './artistProfile.js';
import { renderQueuePanel } from './queuePanel.js';
import { renderOverlay } from './overlay.js';
import { fetchSongById } from '../services/dataLoader.js';
import { hapticTabChange } from '../utils/haptics.js';
import { play } from './player.js';

let currentDeepLinkSongId = null;
let isHandlingDeepLink = false;
const tabScrollPositions = new Map();
let previousRoute = null;

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
  const main = appMain || document.getElementById('app-main');
  if (!main) {
    console.error('[Mount Crash: appMain missing] "#app-main" container was not found in the DOM.');
    return;
  }

  try {
    const prevKey = previousRoute?.name === 'playlist' ? `playlist-${previousRoute.playlistId}` : previousRoute?.name || 'home';
    tabScrollPositions.set(prevKey, main.scrollTop);

    try {
      state.route = parseRoute();
    } catch (routeErr) {
      console.error('[Mount Crash: parseRoute]', routeErr);
      state.route = { name: 'home' };
    }

    try {
      markActiveNav();
    } catch (navErr) {
      console.warn('[Mount Warning: markActiveNav]', navErr);
    }

    // Isolated mount of main page route content
    try {
      if (state.route.name === 'search') {
        const activeId = document.activeElement
          ? document.activeElement.id
          : null;

        const existingInput = document.getElementById('search-input');
        const isAlreadyOnSearchPage =
          !!existingInput &&
          main.querySelector('.page-title')?.textContent === 'Search';

        if (isAlreadyOnSearchPage) {
          updateSearchPageUI();
        } else {
          main.innerHTML = renderSearchPage();
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
        if (state.route.subTab) {
          state.libraryTab = state.route.subTab;
        }
        main.innerHTML = renderLibraryPage();
      } else if (state.route.name === 'settings') {
        main.innerHTML = renderSettingsPage();
      } else if (state.route.name === 'you') {
        main.innerHTML = renderYouPage();
      } else if (state.route.name === 'playlist') {
        main.innerHTML = renderPlaylistPage(state.route.playlistId);
      } else if (state.route.name === 'song') {
        main.innerHTML = renderHomePage();
        if (state.route.songId) {
          handleSongDeepLink(state.route.songId);
        } else {
          navigate('/');
        }
      } else {
        main.innerHTML = renderHomePage();
      }
    } catch (routeMountErr) {
      console.error(`[Mount Crash: Route "${state.route?.name}"]`, routeMountErr);
      main.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px; text-align: center;">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--danger, #ef4444); margin-bottom: 16px;"></i>
          <h2 style="font-size: 1.4rem; margin-bottom: 8px;">View Render Error</h2>
          <p style="color: var(--muted); font-size: 0.9rem; max-width: 420px; margin: 0 auto 16px;">
            An error occurred while mounting the "${state.route?.name || 'current'}" screen.
          </p>
          <button class="btn btn-primary" onclick="window.location.hash='#/'; window.location.reload();" type="button" style="padding: 8px 20px;">
            <i class="fa-solid fa-rotate-right"></i> Reload App
          </button>
        </div>
      `;
    }

    const newKey = state.route.name === 'playlist' ? `playlist-${state.route.playlistId}` : state.route.name;
    const targetScroll = tabScrollPositions.get(newKey) || 0;
    if (prevKey !== newKey) {
      if (previousRoute) {
        try {
          hapticTabChange();
        } catch (_) {}
      }
      main.scrollTop = targetScroll;
      requestAnimationFrame(() => {
        if (main) main.scrollTop = targetScroll;
      });
    }
    previousRoute = { ...state.route };

    // Isolated mount of UI peripheral components
    try {
      renderPlayerBar();
    } catch (err) {
      console.error('[Mount Crash: PlayerBar]', err);
    }

    try {
      renderMiniPlayer();
    } catch (err) {
      console.error('[Mount Crash: MiniPlayer]', err);
    }

    try {
      renderFullscreenPlayer();
    } catch (err) {
      console.error('[Mount Crash: FullscreenPlayer]', err);
    }

    try {
      renderLyricsPanel();
    } catch (err) {
      console.error('[Mount Crash: LyricsPanel]', err);
    }

    try {
      renderArtistProfile();
    } catch (err) {
      console.error('[Mount Crash: ArtistProfile]', err);
    }

    try {
      renderQueuePanel();
    } catch (err) {
      console.error('[Mount Crash: QueuePanel]', err);
    }

    try {
      renderOverlay();
    } catch (err) {
      console.error('[Mount Crash: Overlay]', err);
    }

    try {
      renderSidebarPlaylists();
    } catch (err) {
      console.error('[Mount Crash: SidebarPlaylists]', err);
    }

    try {
      refreshPlaybackUI();
    } catch (err) {
      console.error('[Mount Crash: PlaybackUI]', err);
    }
  } catch (topLevelErr) {
    console.error('[Mount Crash: renderCurrentRoute Top-Level Exception]', topLevelErr);
  }
}

