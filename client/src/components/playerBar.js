import { state } from '../config/config.js';
import { playerBar, miniPlayer, sidebarPlaylists } from '../config/dom.js';
import { escapeHTML, formatTime, getOptimizedArtwork } from '../utils/utils.js';
import { getSongById } from '../core/details.js';
import { renderFullscreenPlayer } from './fullscreen.js';
import { renderQueuePanel } from './queuePanel.js';
import { updateWavyProgress } from './wavyProgress.js';

export function renderPlayerBar(force = false) {
  if (!playerBar) return;
  if (!state.currentSong) {
    playerBar.innerHTML = `
       <div class="player-bar-left">
         <div class="song-cover-sm" style="background:var(--elevated);"></div>
         <div class="player-bar-info"><div class="player-bar-title" style="color:var(--muted);">Not Playing</div></div>
       </div>
       <div class="player-bar-center"></div>
       <div class="player-bar-right"></div>
     `;
    delete playerBar.dataset.renderedTrackId;
    return;
  }

  const song = state.currentSong;
  if (!force && playerBar.dataset.renderedTrackId === String(song.id) && playerBar.querySelector('.player-bar-title')) {
    return;
  }
  playerBar.dataset.renderedTrackId = String(song.id);

  const isFav = state.favorites.some((item) => item.id === song.id);
  playerBar.innerHTML = `
     <div class="player-bar-left">
       <img class="player-bar-cover" src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 160))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
       <div class="player-bar-info">
         <div class="player-bar-title">${escapeHTML(song.title)}</div>
         <div style="display:flex; align-items:center; gap:4px;">
           <div class="player-bar-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
           <span class="player-quality-badge">HQ Audio</span>
         </div>
       </div>
       <button class="player-bar-like ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Favorite">
         <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
       </button>
     </div>

     <div class="player-bar-center">
       <div class="player-controls">
         <button class="control-btn ${state.shuffleMode ? 'shuffle-active' : ''}" data-action="toggle-shuffle" type="button" aria-label="Shuffle"><i class="fa-solid fa-shuffle"></i></button>
         <button class="control-btn" data-action="prev-track" type="button" aria-label="Previous"><i class="fa-solid fa-backward-step"></i></button>
         <button class="control-btn main" data-action="toggle-play" type="button" aria-label="Play/Pause">
           ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
         </button>
         <button class="control-btn" data-action="next-track" type="button" aria-label="Next"><i class="fa-solid fa-forward-step"></i></button>
         <button class="control-btn ${state.repeatMode !== 'none' ? 'repeat-active' : ''}" data-action="toggle-repeat" type="button" aria-label="Repeat">
           <i class="${state.repeatMode === 'one' ? 'fa-solid fa-1' : 'fa-solid fa-repeat'}"></i>
         </button>
       </div>
       <div class="progress-row">
         <span class="time-label" id="time-current">${formatTime(state.progress)}</span>
         <input id="seekbar" class="seekbar" type="range" min="0" max="${Math.max(1, Math.floor(state.duration || song.durationSec || 1))}" value="${Math.floor(state.progress || 0)}" />
         <span class="time-label" id="time-total">${formatTime(state.duration || song.durationSec || 0)}</span>
       </div>
     </div>

     <div class="player-bar-right">
       <button class="control-btn ${state.videoVisible ? 'active' : ''}" data-action="toggle-video" type="button" aria-label="Toggle Video Mode" title="Watch Video"><i class="fa-solid fa-tv"></i></button>
       <button class="control-btn" data-action="open-queue" type="button" aria-label="Queue"><i class="fa-solid fa-list-ul"></i></button>
       <button class="control-btn" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Add to playlist"><i class="fa-solid fa-plus"></i></button>
       <button class="control-btn" data-action="open-song-details" type="button" aria-label="Details"><i class="fa-solid fa-circle-info"></i></button>
       <i class="fa-solid fa-volume-high" style="color:var(--muted); font-size:0.875rem;"></i>
       <input id="volume-slider" class="volume-slider" type="range" min="0" max="100" value="${Math.round(state.volume * 100)}" />
     </div>
   `;
}

