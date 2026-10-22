import { navigate, parseRoute } from '../config/router.js';
import { state } from '../config/config.js';
import {
  openFullscreenPlayer,
  closeFullscreenPlayer,
  closeQueuePanel,
  closeArtistProfile,
  closeLyricsPanel,
  closeModal,
  dismissKeyboard,
} from './navigationHistory.js';

/**
 * Universal Mobile & Desktop Gesture Controller for Pawtify
 *
 * Implements:
 * 1. Interactive swipe-down to minimize fullscreen player with 1:1 finger/pointer tracking
 * 2. Bottom sheet pull-down gestures for Queue, Artist Profile, Lyrics, and Modals
 * 3. Swipe-up or tap on mini-player to expand player
 * 4. Horizontal tab swiping across Home, Search, Library, and You tabs
 * 5. Interrupted gesture resilience with smooth spring-back animations
 * 6. Protection against accidental dismissal when scrolling content or clicking controls
 */
export function setupSwipeGestures() {
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let isDraggingDown = false;
  let isDraggingMiniUp = false;
  let activeDragElement = null;
  let initialScrollTop = 0;
  let pointerActive = false;

  const interactiveSelector =
    'input, textarea, select, button, .fs-controls, .fs-progress, .player-controls, .fs-actions, .fs-heart, .song-menu-trigger, .track-menu-popup, .queue-item-remove, .queue-reorder-btn, [role="button"], a';

  function onGestureStart(x, y, target, isMouse = false) {
    startX = x;
    startY = y;
    startTime = Date.now();
    isDraggingDown = false;
    isDraggingMiniUp = false;
    activeDragElement = null;
    pointerActive = true;

    // Check if touching mini-player to drag upward
    const mini = target.closest('#mini-player');
    if (mini && !target.closest('button, [role="button"]')) {
      isDraggingMiniUp = true;
      return;
    }

    // Do not initiate pull-down gestures on interactive controls
    if (target.closest(interactiveSelector)) {
      return;
    }

    // Check if touching a modal overlay
    const modal = target.closest('.overlay .modal');
    if (modal && state.modal) {
      activeDragElement = { element: modal, type: 'modal', scrollable: modal };
      initialScrollTop = modal.scrollTop || 0;
      return;
    }

    // Check if touching Queue panel
    const qp = target.closest('#queue-panel');
    if (qp && state.queuePanel && qp.classList.contains('active')) {
      const scrollable = qp.querySelector('.queue-list') || qp;
      initialScrollTop = scrollable.scrollTop || 0;
      activeDragElement = { element: qp, type: 'queue', scrollable };
      return;
    }

    // Check if touching Lyrics Panel
    const lp = target.closest('#lyrics-panel');
    if (lp && state.lyricsPanel && lp.classList.contains('active')) {
      const scrollable = lp.querySelector('.lyrics-body') || lp;
      initialScrollTop = scrollable.scrollTop || 0;
      activeDragElement = { element: lp, type: 'lyrics', scrollable };
      return;
    }

    // Check if touching Artist Profile
    const ap = target.closest('#artist-profile');
    if (ap && state.artistProfile && ap.classList.contains('active')) {
      const scrollable = ap.querySelector('.artist-content') || ap;
      initialScrollTop = scrollable.scrollTop || 0;
      activeDragElement = { element: ap, type: 'artist', scrollable };
      return;
    }

    // Check if touching fullscreen player
    const fs = target.closest('#fullscreen-player');
    if (fs && state.fullscreenPlayer && fs.classList.contains('active')) {
      // Fullscreen player element itself has overflow-y: auto
      const scrollable = fs;
      initialScrollTop = scrollable.scrollTop || 0;
      activeDragElement = { element: fs, type: 'fullscreen', scrollable };
      return;
    }
  }

  function onGestureMove(x, y, e) {
    if (!pointerActive || !startX || !startY) return;
    const deltaX = x - startX;
    const deltaY = y - startY;

    // Dismiss keyboard on intentional scroll
    if (Math.abs(deltaY) > 20) {
      dismissKeyboard();
    }

    // Pulling down on an open sheet or fullscreen player
    if (activeDragElement && deltaY > 0) {
      const currentScroll = activeDragElement.scrollable.scrollTop || 0;
      // Only initiate pull-down drag if scrolled to the top
      if (initialScrollTop <= 4 && currentScroll <= 4) {
        if (deltaY > 10 && deltaY > Math.abs(deltaX) * 1.15) {
          isDraggingDown = true;
          if (e && e.cancelable) {
            e.preventDefault();
          }
          const el = activeDragElement.element;
          // Smooth progressive damping curve
          const dampedY = deltaY < 80 ? deltaY : 80 + (deltaY - 80) * 0.72;
          const maxDim = window.innerHeight || 800;
          const opacity = Math.max(0.35, 1 - (dampedY / (maxDim * 0.75)));

          el.style.transform = `translateY(${dampedY}px)`;
          el.style.opacity = String(opacity);
          el.style.transition = 'none';
        }
      }
    }

    // Mini-player upward drag to expand
    if (isDraggingMiniUp && deltaY < -25 && Math.abs(deltaY) > Math.abs(deltaX)) {
      isDraggingMiniUp = false;
      pointerActive = false;
      openFullscreenPlayer();
    }
  }

  function onGestureEnd(x, y, target) {
    if (!pointerActive) return;
    pointerActive = false;

    const deltaX = x - startX;
    const deltaY = y - startY;
    const elapsed = Math.max(1, Date.now() - startTime);
    const velocityY = deltaY / elapsed;

    // Handle pull-down dismissal
    if (isDraggingDown && activeDragElement) {
      const el = activeDragElement.element;
      const type = activeDragElement.type;
      isDraggingDown = false;
      activeDragElement = null;

      const shouldDismiss = deltaY > 90 || (deltaY > 35 && velocityY > 0.35);

      if (shouldDismiss) {
        // Animate smoothly to dismissed position
        el.style.transition =
          'transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease';
        el.style.transform = 'translateY(100%)';
        el.style.opacity = '0';
        setTimeout(() => {
          el.style.transform = '';
          el.style.opacity = '';
          el.style.transition = '';
          if (type === 'fullscreen') closeFullscreenPlayer();
          else if (type === 'queue') closeQueuePanel();
          else if (type === 'artist') closeArtistProfile();
          else if (type === 'lyrics') closeLyricsPanel();
          else if (type === 'modal') closeModal();
        }, 260);
      } else {
        // Snap back smoothly on interrupted or sub-threshold drag
        cancelGesture(el);
      }

      startX = 0;
      startY = 0;
      return;
    }

    activeDragElement = null;
    isDraggingDown = false;
    isDraggingMiniUp = false;

    // Horizontal Tab Swiping (Only when no modals or player sheets are open)
    if (
      !state.fullscreenPlayer &&
      !state.artistProfile &&
      !state.queuePanel &&
      !state.lyricsPanel &&
      !state.modal
    ) {
      if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 70) {
        if (target) {
          // Ignore sliders
          if (
            target.tagName &&
            target.tagName.toLowerCase() === 'input' &&
            target.type === 'range'
          ) {
            return;
          }

          // Ignore horizontally scrollable containers
          let el = target;
          while (el && el !== document.body) {
            if (el.scrollWidth > el.clientWidth) {
              const style = window.getComputedStyle(el);
              if (
                style.overflowX === 'auto' ||
                style.overflowX === 'scroll' ||
                style.overflow === 'auto' ||
                style.overflow === 'scroll'
              ) {
                return;
              }
            }
            el = el.parentElement;
          }

          if (target.closest('#mini-player') || target.closest('#player-bar')) {
            return;
          }
        }

        const routes = ['/', '/search', '/library', '/you'];
        const routeInfo = parseRoute();
        let currentPath = '/';
        if (routeInfo.name === 'search') currentPath = '/search';
        else if (routeInfo.name === 'library') currentPath = '/library';
        else if (routeInfo.name === 'you') currentPath = '/you';
        else if (routeInfo.name === 'home') currentPath = '/';
        else return;

        const currentIdx = routes.indexOf(currentPath);
        if (currentIdx !== -1) {
          dismissKeyboard();
          if (deltaX < 0 && currentIdx < routes.length - 1) {
            navigate(routes[currentIdx + 1]);
          } else if (deltaX > 0 && currentIdx > 0) {
            navigate(routes[currentIdx - 1]);
          }
        }
      }
    }

    startX = 0;
    startY = 0;
  }

  function cancelGesture(elementToReset = null) {
    const el = elementToReset || activeDragElement?.element;
    if (el) {
      el.style.transition =
        'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.2s ease';
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
      setTimeout(() => {
        el.style.transform = '';
        el.style.opacity = '';
        el.style.transition = '';
      }, 230);
    }
    isDraggingDown = false;
    isDraggingMiniUp = false;
    activeDragElement = null;
    pointerActive = false;
    startX = 0;
    startY = 0;
  }

  // --- TOUCH EVENT LISTENERS ---
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 1) {
        cancelGesture();
        return;
      }
      const touch = e.touches[0];
      onGestureStart(touch.clientX, touch.clientY, e.target, false);
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    (e) => {
      if (!e.touches || !e.touches.length) return;
      const touch = e.touches[0];
      onGestureMove(touch.clientX, touch.clientY, e);
    },
    { passive: false }
  );

  document.addEventListener(
    'touchend',
    (e) => {
      if (!e.changedTouches || !e.changedTouches.length) {
        cancelGesture();
        return;
      }
      const touch = e.changedTouches[0];
      onGestureEnd(touch.clientX, touch.clientY, e.target);
    },
    { passive: true }
  );

  document.addEventListener('touchcancel', () => {
    cancelGesture();
  });

  // --- MOUSE / DESKTOP POINTER GESTURES FOR FULLSCREEN & SHEETS ---
  let isMouseDown = false;

  document.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return; // Only primary mouse button
    // Only drag fullscreen player or bottom sheets with mouse if dragging header or cover
    const fs = e.target.closest('#fullscreen-player');
    const modal = e.target.closest('.overlay .modal');
    if ((fs && state.fullscreenPlayer) || (modal && state.modal)) {
      if (!e.target.closest(interactiveSelector)) {
        isMouseDown = true;
        onGestureStart(e.clientX, e.clientY, e.target, true);
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    onGestureMove(e.clientX, e.clientY, e);
  });

  document.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;
    isMouseDown = false;
    onGestureEnd(e.clientX, e.clientY, e.target);
  });
}
