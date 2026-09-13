import { state } from '../config/config.js';
import { appMain } from '../config/dom.js';
import { parseRoute } from '../config/router.js';
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
} from './components.js';
import { runSearch } from '../services/search.js';
import { renderHomePage } from './home.js';
import { renderFullscreenPlayer } from './fullscreen.js';
import { renderLyricsPanel } from './lyrics.js';
import { renderArtistProfile } from './artistProfile.js';
import { renderQueuePanel } from './queuePanel.js';
import { renderOverlay } from './overlay.js';

export function renderCurrentRoute() {
  if (!appMain) return;
  try {
    state.route = parseRoute();
    markActiveNav();

    if (state.route.name === 'search') {
      const activeId = document.activeElement
        ? document.activeElement.id
        : null;
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
      if (state.pendingSearchQuery) {
        const pending = state.pendingSearchQuery;
        state.pendingSearchQuery = '';
        runSearch(pending);
      }
    } else if (state.route.name === 'library') {
      appMain.innerHTML = renderLibraryPage();
    } else if (state.route.name === 'playlist') {
      appMain.innerHTML = renderPlaylistPage(state.route.playlistId);
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
