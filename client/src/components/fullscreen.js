import { state, STORAGE, showToast } from '../config/config.js';
import { fullscreenPlayer } from '../config/dom.js';
import { escapeHTML, formatTime, saveJSON } from '../utils/utils.js';
import { renderCurrentRoute } from './master.js';
import { play } from './player.js';

export function renderFullscreenPlayer() {
  if (!fullscreenPlayer) return;
  if (!state.currentSong || !state.fullscreenPlayer) {
    fullscreenPlayer.classList.remove('active');
    fullscreenPlayer.innerHTML = '';
    return;
  }
  fullscreenPlayer.classList.add('active');
  const song = state.currentSong;
  const isFav = state.favorites.some((item) => item.id === song.id);
  const fsMax = Math.max(
    1,
    Math.floor(state.duration || song.durationSec || 1)
  );
  const fsPct = fsMax > 0 ? (Math.floor(state.progress || 0) / fsMax) * 100 : 0;
  const volPct = Math.round(state.volume * 100);
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
         <span class="fs-quality-badge">HQ Audio</span>
       </div>
       <div class="fs-body">
         <div class="fs-cover-wrap">
           <img class="fs-cover" src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" />
         </div>
         <div class="fs-info">
           <div class="fs-text">
             <div class="fs-title">${escapeHTML(song.title)}</div>
             <div class="fs-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
           </div>
           <button class="fs-heart ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button">
             <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
           </button>
         </div>
         <div class="fs-progress">
           <input id="fs-seekbar" class="fs-seekbar" type="range" min="0" max="${fsMax}" value="${Math.floor(state.progress || 0)}" style="background: linear-gradient(90deg, var(--green) 0%, var(--green-hover) ${fsPct}%, rgba(255,255,255,0.15) ${fsPct}%)" />
           <div class="fs-time">
             <span>${formatTime(state.progress)}</span>
             <span>${formatTime(state.duration || song.durationSec || 0)}</span>
           </div>
         </div>
         <div class="fs-extra-controls">
           <button class="fs-extra-btn ${state.videoVisible ? 'active' : ''}" data-action="toggle-video" type="button" aria-label="Toggle Video" title="Watch Video"><i class="fa-solid fa-tv"></i></button>
           <button class="fs-extra-btn ${shuffleActive}" data-action="toggle-shuffle" type="button" aria-label="Shuffle"><i class="fa-solid fa-shuffle"></i></button>
           <button class="fs-extra-btn ${repeatActive}" data-action="toggle-repeat" type="button" aria-label="Repeat"><i class="${repeatIcon}"></i></button>
           <button class="fs-extra-btn" data-action="open-queue" type="button" aria-label="Queue"><i class="fa-solid fa-list-ul"></i></button>
           <button class="fs-extra-btn" data-action="open-lyrics" type="button" aria-label="Lyrics"><i class="fa-solid fa-align-center"></i></button>
           <button class="fs-extra-btn" data-action="download-song" type="button" aria-label="Download"><i class="fa-solid fa-download"></i></button>
         </div>
         <div class="fs-controls">
           <button class="fs-btn" data-action="prev-track" type="button" aria-label="Previous"><i class="fa-solid fa-backward-step"></i></button>
           <button class="fs-btn fs-play" data-action="toggle-play" type="button" aria-label="Play/Pause">
             ${state.isPlaying ? '<i class="fa-solid fa-pause"></i>' : '<i class="fa-solid fa-play"></i>'}
           </button>
           <button class="fs-btn" data-action="next-track" type="button" aria-label="Next"><i class="fa-solid fa-forward-step"></i></button>
         </div>
         <div class="fs-actions">
           <button data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Add to playlist"><i class="fa-solid fa-plus"></i></button>
           <button data-action="open-song-details" type="button" aria-label="Details"><i class="fa-solid fa-circle-info"></i></button>
           <button data-action="share-song" type="button" aria-label="Share"><i class="fa-solid fa-share-nodes"></i></button>
         </div>
       </div>
     </div>
   `;
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
