/**
 * Material Design 3 Lightweight Ripple Effect Engine
 * Provides authentic, GPU-accelerated 60fps touch and pointer ripples
 * on elevated buttons, cards, and list items.
 *
 * Seeded with low-opacity Spotify Green (#1DB954) on primary elements,
 * or translucent white on dark surface components.
 */

export function setupMaterialRipple() {
  if (typeof document === 'undefined') return;

  const RIPPLE_SELECTOR = [
    '.btn',
    '.icon-btn',
    '.fab',
    '.card',
    '.home-compact-card',
    '.home-scroll-card',
    '.station-card',
    '.song-row',
    '.library-list-item',
    '.sidebar-playlist-item',
    '.nav-link',
    '.mobile-nav-item',
    '.control-btn',
    '.lib-filter-chip',
    '.home-filter-chip',
    '.search-tab-pill',
    '.md3-chip',
    '.player-more-card',
    '.player-more-grid-btn',
    '.fs-pill-btn',
    '.fs-nav-circle-btn',
    '.fs-play-btn-accent',
    '.fs-play-btn-cyan',
    '.mini-player-btn',
    '.interactive-item',
    '[data-ripple="true"]'
  ].join(', ');

  function triggerRipple(e) {
    const target = e.target.closest(RIPPLE_SELECTOR);
    if (!target) return;

    // Do not ripple on range inputs or scrollbars
    if (e.target.tagName && e.target.tagName.toLowerCase() === 'input' && e.target.type === 'range') {
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Extract coordinate depending on pointer/touch event
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    if (clientX === undefined || clientY === undefined) {
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    const ripple = document.createElement('span');
    ripple.className = 'md3-ripple-wave';

    // Check if primary green accent element
    const isPrimary =
      target.classList.contains('btn-primary') ||
      target.classList.contains('mini-player-play-btn') ||
      target.classList.contains('fs-play-btn-accent') ||
      target.classList.contains('fs-play-btn-cyan') ||
      target.classList.contains('active') ||
      target.matches('.search-tab-pill.active, .home-filter-chip.active, .lib-filter-chip.active');

    if (isPrimary) {
      ripple.classList.add('ripple-green');
    }

    // Diameter ensures the circular wave comfortably covers the element bounds
    const size = Math.max(rect.width, rect.height) * 2.2;
    const x = clientX - rect.left - size / 2;
    const y = clientY - rect.top - size / 2;

    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // Ensure containing block is positioned and overflows clipped
    const compStyle = window.getComputedStyle(target);
    if (compStyle.position === 'static') {
      target.style.position = 'relative';
    }
    target.classList.add('md3-ripple-host');
    target.appendChild(ripple);

    const onAnimEnd = () => {
      ripple.removeEventListener('animationend', onAnimEnd);
      if (ripple.parentNode === target) {
        target.removeChild(ripple);
      }
    };

    ripple.addEventListener('animationend', onAnimEnd);

    // Timeout safeguard
    setTimeout(() => {
      if (ripple.parentNode === target) {
        target.removeChild(ripple);
      }
    }, 600);
  }

  // Use Pointer Events for lowest latency on touch and mouse
  if (typeof window.PointerEvent !== 'undefined') {
    document.addEventListener('pointerdown', triggerRipple, { passive: true });
  } else {
    document.addEventListener('touchstart', triggerRipple, { passive: true });
    document.addEventListener('mousedown', triggerRipple, { passive: true });
  }
}
