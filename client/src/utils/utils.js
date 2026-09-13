import { showToast, state } from '../config/config.js';
import { renderLyricsPanel } from '../components/lyrics.js';

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
