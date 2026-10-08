import { showToast, state } from '../config/config.js';
import { renderLyricsPanel } from '../components/lyrics.js';
import { idbSet } from './idb.js';

export function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}

export function escapeHTML(text) {
  const s = String(text ?? '');
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

export function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {}
  // Persist seamlessly to IndexedDB in the background
  idbSet(key, value).catch(e => console.warn('IDB Save failed', e));
}

export async function downloadCurrentSong() {
  showToast(
    'Downloading directly from YouTube embeds is restricted. We recommend adding this song to a playlist instead!'
  );
}

export async function openLyrics() {
  state.lyricsPanel = true;
  renderLyricsPanel();
}

/**
 * Optimizes YouTube & streaming artwork URLs to request crisp, high-resolution thumbnails
 * while avoiding blurry low-res thumbnails or huge unneeded downloads.
 */
export function getOptimizedArtwork(url, targetSize = 540) {
  if (!url || typeof url !== 'string') return '/assets/pawtify.png';
  let clean = url.trim();
  if (!clean) return '/assets/pawtify.png';

  // Upgrade Google/YouTube Music thumbnail size parameters to sharp resolution
  if (clean.includes('googleusercontent.com') || clean.includes('ggpht.com')) {
    if (/=w\d+-h\d+/.test(clean)) {
      clean = clean.replace(/=w\d+-h\d+[^?]*/, `=w${targetSize}-h${targetSize}-l90-rj`);
    } else if (/=s\d+/.test(clean)) {
      clean = clean.replace(/=s\d+[^?]*/, `=s${targetSize}`);
    }
  }

  return clean;
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Recently';
  const now = Date.now();
  const diffMs = now - Number(timestamp);
  if (diffMs < 0 || isNaN(diffMs)) return 'Just now';
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatActivityDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