export function renderMiniPlayer(force = false) {
  if (!miniPlayer) return;
  document.body.classList.toggle('has-active-track', !!state.currentSong);
  if (!state.currentSong) {
    miniPlayer.innerHTML = '';
    miniPlayer.classList.add('hidden');
    delete miniPlayer.dataset.renderedTrackId;
    return;
  }

  miniPlayer.classList.remove('hidden');
  const song = state.currentSong;
  if (!force && miniPlayer.dataset.renderedTrackId === String(song.id) && miniPlayer.querySelector('.mini-player-title')) {
    return;
  }
  miniPlayer.dataset.renderedTrackId = String(song.id);

  const isFav = state.favorites.some((item) => item.id === song.id);
  const progressPercent =
    state.duration > 0 ? (state.progress / state.duration) * 100 : 0;

  miniPlayer.innerHTML = `
     <div class="mini-player-inner">
       <div class="mini-player-main" data-action="open-fullscreen-player">
         <img class="mini-player-cover" src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 160))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
         <div class="mini-player-info">
           <div class="mini-player-title">${escapeHTML(song.title)}</div>
           <div class="mini-player-artist">${escapeHTML(song.artist)}</div>
         </div>
       </div>
       <div class="mini-player-btns">
         <button class="mini-player-btn" data-action="open-queue" type="button" aria-label="Queue">
           <i class="fa-solid fa-list-ul"></i>
         </button>
         <button class="mini-player-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Favorite" style="color: ${isFav ? 'var(--green)' : 'var(--muted)'};">
           <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
         </button>
         <button class="mini-player-btn" data-action="toggle-play" type="button" aria-label="Play/Pause">
           ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
         </button>
       </div>
     </div>
     <div class="mini-progress">
       <div class="mini-progress-fill" style="width: ${progressPercent}%;"></div>
     </div>
   `;
}

