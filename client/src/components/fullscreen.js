import { state, STORAGE, showToast } from '../config/config.js';
import { fullscreenPlayer } from '../config/dom.js';
import { escapeHTML, formatTime, saveJSON, getOptimizedArtwork } from '../utils/utils.js';
import { renderCurrentRoute } from './master.js';
import { play } from './player.js';
import {
  initWavyProgress,
  teardownWavyProgress,
  updateWavyProgress,
} from './wavyProgress.js';

export function renderFullscreenPlayer(force = false) {
  if (!fullscreenPlayer) return;
  if (!state.currentSong || !state.fullscreenPlayer) {
    teardownWavyProgress();
    fullscreenPlayer.classList.remove('active');
    document.body.classList.remove('has-fullscreen-open');
    return;
  }
  fullscreenPlayer.classList.add('active');
  document.body.classList.add('has-fullscreen-open');
  const song = state.currentSong;

  // If already rendered with this song and not forced, avoid wiping DOM
  if (!force && fullscreenPlayer.dataset.renderedTrackId === String(song.id) && fullscreenPlayer.querySelector('.fs-title')) {
    updateWavyProgress();
    return;
  }
  fullscreenPlayer.dataset.renderedTrackId = String(song.id);

  const isFav = state.favorites.some((item) => item.id === song.id);
  const fsMax = Math.max(
    1,
    Math.floor(state.duration || song.durationSec || 1)
  );
  const repeatIcon =
    state.repeatMode === 'one' ? 'fa-solid fa-1' : 'fa-solid fa-repeat';
  const repeatActive = state.repeatMode !== 'none' ? 'active' : '';
  const shuffleActive = state.shuffleMode ? 'active' : '';

  fullscreenPlayer.innerHTML = `
     <div class="fs-backdrop" style="background-image: url('${escapeHTML(song.coverUrl)}')"></div>
     <div class="fs-content">
       <div class="fs-header">
         <button class="fs-close-btn" data-action="close-fullscreen-player" type="button" aria-label="Close">
           <i class="fa-solid fa-chevron-down"></i>
         </button>
         <div class="fs-header-actions" style="display:flex; align-items:center; gap:8px;">
           <button class="fs-extra-btn" data-action="download-song" type="button" aria-label="Download song" title="Download song" style="color: var(--muted);">
             <i class="fa-solid fa-download"></i>
           </button>
           <button class="fs-extra-btn" data-action="open-song-details" type="button" aria-label="Song details" title="Song details" style="color: var(--muted);">
             <i class="fa-solid fa-ellipsis"></i>
           </button>
         </div>
       </div>
       <div class="fs-body">
         <div class="fs-cover-wrap">
           <img class="fs-cover" src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 720))}" alt="${escapeHTML(song.title)}" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
         </div>
         <div class="fs-info">
           <div class="fs-text">
             <div class="fs-title">${escapeHTML(song.title)}</div>
             <div class="fs-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
           </div>
           <button class="fs-heart ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Favorite">
             <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
           </button>
         </div>
         <div class="fs-progress">
           <div class="fs-wave-container" id="fs-wave-container">
             <canvas id="fs-wavy-canvas" class="fs-wavy-canvas"></canvas>
             <input id="fs-seekbar" class="fs-seekbar fs-wave-seekbar" type="range" min="0" max="${fsMax}" step="0.1" value="${state.progress || 0}" aria-label="Playback progress" />
           </div>
           <div class="fs-time">
             <span id="fs-time-current">${formatTime(state.progress)}</span>
             <span id="fs-time-total">${formatTime(state.duration || song.durationSec || 0)}</span>
           </div>
         </div>
         <div class="fs-controls">
           <button class="fs-extra-btn ${shuffleActive}" data-action="toggle-shuffle" type="button" aria-label="Shuffle"><i class="fa-solid fa-shuffle"></i></button>
           <button class="fs-btn" data-action="prev-track" type="button" aria-label="Previous"><i class="fa-solid fa-backward-step"></i></button>
           <button class="fs-btn fs-play" data-action="toggle-play" type="button" aria-label="Play/Pause">
             ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
           </button>
           <button class="fs-btn" data-action="next-track" type="button" aria-label="Next"><i class="fa-solid fa-forward-step"></i></button>
           <button class="fs-extra-btn ${repeatActive}" data-action="toggle-repeat" type="button" aria-label="Repeat"><i class="${repeatIcon}"></i></button>
         </div>
         <div class="fs-actions">
           <button class="fs-action-icon" data-action="open-lyrics" type="button" aria-label="Lyrics" title="Lyrics"><i class="fa-solid fa-align-center"></i></button>
           <button class="fs-action-icon" data-action="open-queue" type="button" aria-label="Queue" title="Queue"><i class="fa-solid fa-list-ul"></i></button>
           <button class="fs-action-icon ${state.videoVisible ? 'active' : ''}" data-action="toggle-video" type="button" aria-label="Toggle Video" title="Video"><i class="fa-solid fa-tv"></i></button>
           <button class="fs-action-icon" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Add to playlist" title="Add to playlist"><i class="fa-solid fa-plus"></i></button>
           <button class="fs-action-icon" data-action="share-song" type="button" aria-label="Share" title="Share"><i class="fa-solid fa-share-nodes"></i></button>
         </div>
       </div>
     </div>
   `;

  const waveContainer = fullscreenPlayer.querySelector('#fs-wave-container');
  if (waveContainer) {
    initWavyProgress(waveContainer);
  }
}

export async function playYTPlaylist(playlistId) {
  state.isLoading = true;
  renderCurrentRoute();
  try {
    const res = await fetch(`/api/search?type=playlist_videos&q=${playlistId}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const firstSong = data.items[0];
      state.queue = data.items;
      saveJSON(STORAGE.QUEUE, state.queue);
      await play(firstSong, data.items, true);
    } else {
      showToast('Playlist is empty or could not be loaded.');
    }
  } catch (e) {
    showToast('Error loading playlist.');
  }
  state.isLoading = false;
  renderCurrentRoute();
}
