import { state, STORAGE, showToast } from '../config/config.js';
import { queuePanel, miniPlayer } from '../config/dom.js';
import { escapeHTML, saveJSON, getOptimizedArtwork, formatTime } from '../utils/utils.js';
import { renderPlayerBar, refreshPlaybackUI } from './playerBar.js';
import { previousTrack, nextTrack, play, dismissPlayer } from './player.js';
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

export function shuffleQueue() {
  if (!state.queue || state.queue.length <= 1) return;
  const currentSong = state.queue[state.currentSongIndex];
  const others = state.queue.filter((_, idx) => idx !== state.currentSongIndex);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  state.queue = currentSong ? [currentSong, ...others] : others;
  state.currentSongIndex = 0;
  saveJSON(STORAGE.QUEUE, state.queue);
  showToast('Queue shuffled');
  renderQueuePanel();
  refreshPlaybackUI();
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

  queuePanel.innerHTML = `
     <div class="queue-sheet-handle"></div>
     <div class="queue-header queue-sheet-header">
       <div class="queue-sheet-title-wrap">
         <h2 class="queue-sheet-title">Up next</h2>
         <span class="queue-sheet-sub">${queue.length} track${queue.length === 1 ? '' : 's'}</span>
       </div>
       <div class="queue-header-actions">
         <button class="queue-shuffle-pill-btn" data-action="shuffle-queue" type="button" aria-label="Shuffle list">
           <i class="fa-solid fa-shuffle"></i>
           <span>Shuffle List</span>
         </button>
         <button class="queue-close-btn" data-action="close-queue" type="button" aria-label="Close queue">
           <i class="fa-solid fa-xmark"></i>
         </button>
       </div>
     </div>

     <div class="queue-list" id="queue-list-container">
       ${!queue.length ? '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>Queue is empty</h2><p>Add songs to start listening.</p></div>' : ''}

       <div class="queue-vertical-list" id="queue-reorderable-list">
         ${queue
           .map((s, idx) => {
             const isCurrent = idx === currentIdx;
             const durText = formatTime(s?.durationSec || 0);
             return `
               <div class="queue-item ${isCurrent ? 'queue-item-current active' : ''} queue-item-reorderable"
                    draggable="true"
                    data-queue-id="${escapeHTML(s?._queueId || '')}"
                    data-queue-index="${idx}"
                    data-action="play-queue-track"
                    type="button"
                    role="listitem">
                 <img class="queue-item-cover queue-item-thumb" src="${escapeHTML(getOptimizedArtwork(s?.coverUrl || '', 120))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
                 <div class="queue-item-info">
                   <div class="queue-item-title">${escapeHTML(s?.title || 'Unknown Track')}</div>
                   <div class="queue-item-artist">${escapeHTML(s?.artist || 'Unknown Artist')}</div>
                 </div>
                 <div class="queue-item-meta-right">
                   ${
                     isCurrent
                       ? `
                     <div class="animated-equalizer" aria-label="Currently playing" title="Playing">
                       <span class="eq-bar eq-bar-1"></span>
                       <span class="eq-bar eq-bar-2"></span>
                       <span class="eq-bar eq-bar-3"></span>
                     </div>
                   `
                       : `
                     <span class="queue-item-duration">${durText}</span>
                   `
                   }
                   <button class="song-action-btn song-menu-trigger queue-menu-btn" data-action="open-track-menu" data-song-id="${escapeHTML(s?.id || '')}" type="button" aria-label="More options" title="More options">
                     <i class="fa-solid fa-ellipsis-vertical"></i>
                   </button>
                 </div>
               </div>
             `;
           })
           .join('')}
       </div>
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

// Mobile mini-player swipe gestures (Swipe-down to dismiss, Swipe-up to expand)
export let miniPlayerTouchStartX = 0;
export let miniPlayerTouchStartY = 0;
export const SWIPE_THRESHOLD = 40;
let isMiniPlayerDragging = false;

if (miniPlayer) {
  miniPlayer.addEventListener(
    'touchstart',
    (e) => {
      if (e.target.closest('button, [role="button"], .mini-player-btn')) {
        isMiniPlayerDragging = false;
        return;
      }
      miniPlayerTouchStartX = e.changedTouches[0].screenX;
      miniPlayerTouchStartY = e.changedTouches[0].screenY;
      isMiniPlayerDragging = true;
      miniPlayer.style.transition = 'none';
    },
    { passive: true }
  );

  miniPlayer.addEventListener(
    'touchmove',
    (e) => {
      if (!isMiniPlayerDragging) return;
      const currentY = e.changedTouches[0].screenY;
      const diffY = currentY - miniPlayerTouchStartY;
      if (diffY > 0) {
        // Dragging down toward dismiss
        miniPlayer.style.transform = `translateY(${diffY}px)`;
        miniPlayer.style.opacity = `${Math.max(0.35, 1 - diffY / 160)}`;
      }
    },
    { passive: true }
  );

  miniPlayer.addEventListener(
    'touchend',
    (e) => {
      if (!isMiniPlayerDragging) return;
      isMiniPlayerDragging = false;
      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;
      const diffX = touchEndX - miniPlayerTouchStartX;
      const diffY = touchEndY - miniPlayerTouchStartY;

      miniPlayer.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease';

      // Swipe Down to Dismiss Miniplayer
      if (diffY > SWIPE_THRESHOLD) {
        miniPlayer.style.transform = 'translateY(120%)';
        miniPlayer.style.opacity = '0';
        setTimeout(() => {
          miniPlayer.style.transform = '';
          miniPlayer.style.opacity = '';
          miniPlayer.style.transition = '';
          dismissPlayer();
        }, 220);
        return;
      }

      // Swipe Up to Expand Fullscreen Player
      if (diffY < -30) {
        miniPlayer.style.transform = '';
        miniPlayer.style.opacity = '';
        state.fullscreenPlayer = true;
        renderFullscreenPlayer();
        return;
      }

      // Horizontal Swipe: Track Switching
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
        miniPlayer.style.transform = '';
        miniPlayer.style.opacity = '';
        if (diffX > 0) {
          previousTrack();
        } else {
          nextTrack();
        }
        return;
      }

      // Reset to resting docked position
      miniPlayer.style.transform = '';
      miniPlayer.style.opacity = '';
      setTimeout(() => {
        miniPlayer.style.transition = '';
      }, 250);
    },
    { passive: true }
  );

  miniPlayer.addEventListener('touchcancel', () => {
    isMiniPlayerDragging = false;
    miniPlayer.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
    miniPlayer.style.transform = '';
    miniPlayer.style.opacity = '';
  });
}
