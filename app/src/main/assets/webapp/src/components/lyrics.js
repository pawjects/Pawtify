import { state } from '../config/config.js';
import { lyricsPanel } from '../config/dom.js';
import { escapeHTML, getOptimizedArtwork } from '../utils/utils.js';
import {
  fetchLyricsForSong,
  recordUserLyricsScroll,
  syncLyricsWithPlayback,
} from '../services/lyricsService.js';

let scrollListenerAttached = false;

export function attachLyricsScrollerListeners() {
  const scroller = document.getElementById('lyrics-body-scroller');
  if (scroller && !scrollListenerAttached) {
    scrollListenerAttached = true;
    scroller.addEventListener('scroll', () => {
      recordUserLyricsScroll();
    }, { passive: true });
    scroller.addEventListener('touchstart', () => {
      recordUserLyricsScroll();
    }, { passive: true });
  }
}

export function renderLyricsBodyContent(song) {
  if (!song) return '';

  const isLoading = Boolean(state.lyricsLoading);
  const data = state.lyricsData;
  const hasSynced = Boolean(data?.hasSynced && data.synced?.length > 0);
  const hasPlain = Boolean(data?.plain && data.plain.trim().length > 0);
  const isInstrumental = Boolean(data?.isInstrumental);

  if (isLoading) {
    return `
      <div class="lyrics-loading-container">
        <div class="lyrics-skeleton-line" style="width: 45%;"></div>
        <div class="lyrics-skeleton-line" style="width: 75%;"></div>
        <div class="lyrics-skeleton-line" style="width: 60%;"></div>
        <div class="lyrics-skeleton-line" style="width: 85%;"></div>
        <div class="lyrics-skeleton-line" style="width: 50%;"></div>
        <div class="lyrics-skeleton-line" style="width: 70%;"></div>
        <div class="lyrics-skeleton-line" style="width: 40%;"></div>
      </div>
    `;
  }
  
  if (isInstrumental) {
    return `
      <div class="lyrics-empty-container">
        <div class="lyrics-empty-icon"><span class="material-symbols-rounded">piano</span></div>
        <h3 class="lyrics-empty-title">Instrumental Track</h3>
        <p class="lyrics-empty-desc">This song does not contain recorded vocal lyrics.</p>
      </div>
    `;
  }
  
  if (hasSynced) {
    const curSec = Number(state.progress || 0);
    let activeIdx = 0;
    for (let i = 0; i < data.synced.length; i++) {
      if (curSec >= data.synced[i].time) activeIdx = i;
      else break;
    }

    return `
      <div class="lyrics-synced-list">
        ${data.synced
          .map((line, idx) => {
            const isActive = idx === activeIdx;
            return `
              <div class="lyrics-line ${isActive ? 'active' : ''}"
                   data-action="seek-lyric"
                   data-time="${line.time}"
                   data-index="${idx}"
                   role="button"
                   tabindex="0"
                   aria-label="Seek to lyric: ${escapeHTML(line.text)}">
                ${escapeHTML(line.text)}
              </div>
            `;
          })
          .join('')}
      </div>
    `;
  }
  
  if (hasPlain) {
    const lines = data.plain.split('\n');
    return `
      <div class="lyrics-plain-text">
        ${lines
          .map((line) => {
            const trimmed = line.trim();
            return trimmed ? `<p class="lyrics-plain-line">${escapeHTML(trimmed)}</p>` : `<div class="lyrics-plain-gap"></div>`;
          })
          .join('')}
      </div>
    `;
  }
  
  return `
    <div class="lyrics-empty-container">
      <div class="lyrics-empty-icon"><span class="material-symbols-rounded">mic_off</span></div>
      <h3 class="lyrics-empty-title">No Lyrics Found</h3>
      <p class="lyrics-empty-desc">We couldn't locate synchronized lyrics for "${escapeHTML(song.title)}" on LRCLIB.</p>
      <button class="btn btn-soft btn-sm" data-action="retry-lyrics" type="button" style="margin-top: 14px; border-radius: 9999px;">
        <span class="material-symbols-rounded">refresh</span> Try Again
      </button>
    </div>
  `;
}

export function renderLyricsViewHTML(song) {
  if (!song) return '';
  return `
    <div class="fs-lyrics-view">
      <div class="lyrics-body" id="lyrics-body-scroller">
        ${renderLyricsBodyContent(song)}
      </div>
    </div>
  `;
}

export function renderLyricsPanel() {
  if (!lyricsPanel) return;
  if (!state.lyricsPanel) {
    lyricsPanel.classList.remove('active');
    lyricsPanel.innerHTML = '';
    return;
  }

  // When fullscreen player is open, lyrics are rendered in-place within the player container
  if (state.fullscreenPlayer) {
    lyricsPanel.classList.remove('active');
    lyricsPanel.innerHTML = '';
    return;
  }

  lyricsPanel.classList.add('active');
  const song = state.currentSong;

  // If lyricsData is missing for current song, trigger fetch
  if (song && (!state.lyricsData || state.lyricsData.songId !== song.id) && !state.lyricsLoading) {
    fetchLyricsForSong(song);
  }

  lyricsPanel.innerHTML = `
    <div class="lyrics-panel-inner">
      ${renderLyricsViewHTML(song)}
    </div>
  `;

  attachLyricsScrollerListeners();

  if (state.lyricsData?.hasSynced) {
    setTimeout(() => {
      syncLyricsWithPlayback();
    }, 50);
  }
}
