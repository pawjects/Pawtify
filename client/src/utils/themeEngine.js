/**
 * AMOLED Black Theme Enforcement
 * Dynamic color extraction and background gradients have been removed.
 * Enforces pure AMOLED Black (#000000) background and solid Spotify Green (#1DB954) accent.
 */

export function enforceAmoledTheme() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const body = document.body;

  root.style.setProperty('--extracted-color', '0, 0, 0');
  root.style.setProperty('--now-playing-color', '#000000');
  root.style.setProperty('--now-playing-rgb', '0, 0, 0');
  root.style.setProperty('--app-bg-gradient', 'none');
  root.style.setProperty('--now-playing-gradient', 'none');
  root.style.setProperty('--md-sys-color-background', '#000000');
  root.style.setProperty('--bg-app', '#000000');
  root.style.setProperty('--md-sys-color-primary', '#1db954');
  root.style.setProperty('--accent', '#1db954');

  if (body) {
    body.classList.remove('theme-active-playback');
    body.style.backgroundImage = 'none';
    body.style.backgroundColor = '#000000';
  }
}

/**
 * Backward compatibility export: ensures pure AMOLED Black theme without any Canvas extraction
 */
export function updateDynamicNowPlayingTheme() {
  enforceAmoledTheme();
}

/**
 * Stub kept for backwards compatibility (returns null; canvas extraction removed)
 */
export function extractDominantColor() {
  return Promise.resolve(null);
}
