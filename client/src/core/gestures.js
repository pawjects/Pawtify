import { navigate, parseRoute } from '../config/router.js';
import { state } from '../config/config.js';

export function setupSwipeGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) return; // Ignore multi-touch
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    touchMoved = true;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY || !touchMoved) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    touchStartX = 0;
    touchStartY = 0;

    // Check if it's a primarily horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 75) {
      // 1. Ignore if target is a range input (e.g., volume/seek sliders)
      if (e.target.tagName && e.target.tagName.toLowerCase() === 'input' && e.target.type === 'range') return;

      // 2. Ignore if swiping on a horizontally scrollable container
      let el = e.target;
      while (el && el !== document.body) {
        if (el.scrollWidth > el.clientWidth) {
          const style = window.getComputedStyle(el);
          if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
            return;
          }
        }
        el = el.parentElement;
      }

      // 3. Ignore if any modal/panel is open
      if (state.fullscreenPlayer || state.artistProfile || state.queuePanel || state.lyricsPanel || state.modal) return;

      // 4. Ignore swipes on the player UI area
      if (e.target.closest('#mini-player') || e.target.closest('#player-bar')) return;

      const routes = ['/', '/search', '/library'];
      
      const routeInfo = parseRoute();
      let currentPath = '/';
      if (routeInfo.name === 'search') currentPath = '/search';
      else if (routeInfo.name === 'library') currentPath = '/library';
      else if (routeInfo.name === 'home') currentPath = '/';
      else return; // If we are on a playlist page or song page, ignore swipe tabs

      const currentIdx = routes.indexOf(currentPath);
      if (currentIdx === -1) return; 

      if (deltaX < 0) {
        // Swipe left -> next tab
        if (currentIdx < routes.length - 1) {
          navigate(routes[currentIdx + 1]);
        }
      } else {
        // Swipe right -> prev tab
        if (currentIdx > 0) {
          navigate(routes[currentIdx - 1]);
        }
      }
    }
  });
}
