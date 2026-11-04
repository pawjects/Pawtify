import { state } from '../config/config.js';
import { lyricsPanel } from '../config/dom.js';
import { escapeHTML } from '../utils/utils.js';
import {
  fetchLyricsForSong,
  recordUserLyricsScroll,
  syncLyricsWithPlayback,
} from '../services/lyricsService.js';

let scrollListenerAttached = false;

export function renderLyricsPanel() {
  if (!lyricsPanel) return;
  if (!state.lyricsPanel) {
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

  const isLoading = Boolean(state.lyricsLoading);
  const data = state.lyricsData;
  const hasSynced = Boolean(data?.hasSynced && data.synced?.length > 0);
  const hasPlain = Boolean(data?.plain && data.plain.trim().length > 0);
  const isInstrumental = Boolean(data?.isInstrumental);

  let statusBadge = '';
  if (isLoading) {
    statusBadge = `
      <div class="lyrics-badge lyrics-badge-loading">
        <span class="material-symbols-rounded lyrics-badge-icon">sync</span>
        <span>Fetching LRCLIB...</span>
      </div>
    `;
  } else if (hasSynced) {
    statusBadge = `
      <div class="lyrics-badge lyrics-badge-synced">
        <span class="material-symbols-rounded lyrics-badge-icon">graphic_eq</span>
        <span>Synced Lyrics</span>
      </div>
    `;
  } else if (hasPlain) {
    statusBadge = `
      <div class="lyrics-badge lyrics-badge-plain">
        <span class="material-symbols-rounded lyrics-badge-icon">subject</span>
        <span>Plain Lyrics</span>
      </div>
    `;
  }

  let bodyContent = '';

  if (isLoading) {
    bodyContent = `
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
  } else if (isInstrumental) {
    bodyContent = `
      <div class="lyrics-empty-container">
        <div class="lyrics-empty-icon"><span class="material-symbols-rounded">piano</span></div>
        <h3 class="lyrics-empty-title">Instrumental Track</h3>
        <p class="lyrics-empty-desc">This song does not contain recorded vocal lyrics.</p>
      </div>
    `;
  } else if (hasSynced) {
    const curSec = Number(state.progress || 0);
    let activeIdx = 0;
    for (let i = 0; i < data.synced.length; i++) {
      if (curSec >= data.synced[i].time) activeIdx = i;
      else break;
    }

    bodyContent = `
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
  } else if (hasPlain) {
    const lines = data.plain.split('\n');
    bodyContent = `
      <div class="lyrics-plain-text">
        ${lines
          .map((line) => {
            const trimmed = line.trim();
            return trimmed ? `<p class="lyrics-plain-line">${escapeHTML(trimmed)}</p>` : `<div class="lyrics-plain-gap"></div>`;
          })
          .join('')}
      </div>
    `;
  } else {
    bodyContent = `
      <div class="lyrics-empty-container">
        <div class="lyrics-empty-icon"><span class="material-symbols-rounded">mic_off</span></div>
        <h3 class="lyrics-empty-title">No Lyrics Found</h3>
        <p class="lyrics-empty-desc">We couldn't locate synchronized lyrics for "${song ? escapeHTML(song.title) : 'this track'}" on LRCLIB.</p>
        <button class="btn btn-soft btn-sm" data-action="retry-lyrics" type="button" style="margin-top: 16px; border-radius: 9999px;">
          <span class="material-symbols-rounded">refresh</span> Try Again
        </button>
      </div>
    `;
  }

  lyricsPanel.innerHTML = `
    <div class="lyrics-panel-inner">
      <div class="lyrics-header">
        <div class="lyrics-header-left">
          <div class="lyrics-track-title">${song ? escapeHTML(song.title) : 'Lyrics'}</div>
          <div class="lyrics-track-artist">${song ? escapeHTML(song.artist || song.uploaderName || '') : ''}</div>
        </div>
        <div class="lyrics-header-actions">
          ${statusBadge}
          <button class="lyrics-close-btn" data-action="close-lyrics" type="button" aria-label="Close Lyrics" title="Close">
            <span class="material-symbols-rounded">close</span>
          </button>
        </div>
      </div>
      <div class="lyrics-body" id="lyrics-body-scroller">
        ${bodyContent}
      </div>
    </div>
  `;

  // Attach scroll tracker to respect user manual scrolling
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

  // If synced lyrics are ready, immediately align active line
  if (hasSynced) {
    setTimeout(() => {
      syncLyricsWithPlayback();
    }, 50);
  }
}
