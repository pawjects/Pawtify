import { state, showToast } from '../config/config.js';
import { escapeHTML, getOptimizedArtwork } from '../utils/utils.js';
import { getSongById, shareSpecificSong, rememberSongs } from '../core/details.js';
import {
  toggleFavorite,
  addToQueue,
  playNext,
  removeFromPlaylist,
} from './player.js';
import { openModal } from '../core/navigationHistory.js';
import { openArtistProfile } from './artistProfile.js';
import { renderCurrentRoute } from './master.js';
import { renderPlayerBar, renderSidebarPlaylists } from './playerBar.js';
import { renderQueuePanel } from './queuePanel.js';

let activeMenuSongId = null;
let activeTriggerBtn = null;
let isMenuInitialized = false;

function ensureMenuElement() {
  let menu = document.getElementById('track-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'track-menu';
    menu.className = 'track-menu-popup';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-hidden', 'true');
    document.body.appendChild(menu);
  }

  if (!isMenuInitialized) {
    isMenuInitialized = true;

    // Delegate menu item actions
    menu.addEventListener('click', async (e) => {
      const item = e.target.closest('.track-menu-item');
      if (!item) return;

      e.stopPropagation();
      const action = item.dataset.action;
      const songId = item.dataset.songId || activeMenuSongId;
      const song =
        getSongById(songId) ||
        (state.currentSong?.id === songId ? state.currentSong : null);

      if (action === 'track-menu-fav' && song) {
        toggleFavorite(song);
        renderPlayerBar();
        renderSidebarPlaylists();
        renderCurrentRoute();
      } else if (action === 'track-menu-play-next' && song) {
        playNext(song);
        renderQueuePanel();
        showToast(`"${song.title}" will play next`);
      } else if (action === 'track-menu-add-queue' && song) {
        addToQueue(song);
        renderQueuePanel();
        showToast(`Added "${song.title}" to queue`);
      } else if (action === 'track-menu-add-playlist' && song) {
        closeTrackMenu();
        openModal({ type: 'playlistPicker', songId: song.id });
        return;
      } else if (action === 'track-menu-view-artist') {
        const artist = item.dataset.artist || song?.artist;
        closeTrackMenu();
        if (artist) openArtistProfile(artist);
        return;
      } else if (action === 'track-menu-share' && songId) {
        closeTrackMenu();
        await shareSpecificSong(songId);
        return;
      } else if (action === 'track-menu-remove-from-playlist' && songId) {
        const playlistId = item.dataset.playlistId;
        if (playlistId) {
          removeFromPlaylist(songId, playlistId);
          renderCurrentRoute();
          showToast('Removed from playlist');
        }
      }

      closeTrackMenu();
    });

    // Dismiss on click outside
    document.addEventListener('click', (e) => {
      const currentMenu = document.getElementById('track-menu');
      if (currentMenu && currentMenu.classList.contains('active')) {
        if (
          !currentMenu.contains(e.target) &&
          (!activeTriggerBtn || !activeTriggerBtn.contains(e.target))
        ) {
          closeTrackMenu();
        }
      }
    });

    // Dismiss on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeTrackMenu();
      }
    });

    // Reposition or dismiss on resize/scroll
    window.addEventListener(
      'resize',
      () => {
        const currentMenu = document.getElementById('track-menu');
        if (
          currentMenu &&
          currentMenu.classList.contains('active') &&
          activeTriggerBtn
        ) {
          positionTrackMenu(activeTriggerBtn, currentMenu);
        }
      },
      { passive: true }
    );

    window.addEventListener(
      'scroll',
      () => {
        const currentMenu = document.getElementById('track-menu');
        if (currentMenu && currentMenu.classList.contains('active')) {
          closeTrackMenu();
        }
      },
      { passive: true, capture: true }
    );
  }

  return menu;
}

