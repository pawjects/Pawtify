import { state, STORAGE } from '../config/config.js';
import { saveJSON } from '../utils/utils.js';
import { renderFullscreenPlayer } from '../components/fullscreen.js';
import { renderQueuePanel } from '../components/queuePanel.js';
import { renderLyricsPanel } from '../components/lyrics.js';
import { renderArtistProfile } from '../components/artistProfile.js';
import { renderOverlay } from '../components/overlay.js';
import { renderCurrentRoute } from '../components/master.js';
import { navigate } from '../config/router.js';

/**
 * Intelligent Mobile Back-Button & Layer Manager for Pawtify
 * Manages layer stack with browser History API so Android Back,
 * swipe-back, and UI close buttons follow a strict native priority hierarchy:
 *
 * Back pressed:
 *   1. Modal open? -> Close modal
 *   2. Bottom sheet (queue, lyrics, artist) open? -> Close sheet
 *   3. Fullscreen player open? -> Collapse/Exit fullscreen player (playback continues uninterrupted)
 *   4. Search mode active? -> Blur keyboard, clear query, exit search mode
 *   5. Nested page? -> Navigate to previous page
 *   6. Top-level tab other than home (when direct deep-link)? -> Navigate to Home
 *   7. Home / root? -> Allow normal browser exit
 */

let isPoppingInternally = false;

export function pushHistoryLayer(layerName) {
  try {
    const currentHash = window.location.hash || '#/';
    window.history.pushState(
      { pawtifyLayer: layerName, hash: currentHash, timestamp: Date.now() },
      '',
      currentHash
    );
  } catch (e) {
    console.warn('History pushState error:', e);
  }
}

export function popHistoryLayer(layerName) {
  try {
    if (window.history.state && window.history.state.pawtifyLayer === layerName) {
      isPoppingInternally = true;
      window.history.back();
      setTimeout(() => {
        isPoppingInternally = false;
      }, 120);
      return true;
    }
  } catch (e) {
    console.warn('History pop error:', e);
  }
  return false;
}

export function openFullscreenPlayer() {
  if (!state.currentSong) return;
  if (state.fullscreenPlayer) return;
  state.fullscreenPlayer = true;
  pushHistoryLayer('fullscreen');
  renderFullscreenPlayer();
}

export function closeFullscreenPlayer(syncHistory = true) {
  state.fullscreenPlayer = false;
  renderFullscreenPlayer();
  if (syncHistory) {
    popHistoryLayer('fullscreen');
  }
}

export function openModal(modalData) {
  state.modal = modalData;
  pushHistoryLayer('modal');
  renderOverlay();
}

export function closeModal(syncHistory = true) {
  state.modal = null;
  renderOverlay();
  if (syncHistory) {
    popHistoryLayer('modal');
  }
}

export function openQueuePanel() {
  if (state.queuePanel) return;
  state.queuePanel = true;
  pushHistoryLayer('queue');
  renderQueuePanel();
}

export function closeQueuePanel(syncHistory = true) {
  state.queuePanel = false;
  renderQueuePanel();
  if (syncHistory) {
    popHistoryLayer('queue');
  }
}

export function openLyricsPanel() {
  if (state.lyricsPanel) return;
  state.lyricsPanel = true;
  pushHistoryLayer('lyrics');
  renderLyricsPanel();
}

export function closeLyricsPanel(syncHistory = true) {
  state.lyricsPanel = false;
  renderLyricsPanel();
  if (syncHistory) {
    popHistoryLayer('lyrics');
  }
}

export function closeArtistProfile(syncHistory = true) {
  state.artistProfile = null;
  renderArtistProfile();
  if (syncHistory) {
    popHistoryLayer('artist');
  }
}

export function dismissKeyboard() {
  if (
    document.activeElement &&
    typeof document.activeElement.blur === 'function' &&
    (document.activeElement.tagName === 'INPUT' ||
      document.activeElement.tagName === 'TEXTAREA')
  ) {
    document.activeElement.blur();
  }
}

export function isSearchModeActive() {
  const isSearchPage = state.route?.name === 'search';
  const hasQuery = Boolean(state.searchQuery && state.searchQuery.trim().length > 0);
  const input = document.getElementById('search-input');
  const isInputFocused = Boolean(input && document.activeElement === input);
  return isSearchPage && (hasQuery || isInputFocused || state.searchLayerActive);
}

export function exitSearchMode(syncHistory = true) {
  dismissKeyboard();
  state.searchQuery = '';
  saveJSON(STORAGE.SEARCH_QUERY, '');
  state.searchResults = { songs: [], artists: [], playlists: [] };
  state.searchSuggestions = [];
  const wasActive = state.searchLayerActive;
  state.searchLayerActive = false;
  if (syncHistory && wasActive) {
    popHistoryLayer('search');
  }
  renderCurrentRoute();
}

/**
 * Global popstate handler executing the exact priority hierarchy.
 */
export function handleGlobalPopState(event) {
  // If we triggered history.back() programmatically via popHistoryLayer, ignore this popstate event
  if (isPoppingInternally) {
    isPoppingInternally = false;
    return;
  }

  // Dismiss virtual keyboard if active
  dismissKeyboard();

  // 1. Modal open? -> Close modal first
  if (state.modal) {
    closeModal(false);
    return;
  }

  // 2. Bottom sheets open? -> Close bottom sheet first
  if (state.queuePanel) {
    closeQueuePanel(false);
    return;
  }

  if (state.artistProfile) {
    closeArtistProfile(false);
    return;
  }

  if (state.lyricsPanel) {
    closeLyricsPanel(false);
    return;
  }

  // 3. Fullscreen player open? -> Exit fullscreen player (playback continues uninterrupted)
  if (state.fullscreenPlayer) {
    closeFullscreenPlayer(false);
    return;
  }

  // 4. Search mode active? -> Exit search mode before leaving page
  if (isSearchModeActive()) {
    exitSearchMode(false);
    return;
  }

  // 5. Nested page (e.g. playlist page / history / liked)? -> Navigate to previous / Library
  if (state.route?.name === 'playlist') {
    navigate('/library');
    return;
  }

  // 6. Top-level tab other than home with no history? -> Return to Home
  if (state.route?.name && state.route.name !== 'home' && window.history.length <= 1) {
    navigate('/');
    return;
  }

  // 7. Normal route pop or Home root -> Allow normal browser/app exit behavior!
  renderCurrentRoute();
}
