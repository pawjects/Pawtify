import { state, STORAGE } from '../config/config.js';
import { queuePanel, miniPlayer } from '../config/dom.js';
import { escapeHTML, saveJSON, getOptimizedArtwork } from '../utils/utils.js';
import { renderPlayerBar } from './playerBar.js';
import { previousTrack, nextTrack, play } from './player.js';
import { renderFullscreenPlayer } from './fullscreen.js';
import { rememberSongs } from '../core/details.js';

let draggedQueueIndex = null;
let touchDragIndex = null;
let touchHoverTarget = null;

export function ensureQueueIds() {
  if (!Array.isArray(state.queue)) return;
  state.queue.forEach((song, idx) => {
    if (song && !song._queueId) {
      song._queueId = `qid_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 8)}`;
    }
  });
}

export function renderQueuePanel() {
  if (!queuePanel) return;
  if (!state.queuePanel) {
    queuePanel.classList.remove('active');
    queuePanel.innerHTML = '';
    return;
  }
  ensureQueueIds();
  queuePanel.classList.add('active');
  const queue = state.queue || [];
  const currentIdx = typeof state.currentSongIndex === 'number' ? state.currentSongIndex : 0;

  const nowPlaying =
    currentIdx >= 0 && currentIdx < queue.length ? queue[currentIdx] : null;
  const upcoming = queue.slice(currentIdx + 1);
  const previous = queue.slice(0, currentIdx);

  if (nowPlaying) rememberSongs([nowPlaying]);
  if (upcoming.length) rememberSongs(upcoming);
  if (previous.length) rememberSongs(previous);

  queuePanel.innerHTML = `
     <div class="queue-header">
       <h2><i class="fa-solid fa-list-ul" style="margin-right:8px; color:var(--md-sys-color-primary);"></i>Queue</h2>
       <div class="queue-header-actions">
         <button class="queue-clear-btn" data-action="clear-queue" type="button">Clear</button>
         <button class="queue-close-btn" data-action="close-queue" type="button" aria-label="Close queue">
           <i class="fa-solid fa-xmark"></i>
         </button>
       </div>
     </div>
     <div class="queue-list" id="queue-list-container">
       ${!queue.length ? '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>Queue is empty</h2><p>Add songs to start listening.</p></div>' : ''}

       ${
         nowPlaying
           ? `
         <div class="queue-section-title">Now Playing</div>
         <div class="queue-item active" data-action="play-queue-track" data-queue-index="${currentIdx}" data-song-id="${escapeHTML(nowPlaying.id)}" type="button" role="listitem">
           <div class="queue-item-index"><i class="fa-solid fa-volume-high" style="font-size:0.75rem;"></i></div>
           <img class="queue-item-cover" src="${escapeHTML(getOptimizedArtwork(nowPlaying.coverUrl, 100))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
           <div class="queue-item-info">
             <div class="queue-item-title">${escapeHTML(nowPlaying.title)}</div>
             <div class="queue-item-artist">${escapeHTML(nowPlaying.artist)}</div>
           </div>
           <div class="queue-actions">
             <button class="song-action-btn song-menu-trigger queue-menu-btn" data-action="open-track-menu" data-song-id="${escapeHTML(nowPlaying.id)}" type="button" aria-label="More options for ${escapeHTML(nowPlaying.title)}" title="More options">
               <i class="fa-solid fa-ellipsis-vertical"></i>
             </button>
           </div>
         </div>
       `
           : ''
       }

       ${
         upcoming.length
           ? `
         <div class="queue-section-title" style="display:flex; justify-content:space-between; align-items:center;">
           <span>Next Up (${upcoming.length})</span>
           <span style="font-size:0.6875rem; text-transform:none; font-weight:normal; opacity:0.75;">Drag or use arrows to reorder</span>
         </div>
         <div class="queue-reorderable-list" id="queue-reorderable-list">
           ${upcoming
             .map((s, i) => {
               const absIdx = currentIdx + 1 + i;
               const canMoveUp = i > 0;
               const canMoveDown = i < upcoming.length - 1;
               return `
             <div class="queue-item queue-item-reorderable"
                  draggable="true"
                  data-queue-id="${escapeHTML(s?._queueId || '')}"
                  data-queue-index="${absIdx}"
                  data-action="play-queue-track"
                  type="button"
                  role="listitem">
               <div class="queue-drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
                 <i class="fa-solid fa-grip-vertical"></i>
               </div>
               <div class="queue-item-index">${absIdx + 1}</div>
               <img class="queue-item-cover" src="${escapeHTML(getOptimizedArtwork(s?.coverUrl || '', 100))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
               <div class="queue-item-info">
                 <div class="queue-item-title">${escapeHTML(s?.title || 'Unknown Track')}</div>
                 <div class="queue-item-artist">${escapeHTML(s?.artist || 'Unknown Artist')}</div>
               </div>
               <div class="queue-actions" onclick="event.stopPropagation();">
                 <button class="queue-reorder-btn" data-action="queue-move-up" data-queue-index="${absIdx}" type="button" aria-label="Move ${escapeHTML(s?.title || '')} up" title="Move up" ${!canMoveUp ? 'disabled' : ''}>
                   <i class="fa-solid fa-chevron-up"></i>
                 </button>
                 <button class="queue-reorder-btn" data-action="queue-move-down" data-queue-index="${absIdx}" type="button" aria-label="Move ${escapeHTML(s?.title || '')} down" title="Move down" ${!canMoveDown ? 'disabled' : ''}>
                   <i class="fa-solid fa-chevron-down"></i>
                 </button>
                 <button class="song-action-btn song-menu-trigger queue-menu-btn" data-action="open-track-menu" data-song-id="${escapeHTML(s?.id || '')}" type="button" aria-label="More options for ${escapeHTML(s?.title || '')}" title="More options">
                   <i class="fa-solid fa-ellipsis-vertical"></i>
                 </button>
                 <button class="queue-item-remove" data-action="remove-from-queue" data-queue-id="${escapeHTML(s?._queueId || '')}" data-song-id="${escapeHTML(s?.id || '')}" type="button" aria-label="Remove from queue" title="Remove from queue">
                   <i class="fa-solid fa-xmark"></i>
                 </button>
               </div>
             </div>
           `;
             })
             .join('')}
         </div>
       `
           : ''
       }

       ${
         previous.length
           ? `
         <div class="queue-section-title">Previous (${previous.length})</div>
         ${previous
           .map(
             (s, i) => `
           <div class="queue-item queue-item-previous" data-action="play-queue-track" data-queue-index="${i}" data-song-id="${escapeHTML(s?.id || '')}" type="button" role="listitem">
             <div class="queue-item-index">${i + 1}</div>
             <img class="queue-item-cover" src="${escapeHTML(getOptimizedArtwork(s?.coverUrl || '', 100))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
             <div class="queue-item-info">
               <div class="queue-item-title">${escapeHTML(s?.title || 'Unknown Track')}</div>
               <div class="queue-item-artist">${escapeHTML(s?.artist || 'Unknown Artist')}</div>
             </div>
             <div class="queue-actions" onclick="event.stopPropagation();">
               <button class="song-action-btn song-menu-trigger queue-menu-btn" data-action="open-track-menu" data-song-id="${escapeHTML(s?.id || '')}" type="button" aria-label="More options" title="More options">
                 <i class="fa-solid fa-ellipsis-vertical"></i>
               </button>
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

  bindQueueDragAndDrop();
}

function bindQueueDragAndDrop() {
  const container = document.getElementById('queue-reorderable-list');
  if (!container) return;

  const items = container.querySelectorAll('.queue-item-reorderable');

  items.forEach((item) => {
    // --- DESKTOP HTML5 DRAG & DROP ---
    item.addEventListener('dragstart', (e) => {
      draggedQueueIndex = parseInt(item.dataset.queueIndex, 10);
      item.classList.add('is-dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(draggedQueueIndex));
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (e.clientY < midY) {
        item.classList.add('drag-over-above');
        item.classList.remove('drag-over-below');
      } else {
        item.classList.add('drag-over-below');
        item.classList.remove('drag-over-above');
      }
    });

    item.addEventListener('dragleave', () => {
      item.classList.remove('drag-over-above', 'drag-over-below');
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over-above', 'drag-over-below');
      const fromIdx = draggedQueueIndex;
      let toIdx = parseInt(item.dataset.queueIndex, 10);
      if (isNaN(fromIdx) || isNaN(toIdx) || fromIdx === toIdx) return;

      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      // If dropping on bottom half and moving downwards, adjust target
      if (e.clientY >= midY && toIdx > fromIdx) {
        // already after
      } else if (e.clientY < midY && toIdx > fromIdx) {
        toIdx--;
      } else if (e.clientY >= midY && toIdx < fromIdx) {
        toIdx++;
      }

      reorderQueue(fromIdx, toIdx);
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('is-dragging');
      items.forEach((el) =>
        el.classList.remove('drag-over-above', 'drag-over-below', 'is-dragging')
      );
      draggedQueueIndex = null;
    });

    // --- MOBILE TOUCH DRAG & DROP VIA HANDLE ---
    const handle = item.querySelector('.queue-drag-handle');
    if (handle) {
      handle.addEventListener(
        'touchstart',
        (e) => {
          touchDragIndex = parseInt(item.dataset.queueIndex, 10);
          item.classList.add('is-touch-dragging');
        },
        { passive: true }
      );

      handle.addEventListener(
        'touchmove',
        (e) => {
          if (touchDragIndex === null) return;
          const touch = e.touches[0];
          const elemBelow = document.elementFromPoint(
            touch.clientX,
            touch.clientY
          );
          const targetItem = elemBelow?.closest('.queue-item-reorderable');

          if (touchHoverTarget && touchHoverTarget !== targetItem) {
            touchHoverTarget.classList.remove(
              'drag-over-above',
              'drag-over-below'
            );
          }

          if (targetItem && targetItem !== item) {
            touchHoverTarget = targetItem;
            const rect = targetItem.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (touch.clientY < midY) {
              targetItem.classList.add('drag-over-above');
              targetItem.classList.remove('drag-over-below');
            } else {
              targetItem.classList.add('drag-over-below');
              targetItem.classList.remove('drag-over-above');
            }
          }
        },
        { passive: true }
      );

      handle.addEventListener(
        'touchend',
        () => {
          if (touchDragIndex !== null && touchHoverTarget) {
            const targetIdx = parseInt(
              touchHoverTarget.dataset.queueIndex,
              10
            );
            const isBelow =
              touchHoverTarget.classList.contains('drag-over-below');
            touchHoverTarget.classList.remove(
              'drag-over-above',
              'drag-over-below'
            );

            if (!isNaN(touchDragIndex) && !isNaN(targetIdx)) {
              let finalIdx = targetIdx;
              if (isBelow && targetIdx > touchDragIndex) {
                finalIdx = targetIdx;
              } else if (!isBelow && targetIdx > touchDragIndex) {
                finalIdx = targetIdx - 1;
              } else if (isBelow && targetIdx < touchDragIndex) {
                finalIdx = targetIdx + 1;
              }
              reorderQueue(touchDragIndex, finalIdx);
            }
          }
          item.classList.remove('is-touch-dragging');
          touchDragIndex = null;
          touchHoverTarget = null;
        },
        { passive: true }
      );

      handle.addEventListener('touchcancel', () => {
        if (touchHoverTarget) {
          touchHoverTarget.classList.remove(
            'drag-over-above',
            'drag-over-below'
          );
        }
        item.classList.remove('is-touch-dragging');
        touchDragIndex = null;
        touchHoverTarget = null;
      });
    }
  });
}

export function reorderQueue(fromIndex, toIndex) {
  if (!Array.isArray(state.queue)) return;
  if (fromIndex < 0 || fromIndex >= state.queue.length) return;
  if (toIndex < 0 || toIndex >= state.queue.length) return;
  if (fromIndex === toIndex) return;

  const currentSong = state.currentSong;
  const currentSongQueueId = state.queue[state.currentSongIndex]?._queueId;

  // Perform reorder
  const [movedSong] = state.queue.splice(fromIndex, 1);
  state.queue.splice(toIndex, 0, movedSong);

  // Preserve the currently playing track and its position
  if (currentSongQueueId) {
    const newIdx = state.queue.findIndex((s) => s._queueId === currentSongQueueId);
    if (newIdx !== -1) {
      state.currentSongIndex = newIdx;
    }
  } else if (currentSong) {
    const newIdx = state.queue.findIndex((s) => s.id === currentSong.id);
    if (newIdx !== -1) {
      state.currentSongIndex = newIdx;
    }
  }

  saveJSON(STORAGE.QUEUE, state.queue);
  renderQueuePanel();
  renderPlayerBar();
}

export function removeFromQueue(identifier) {
  if (!Array.isArray(state.queue)) return;
  const idx = state.queue.findIndex(
    (s) => (s && s._queueId === identifier) || (s && s.id === identifier)
  );
  if (idx === -1) return;
  if (idx === state.currentSongIndex) return; // Preserve currently playing song
  if (idx < state.currentSongIndex) {
    state.currentSongIndex--;
  }
  state.queue.splice(idx, 1);
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
