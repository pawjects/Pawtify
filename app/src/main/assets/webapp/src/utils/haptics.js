/**
 * Pawtify Native Haptic Feedback Utility
 * Provides subtle, accessible tactile feedback on mobile devices.
 * Respects user preferences (prefers-reduced-motion) and fails silently.
 */

let lastHapticTime = 0;
const HAPTIC_THROTTLE_MS = 60; // Throttle to prevent repeated vibration spam

function canVibrate() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  if (typeof navigator.vibrate !== 'function') {
    return false;
  }
  // Respect accessibility preferences
  try {
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return false;
    }
  } catch (e) {
    // Fail silently on media query lookup issues
  }
  return true;
}

function triggerVibration(pattern) {
  if (!canVibrate()) return;
  const now = Date.now();
  if (now - lastHapticTime < HAPTIC_THROTTLE_MS) return;
  lastHapticTime = now;

  try {
    navigator.vibrate(pattern);
  } catch (err) {
    // Fail silently without throwing errors
  }
}

/**
 * Light tap haptic on touch down for navigation items (subtle 8ms tick)
 */
export function hapticNavTap() {
  triggerVibration(8);
}

/**
 * Subtle confirmation haptic on successful tab change (crisp 12ms pulse)
 */
export function hapticTabChange() {
  triggerVibration(12);
}

/**
 * General subtle click/selection haptic for buttons (6ms)
 */
export function hapticSelection() {
  triggerVibration(6);
}

/**
 * General vibrate helper with fallback
 */
export function vibrate(pattern = 8) {
  triggerVibration(pattern);
}

export default {
  hapticNavTap,
  hapticTabChange,
  hapticSelection,
  vibrate,
};
