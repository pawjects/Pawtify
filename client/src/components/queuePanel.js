import { state, STORAGE } from '../config/config.js';
import { queuePanel, miniPlayer } from '../config/dom.js';
import { escapeHTML, saveJSON } from '../utils/utils.js';
import { renderPlayerBar } from './playerBar.js';
import { previousTrack, nextTrack } from './player.js';
import { renderFullscreenPlayer } from './fullscreen.js';

export function renderQueuePanel() {
  if (!queuePanel) return;
  if (!state.queuePanel) {
    queuePanel.classList.remove('active');
    queuePanel.innerHTML = '';
    return;
  }
  queuePanel.classList.add('active');
  const queue = state.queue;
  const currentIdx = state.currentSongIndex;

  const nowPlaying =
    currentIdx >= 0 && currentIdx < queue.length ? queue[currentIdx] : null;
  const upcoming = queue.slice(currentIdx + 1);
  const previous = queue.slice(0, currentIdx);

  queuePanel.innerHTML = `
     <div class="queue-header">
       <h2><i class="fa-solid fa-list-ul" style="margin-right:8px; color:var(--green);"></i>Queue</h2>
       <div class="queue-header-actions">
         <button class="queue-clear-btn" data-action="clear-queue" type="button">Clear</button>
         <button class="queue-close-btn" data-action="close-queue" type="button" aria-label="Close">
           <i class="fa-solid fa-xmark"></i>
         </button>
       </div>
     </div>
     <div class="queue-list">
       ${!queue.length ? '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>Queue is empty</h2><p>Add songs to start listening.</p></div>' : ''}

       ${
         nowPlaying
           ? `
         <div class="queue-section-title">Now Playing</div>
         <div class="queue-item active" data-action="play-song" data-song-id="${escapeHTML(nowPlaying.id)}" data-source="queue" type="button">
           <div class="queue-item-index"><i class="fa-solid fa-volume-high" style="font-size:0.75rem;"></i></div>
           <img class="queue-item-cover" src="${escapeHTML(nowPlaying.coverUrl)}" alt="" />
           <div class="queue-item-info">
             <div class="queue-item-title">${escapeHTML(nowPlaying.title)}</div>
             <div class="queue-item-artist">${escapeHTML(nowPlaying.artist)}</div>
           </div>
         </div>
       `
           : ''
       }

       ${
         upcoming.length
           ? `
         <div class="queue-section-title">Next Up</div>
         ${upcoming
           .map(
             (s, i) => `
           <div class="queue-item" data-action="play-song" data-song-id="${escapeHTML(s?.id || '')}" data-source="queue" type="button">
             <div class="queue-item-index">${currentIdx + i + 2}</div>
             <img class="queue-item-cover" src="${escapeHTML(s?.coverUrl || '')}" alt="" />
             <div class="queue-item-info">
               <div class="queue-item-title">${escapeHTML(s?.title || '')}</div>
               <div class="queue-item-artist">${escapeHTML(s?.artist || '')}</div>
             </div>
             <button class="queue-item-remove" data-action="remove-from-queue" data-song-id="${escapeHTML(s?.id || '')}" type="button" onclick="event.stopPropagation();" aria-label="Remove">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </div>
         `
           )
           .join('')}
       `
           : ''
       }

       ${
         previous.length
           ? `
         <div class="queue-section-title">Previous</div>
         ${previous
           .map(
             (s, i) => `
           <div class="queue-item" data-action="play-song" data-song-id="${escapeHTML(s?.id || '')}" data-source="queue" type="button">
             <div class="queue-item-index">${i + 1}</div>
             <img class="queue-item-cover" src="${escapeHTML(s?.coverUrl || '')}" alt="" />
             <div class="queue-item-info">
               <div class="queue-item-title">${escapeHTML(s?.title || '')}</div>
               <div class="queue-item-artist">${escapeHTML(s?.artist || '')}</div>
             </div>
           </div>
         `
           )
           .join('')}
       `
           : ''
       }
     </div>
   `;
}

export function removeFromQueue(songId) {
  const idx = state.queue.findIndex((s) => s.id === songId);
  if (idx === -1) return;
  if (idx < state.currentSongIndex) state.currentSongIndex--;
  else if (idx === state.currentSongIndex) return;
  state.queue = state.queue.filter((s) => s.id !== songId);
  saveJSON(STORAGE.QUEUE, state.queue);
  renderQueuePanel();
  renderPlayerBar();
}

export function clearQueue() {
  if (!state.currentSong) state.queue = [];
  else {
    state.queue = [state.currentSong];
    state.currentSongIndex = 0;
  }
  saveJSON(STORAGE.QUEUE, state.queue);
  renderQueuePanel();
  renderPlayerBar();
}

// Mobile mini-player swipe gestures
export let miniPlayerTouchStartX = 0;
export let miniPlayerTouchStartY = 0;
export const SWIPE_THRESHOLD = 50;

if (miniPlayer) {
  miniPlayer.addEventListener(
    'touchstart',
    (e) => {
      miniPlayerTouchStartX = e.changedTouches[0].screenX;
      miniPlayerTouchStartY = e.changedTouches[0].screenY;
    },
    { passive: true }
  );
  miniPlayer.addEventListener(
    'touchend',
    (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - miniPlayerTouchStartX;
      const diffY = touchEndY - miniPlayerTouchStartY;
      // Ignore short swipes
      if (
        Math.abs(diffX) < SWIPE_THRESHOLD &&
        Math.abs(diffY) < SWIPE_THRESHOLD
      ) {
        return;
      }
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX > 0) {
          previousTrack();
        } else {
          nextTrack();
        }
      } else {
        if (diffY < 0) {
          state.fullscreenPlayer = true;
          renderFullscreenPlayer();
        }
      }
    },
    { passive: true }
  );
}