export function openTrackMenu(songId, playlistId, triggerBtn) {
  const menu = ensureMenuElement();

  // Toggle off if clicking the currently open trigger
  if (
    menu.classList.contains('active') &&
    activeMenuSongId === songId &&
    activeTriggerBtn === triggerBtn
  ) {
    closeTrackMenu();
    return;
  }

  let song =
    getSongById(songId) ||
    (state.currentSong?.id === songId ? state.currentSong : null);

  if (!song && state.queue?.length) {
    song = state.queue.find((s) => s.id === songId);
  }
  if (!song && state.favorites?.length) {
    song = state.favorites.find((s) => s.id === songId);
  }
  if (!song && state.searchResults?.songs?.length) {
    song = state.searchResults.songs.find((s) => s.id === songId);
  }
  if (!song && state.recommendedSongs?.length) {
    song = state.recommendedSongs.find((s) => s.id === songId);
  }
  if (!song && state.trendingSongs?.length) {
    song = state.trendingSongs.find((s) => s.id === songId);
  }
  if (!song && triggerBtn) {
    const row = triggerBtn.closest('.song-row, .queue-item');
    if (row) {
      const titleEl = row.querySelector('.song-title, .queue-item-title');
      const artistEl = row.querySelector('.song-artist, .queue-item-artist');
      const imgEl = row.querySelector('img');
      song = {
        id: songId,
        title: titleEl?.textContent?.trim() || 'Track',
        artist: artistEl?.textContent?.trim() || 'Unknown Artist',
        coverUrl: imgEl?.src || '/assets/pawtify.png',
        duration: row.querySelector('.song-duration')?.textContent?.trim() || '0:00',
      };
      rememberSongs([song]);
    }
  }
  if (!song) return;

  if (activeTriggerBtn) {
    activeTriggerBtn.classList.remove('active');
  }

  activeMenuSongId = songId;
  activeTriggerBtn = triggerBtn;
  if (triggerBtn) {
    triggerBtn.classList.add('active');
    triggerBtn.setAttribute('aria-expanded', 'true');
  }

  const isFav = state.favorites.some((item) => item.id === song.id);
  const isCustomUserPlaylist =
    playlistId && (state.playlists || []).some((p) => p.id === playlistId);

  menu.innerHTML = `
    <div class="track-menu-header">
      <img src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 100))}" class="track-menu-thumb" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
      <div class="track-menu-meta">
        <div class="track-menu-title">${escapeHTML(song.title)}</div>
        <div class="track-menu-artist">${escapeHTML(song.artist)}</div>
      </div>
    </div>
    <div class="track-menu-divider"></div>
    <div class="track-menu-list">
      <button class="track-menu-item" data-action="track-menu-fav" data-song-id="${escapeHTML(song.id)}" type="button" role="menuitem">
        <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}" style="${isFav ? 'color:var(--md-sys-color-primary);' : ''}"></i>
        <span>${isFav ? 'Remove from Liked' : 'Save to Liked Songs'}</span>
      </button>
      <button class="track-menu-item" data-action="track-menu-play-next" data-song-id="${escapeHTML(song.id)}" type="button" role="menuitem">
        <i class="fa-solid fa-forward-step"></i>
        <span>Play Next</span>
      </button>
      <button class="track-menu-item" data-action="track-menu-add-queue" data-song-id="${escapeHTML(song.id)}" type="button" role="menuitem">
        <i class="fa-solid fa-list-ul"></i>
        <span>Add to Queue</span>
      </button>
      <button class="track-menu-item" data-action="track-menu-add-playlist" data-song-id="${escapeHTML(song.id)}" type="button" role="menuitem">
        <i class="fa-solid fa-plus"></i>
        <span>Add to Playlist</span>
      </button>
      <button class="track-menu-item" data-action="track-menu-view-artist" data-artist="${escapeHTML(song.artist)}" type="button" role="menuitem">
        <i class="fa-solid fa-user"></i>
        <span>View Artist</span>
      </button>
      <button class="track-menu-item" data-action="track-menu-share" data-song-id="${escapeHTML(song.id)}" type="button" role="menuitem">
        <i class="fa-solid fa-share-nodes"></i>
        <span>Share Track</span>
      </button>
      ${
        isCustomUserPlaylist
          ? `
        <div class="track-menu-divider"></div>
        <button class="track-menu-item track-menu-item-danger" data-action="track-menu-remove-from-playlist" data-song-id="${escapeHTML(song.id)}" data-playlist-id="${escapeHTML(playlistId)}" type="button" role="menuitem">
          <i class="fa-solid fa-trash"></i>
          <span>Remove from Playlist</span>
        </button>
      `
          : ''
      }
    </div>
  `;

  menu.style.display = 'flex';
  menu.classList.add('active');
  menu.setAttribute('aria-hidden', 'false');

  positionTrackMenu(triggerBtn, menu);
}

export function positionTrackMenu(triggerBtn, menu) {
  if (!triggerBtn || !menu) return;

  const rect = triggerBtn.getBoundingClientRect();
  const padding = 12;
  const menuWidth = Math.min(240, window.innerWidth - padding * 2);
  menu.style.width = `${menuWidth}px`;
  menu.style.zIndex = '300';

  const menuHeight = menu.offsetHeight || 280;

  // Horizontal position: align menu right edge to trigger right edge
  let left = rect.right - menuWidth;
  if (left < padding) left = padding;
  if (left + menuWidth > window.innerWidth - padding) {
    left = window.innerWidth - menuWidth - padding;
  }

  // Vertical position: place below button, flip above if limited viewport space below
  let top = rect.bottom + 6;
  if (top + menuHeight > window.innerHeight - padding) {
    const flippedTop = rect.top - menuHeight - 6;
    if (flippedTop >= padding) {
      top = flippedTop;
    } else {
      top = Math.max(padding, window.innerHeight - menuHeight - padding);
    }
  }

  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

export function closeTrackMenu() {
  const menu = document.getElementById('track-menu');
  if (menu && menu.classList.contains('active')) {
    menu.classList.remove('active');
    menu.style.display = 'none';
    menu.setAttribute('aria-hidden', 'true');
  }
  if (activeTriggerBtn) {
    activeTriggerBtn.classList.remove('active');
    activeTriggerBtn.setAttribute('aria-expanded', 'false');
    activeTriggerBtn = null;
  }
  activeMenuSongId = null;
}
