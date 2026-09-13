import { state } from '../config/config.js';
import { playerBar, miniPlayer, sidebarPlaylists } from '../config/dom.js';
import { escapeHTML, formatTime } from '../utils/utils.js';
import { getSongById } from '../core/details.js';
import { renderFullscreenPlayer } from './fullscreen.js';
import { renderQueuePanel } from './queuePanel.js';

export function renderPlayerBar() {
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
    return;
  }

  const song = state.currentSong;
  const isFav = state.favorites.some((item) => item.id === song.id);
  playerBar.innerHTML = `
     <div class="player-bar-left">
       <img class="player-bar-cover" src="${escapeHTML(song.coverUrl)}" alt="" />
       <div class="player-bar-info">
         <div class="player-bar-title">${escapeHTML(song.title)}</div>
         <div style="display:flex; align-items:center; gap:4px;">
           <div class="player-bar-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
           <span class="player-quality-badge">HQ Audio</span>
         </div>
       </div>
       <button class="player-bar-like ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button">
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

export function renderMiniPlayer() {
  if (!miniPlayer) return;
  if (!state.currentSong) {
    miniPlayer.innerHTML = '';
    miniPlayer.classList.add('hidden');
    return;
  }

  miniPlayer.classList.remove('hidden');
  const song = state.currentSong;
  const isFav = state.favorites.some((item) => item.id === song.id);
  const progressPercent =
    state.duration > 0 ? (state.progress / state.duration) * 100 : 0;

  miniPlayer.innerHTML = `
     <div class="mini-player-inner">
       <div class="mini-player-main" data-action="open-fullscreen-player">
         <img class="mini-player-cover" src="${escapeHTML(song.coverUrl)}" alt="" />
         <div class="mini-player-info">
           <div class="mini-player-title">${escapeHTML(song.title)}</div>
           <div class="mini-player-artist">${escapeHTML(song.artist)}</div>
         </div>
       </div>
       <div class="mini-player-btns">
         <button class="mini-player-btn" data-action="open-queue" type="button" aria-label="Queue">
           <i class="fa-solid fa-list-ul"></i>
         </button>
         <button class="mini-player-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" style="color: ${isFav ? 'var(--green)' : 'var(--muted)'};">
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
           ? `<img class="sidebar-playlist-thumb" src="${escapeHTML(historyCover)}" alt="" />`
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
             ? `<img class="sidebar-playlist-thumb" src="${escapeHTML(cover)}" alt="" />`
             : `<div class="sidebar-playlist-thumb empty"><i class="fa-solid fa-music"></i></div>`
         }
         <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(playlist.name)}</span>
       </button>
     `;
    })
    .join('');

  sidebarPlaylists.innerHTML = historyItem + userPlaylists;
}

export function markActiveNav() {
  document.querySelectorAll('.nav-link').forEach((btn) => {
    const route = btn.dataset.route;
    const active =
      (route === '/' && state.route.name === 'home') ||
      (route === '/search' && state.route.name === 'search') ||
      (route === '/library' &&
        (state.route.name === 'library' || state.route.name === 'playlist'));
    if (active) btn.classList.add('active');
    else btn.classList.remove('active');
  });
  document.querySelectorAll('.mobile-nav-item').forEach((btn) => {
    const route = btn.dataset.route;
    const active =
      (route === '/' && state.route.name === 'home') ||
      (route === '/search' && state.route.name === 'search') ||
      (route === '/library' &&
        (state.route.name === 'library' || state.route.name === 'playlist'));
    if (active) btn.classList.add('active');
    else btn.classList.remove('active');
  });
}

export function refreshPlaybackUI() {
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
  
  const miniFill = document.querySelector('.mini-progress-fill');
  if (miniFill) {
    const maxVal = Math.max(1, Math.floor(state.duration || state.currentSong?.durationSec || 1));
    const pct = maxVal > 0 ? (Math.floor(state.progress || 0) / maxVal) * 100 : 0;
    miniFill.style.width = `${pct}%`;
  }

  const currentLabel = document.getElementById('time-current');
  if (currentLabel) currentLabel.textContent = formatTime(state.progress);
  const totalLabel = document.getElementById('time-total');
  if (totalLabel)
    totalLabel.textContent = formatTime(
      state.duration || state.currentSong?.durationSec || 0
    );

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
  if (volumeSlider) {
    volumeSlider.value = String(Math.round(state.volume * 100));
    const volPct = Math.round(state.volume * 100);
    volumeSlider.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;
  }
  const fsVol = document.getElementById('fs-volume-slider');
  if (fsVol) {
    fsVol.value = String(Math.round(state.volume * 100));
    const volPct = Math.round(state.volume * 100);
    fsVol.style.background = `linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${volPct}%, rgba(255,255,255,0.15) ${volPct}%)`;
  }

  renderPlayerBar();
  renderMiniPlayer();
  renderFullscreenPlayer();
  renderQueuePanel();
}