export function renderSidebarPlaylists() {
  if (!sidebarPlaylists) return;
  const historyCover = getSongById(state.recentlyPlayed[0])?.coverUrl || '';
  const isHistoryActive =
    state.route.name === 'playlist' && state.route.playlistId === 'history';
  const historyItem = `
     <button class="sidebar-playlist-item ${isHistoryActive ? 'active' : ''}" data-route="/playlist/history" type="button">
       ${
         historyCover
           ? `<img class="sidebar-playlist-thumb" src="${escapeHTML(getOptimizedArtwork(historyCover, 80))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />`
           : `<div class="sidebar-playlist-thumb empty"><i class="fa-solid fa-clock-rotate-left"></i></div>`
       }
       <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">Listening History</span>
     </button>
   `;

  const userPlaylists = state.playlists
    .map((playlist) => {
      const isActive =
        state.route.name === 'playlist' &&
        state.route.playlistId === playlist.id;
      const cover = playlist.songs[0]?.coverUrl || '';
      return `
       <button class="sidebar-playlist-item ${isActive ? 'active' : ''}" data-route="/playlist/${encodeURIComponent(playlist.id)}" type="button">
         ${
           cover
             ? `<img class="sidebar-playlist-thumb" src="${escapeHTML(getOptimizedArtwork(cover, 80))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />`
             : `<div class="sidebar-playlist-thumb empty"><i class="fa-solid fa-music"></i></div>`
         }
         <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(playlist.name)}</span>
       </button>
     `;
    })
    .join('');

  sidebarPlaylists.innerHTML = historyItem + userPlaylists;
}

let isInitialNav = true;

export function markActiveNav(targetRoute = null, skipTransition = false) {
  let routeName = state.route?.name || 'home';
  if (targetRoute) {
    if (targetRoute === '/' || targetRoute === '') routeName = 'home';
    else if (targetRoute.startsWith('/search')) routeName = 'search';
    else if (
      targetRoute.startsWith('/library') ||
      targetRoute.startsWith('/playlist') ||
      targetRoute.startsWith('/album') ||
      targetRoute.startsWith('/artist')
    ) {
      routeName = 'library';
    } else if (targetRoute.startsWith('/you') || targetRoute.startsWith('/settings')) {
      routeName = 'you';
    }
  }

  let activeIndex = 0;
  if (routeName === 'home') activeIndex = 0;
  else if (routeName === 'search') activeIndex = 1;
  else if (
    routeName === 'library' ||
    routeName === 'playlist' ||
    routeName === 'album' ||
    routeName === 'artist'
  ) {
    activeIndex = 2;
  } else if (routeName === 'you' || routeName === 'settings') {
    activeIndex = 3;
  }

  const shouldSkip = skipTransition || isInitialNav;
  if (isInitialNav) {
    isInitialNav = false;
  }

  // 1. Mobile Bottom Nav Indicator
  const mobileNav = document.querySelector('.mobile-nav');
  if (mobileNav) {
    let indicator = mobileNav.querySelector('.mobile-nav-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'mobile-nav-indicator';
      indicator.id = 'mobile-nav-indicator';
      mobileNav.prepend(indicator);
    }
    if (shouldSkip) {
      indicator.style.transition = 'none';
    }
    mobileNav.style.setProperty('--active-tab-index', String(activeIndex));
    if (shouldSkip) {
      void indicator.offsetWidth;
      indicator.style.transition = '';
    }
  }

  // 2. Desktop Sidebar Nav Indicator
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav) {
    let sidebarIndicator = sidebarNav.querySelector('.sidebar-nav-indicator');
    if (!sidebarIndicator) {
      sidebarIndicator = document.createElement('div');
      sidebarIndicator.className = 'sidebar-nav-indicator';
      sidebarIndicator.id = 'sidebar-nav-indicator';
      sidebarNav.prepend(sidebarIndicator);
    }
    if (shouldSkip) {
      sidebarIndicator.style.transition = 'none';
    }
    sidebarNav.style.setProperty('--active-tab-index', String(activeIndex));
    if (shouldSkip) {
      void sidebarIndicator.offsetWidth;
      sidebarIndicator.style.transition = '';
    }
  }

  // 3. Update active classes on nav links
  document.querySelectorAll('.nav-link').forEach((btn) => {
    const route = btn.dataset.route;
    const active =
      (route === '/' && routeName === 'home') ||
      (route === '/search' && routeName === 'search') ||
      (route === '/library' &&
        (routeName === 'library' ||
          routeName === 'playlist' ||
          routeName === 'album' ||
          routeName === 'artist')) ||
      (route === '/you' &&
        (routeName === 'you' || routeName === 'settings'));
    btn.classList.toggle('active', !!active);
  });

  // 4. Update active classes on mobile nav items
  document.querySelectorAll('.mobile-nav-item').forEach((btn) => {
    const route = btn.dataset.route;
    const active =
      (route === '/' && routeName === 'home') ||
      (route === '/search' && routeName === 'search') ||
      (route === '/library' &&
        (routeName === 'library' ||
          routeName === 'playlist' ||
          routeName === 'album' ||
          routeName === 'artist')) ||
      (route === '/you' &&
        (routeName === 'you' || routeName === 'settings'));
    btn.classList.toggle('active', !!active);
  });
}

export function refreshPlaybackUI() {
  const isSeeking = !!state.isSeeking;

  if (!isSeeking) {
    const seek = document.getElementById('seekbar');
    if (seek) {
      const maxVal = Math.max(
        1,
        Math.floor(state.duration || state.currentSong?.durationSec || 1)
      );
      seek.max = String(maxVal);
      seek.value = String(Math.floor(state.progress || 0));
      const pct =
        maxVal > 0 ? (Math.floor(state.progress || 0) / maxVal) * 100 : 0;
      seek.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${pct}%, rgba(255,255,255,0.15) ${pct}%)`;
    }
    const fsSeek = document.getElementById('fs-seekbar');
    if (fsSeek) {
      const fsMax = Math.max(
        1,
        Math.floor(state.duration || state.currentSong?.durationSec || 1)
      );
      fsSeek.max = String(fsMax);
      fsSeek.value = String(Math.floor(state.progress || 0));
      const fsPct =
        fsMax > 0 ? (Math.floor(state.progress || 0) / fsMax) * 100 : 0;
      fsSeek.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${fsPct}%, rgba(255,255,255,0.15) ${fsPct}%)`;
    }

    const currentLabel = document.getElementById('time-current');
    if (currentLabel) currentLabel.textContent = formatTime(state.progress);
    const fsCurrentLabel = document.getElementById('fs-time-current');
    if (fsCurrentLabel) fsCurrentLabel.textContent = formatTime(state.progress);
  }
  
  const miniFill = document.querySelector('.mini-progress-fill');
  if (miniFill) {
    const maxVal = Math.max(1, Math.floor(state.duration || state.currentSong?.durationSec || 1));
    const pct = maxVal > 0 ? (Math.floor(state.progress || 0) / maxVal) * 100 : 0;
    miniFill.style.width = `${pct}%`;
  }

  const totalLabel = document.getElementById('time-total');
  const durSec = state.duration || state.currentSong?.durationSec || 0;
  if (totalLabel) totalLabel.textContent = formatTime(durSec);
  const fsTotalLabel = document.getElementById('fs-time-total');
  if (fsTotalLabel) fsTotalLabel.textContent = formatTime(durSec);

  const playToggles = document.querySelectorAll('[data-action="toggle-play"]');
  playToggles.forEach((playToggle) => {
    if (playToggle && playToggle.querySelector('i')) {
      if (state.isLoading) {
        playToggle.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
      } else {
        playToggle.innerHTML = state.isPlaying
          ? '<i class="fa-solid fa-pause"></i>'
          : '<i class="fa-solid fa-play"></i>';
      }
    }
  });

  const volumeSlider = document.getElementById('volume-slider');
  if (volumeSlider && document.activeElement !== volumeSlider) {
    volumeSlider.value = String(Math.round(state.volume * 100));
    const volPct = Math.round(state.volume * 100);
    volumeSlider.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;
  }
  const fsVol = document.getElementById('fs-volume-slider');
  if (fsVol && document.activeElement !== fsVol) {
    fsVol.value = String(Math.round(state.volume * 100));
    const volPct = Math.round(state.volume * 100);
    fsVol.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;
  }

  // Ensure active-track class is kept in sync on document body
  document.body.classList.toggle('has-active-track', !!state.currentSong);

  // Sync repeat & shuffle icons across controls
  const repeatIconClass = state.repeatMode === 'one' ? 'fa-solid fa-1' : 'fa-solid fa-repeat';
  document.querySelectorAll('[data-action="toggle-repeat"]').forEach((btn) => {
    btn.classList.toggle('repeat-active', state.repeatMode !== 'none');
    btn.classList.toggle('active', state.repeatMode !== 'none');
    const icon = btn.querySelector('i');
    if (icon) icon.className = repeatIconClass;
  });

  document.querySelectorAll('[data-action="toggle-shuffle"]').forEach((btn) => {
    btn.classList.toggle('shuffle-active', !!state.shuffleMode);
    btn.classList.toggle('active', !!state.shuffleMode);
  });

  // Sync favorites
  const isFav = state.favorites.some((item) => item.id === state.currentSong?.id);
  document.querySelectorAll('[data-action="toggle-favorite"]').forEach((btn) => {
    btn.classList.toggle('active', isFav);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    }
  });

  // Re-render components only if their rendered track ID differs from current state
  renderPlayerBar(false);
  renderMiniPlayer(false);
  if (state.fullscreenPlayer) {
    renderFullscreenPlayer(false);
    updateWavyProgress();
  }
}
