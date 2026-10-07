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
 * Native Mobile Gesture Controller for Pawtify
 *
 * Implements:
 * 1. Interactive swipe-down to collapse fullscreen player with 1:1 finger tracking
 * 2. Bottom sheet pull-down gestures for Queue, Artist Profile, Lyrics, and Modals
 * 3. Swipe-up or tap on mini-player to expand player
 * 4. Horizontal tab swiping across Home, Search, Library, and You tabs
 * 5. Automatic keyboard dismissal before navigation or on downward scrolls
 */
export function setupSwipeGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let isDraggingDown = false;
  let isDraggingMiniUp = false;
  let activeDragElement = null;
  let initialScrollTop = 0;

  // 1. TOUCH START
  document.addEventListener(
    'touchstart',
    (e) => {
      if (e.touches.length > 1) return; // Ignore multi-touch gestures
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
      isDraggingDown = false;
      isDraggingMiniUp = false;
      activeDragElement = null;

      // Check if touching mini-player to drag upward
      const mini = e.target.closest('#mini-player');
      if (mini && !e.target.closest('button, [role="button"]')) {
        isDraggingMiniUp = true;
        return;
      }

      // Do not initiate pull-down gestures when interacting with controls, sliders or buttons
      if (e.target.closest('input, textarea, select, button, .fs-controls, .fs-progress, .player-controls, [role="button"]')) {
        return;
      }

      // Check if touching fullscreen player
      if (state.fullscreenPlayer) {
        const fs = document.getElementById('fullscreen-player');
        if (fs && fs.classList.contains('active')) {
          const scrollable = fs.querySelector('.fs-content') || fs;
          initialScrollTop = scrollable.scrollTop || 0;
          activeDragElement = { element: fs, type: 'fullscreen', scrollable };
          return;
        }
      }

      // Check if touching Queue panel
      if (state.queuePanel) {
        const qp = document.getElementById('queue-panel');
        if (qp && qp.classList.contains('active')) {
          const scrollable = qp.querySelector('.queue-list') || qp;
          initialScrollTop = scrollable.scrollTop || 0;
          activeDragElement = { element: qp, type: 'queue', scrollable };
          return;
        }
      }

      // Check if touching Artist Profile
      if (state.artistProfile) {
        const ap = document.getElementById('artist-profile');
        if (ap && ap.classList.contains('active')) {
          const scrollable = ap.querySelector('.artist-content') || ap;
          initialScrollTop = scrollable.scrollTop || 0;
          activeDragElement = { element: ap, type: 'artist', scrollable };
          return;
        }
      }

      // Check if touching Lyrics Panel
      if (state.lyricsPanel) {
        const lp = document.getElementById('lyrics-panel');
        if (lp && lp.classList.contains('active')) {
          const scrollable = lp.querySelector('.lyrics-body') || lp;
          initialScrollTop = scrollable.scrollTop || 0;
          activeDragElement = { element: lp, type: 'lyrics', scrollable };
          return;
        }
      }

      // Check if touching a modal overlay
      if (state.modal) {
        const modal = document.querySelector('.overlay .modal');
        if (modal) {
          activeDragElement = { element: modal, type: 'modal', scrollable: modal };
          initialScrollTop = modal.scrollTop || 0;
          return;
        }
      }
    },
    { passive: true }
  );

  // 2. TOUCH MOVE
  document.addEventListener(
    'touchmove',
    (e) => {
      if (!touchStartX || !touchStartY) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;

      // Dismiss keyboard on intentional scroll
      if (Math.abs(deltaY) > 20) {
        dismissKeyboard();
      }

      // A. Pulling down on an open sheet / fullscreen player
      if (activeDragElement && deltaY > 0) {
        const currentScroll = activeDragElement.scrollable.scrollTop || 0;
        // Only initiate pull-down drag if scrolled to the top
        if (initialScrollTop <= 2 && currentScroll <= 2) {
          if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
            isDraggingDown = true;
            const el = activeDragElement.element;
            // Native damping curve
            const dampedY = deltaY < 80 ? deltaY : 80 + (deltaY - 80) * 0.75;
            el.style.transform = `translateY(${dampedY}px)`;
            el.style.transition = 'none';
          }
        }
      }

      // B. Mini-player upward drag
      if (isDraggingMiniUp && deltaY < -25 && Math.abs(deltaY) > Math.abs(deltaX)) {
        isDraggingMiniUp = false;
        openFullscreenPlayer();
      }
    },
    { passive: true }
  );

  // 3. TOUCH END
  document.addEventListener(
    'touchend',
    (e) => {
      if (!touchStartX || !touchStartY) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      const elapsed = Math.max(1, Date.now() - touchStartTime);
      const velocityY = deltaY / elapsed;

      // Handle Pull-down Dismissal
      if (isDraggingDown && activeDragElement) {
        const el = activeDragElement.element;
        const type = activeDragElement.type;
        isDraggingDown = false;
        activeDragElement = null;

        const shouldDismiss = deltaY > 95 || (deltaY > 35 && velocityY > 0.4);

        if (shouldDismiss) {
          // Animate smoothly to dismissed position
          el.style.transition = 'transform 0.26s cubic-bezier(0.2, 0.9, 0.3, 1), opacity 0.22s ease';
          el.style.transform = 'translateY(100%)';
          setTimeout(() => {
            el.style.transform = '';
            el.style.transition = '';
            if (type === 'fullscreen') closeFullscreenPlayer();
            else if (type === 'queue') closeQueuePanel();
            else if (type === 'artist') closeArtistProfile();
            else if (type === 'lyrics') closeLyricsPanel();
            else if (type === 'modal') closeModal();
          }, 260);
        } else {
          // Snap back smoothly
          el.style.transition = 'transform 0.22s cubic-bezier(0.2, 0.9, 0.3, 1)';
          el.style.transform = 'translateY(0)';
          setTimeout(() => {
            el.style.transform = '';
            el.style.transition = '';
          }, 230);
        }

        touchStartX = 0;
        touchStartY = 0;
        return;
      }

      activeDragElement = null;
      isDraggingDown = false;
      isDraggingMiniUp = false;

      // 4. Horizontal Tab Swiping (Only when no modals or panels are open)
      if (
        !state.fullscreenPlayer &&
        !state.artistProfile &&
        !state.queuePanel &&
        !state.lyricsPanel &&
        !state.modal
      ) {
        if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) > 70) {
          // Ignore sliders
          if (
            e.target.tagName &&
            e.target.tagName.toLowerCase() === 'input' &&
            e.target.type === 'range'
          ) {
            return;
          }

          // Ignore horizontally scrollable containers
          let el = e.target;
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

          if (e.target.closest('#mini-player') || e.target.closest('#player-bar')) {
            return;
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

      touchStartX = 0;
      touchStartY = 0;
    },
    { passive: true }
  );
}
