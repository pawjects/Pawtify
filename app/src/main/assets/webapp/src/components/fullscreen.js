import { state, STORAGE, showToast, globals } from '../config/config.js';
import { fullscreenPlayer } from '../config/dom.js';
import { escapeHTML, formatTime, saveJSON, getOptimizedArtwork } from '../utils/utils.js';
import { renderCurrentRoute } from './master.js';
import { play, pause, togglePlay, previousTrack, nextTrack, toggleShuffle, toggleRepeat, setVolume } from './player.js';
import {
  initWavyProgress,
  teardownWavyProgress,
  updateWavyProgress,
} from './wavyProgress.js';
import { getExactAudioQuality, getNativeAudio } from '../services/youtube.js';
import { closeFullscreenPlayer, openLyricsPanel, openQueuePanel } from '../core/navigationHistory.js';
import { refreshPlaybackUI } from './playerBar.js';
import { renderLyricsViewHTML, attachLyricsScrollerListeners } from './lyrics.js';
import { fetchLyricsForSong, syncLyricsWithPlayback } from '../services/lyricsService.js';

let gesturesInitialized = false;
let touchStartY = 0;
let currentDeltaY = 0;
let isTrackingSwipe = false;
let gestureStartTime = 0;
let sleepTimerId = null;

/**
 * Initializes direct swipe-to-dismiss touch gesture tracking on the fullscreen player.
 * - Tracks Y-axis touch movement 1:1 with transform: translateY
 * - When swipe distance > 100px threshold on touchend, smoothly collapses to Miniplayer
 * - Otherwise snaps back to fullscreen with fluid cubic-bezier curve
 */
function initFullscreenGestures() {
  if (!fullscreenPlayer || gesturesInitialized) return;
  gesturesInitialized = true;

  fullscreenPlayer.addEventListener(
    'touchstart',
    (e) => {
      if (!state.fullscreenPlayer || e.touches.length !== 1) return;

      const target = e.target;
      if (
        target.closest(
          'button, input, select, textarea, .fs-seekbar, .player-more-sheet, .player-more-backdrop, a'
        )
      ) {
        isTrackingSwipe = false;
        return;
      }

      const lyricsScroller = target.closest('#lyrics-body-scroller');
      if (lyricsScroller && lyricsScroller.scrollTop > 4) {
        isTrackingSwipe = false;
        return;
      }

      if (fullscreenPlayer.scrollTop > 4) {
        isTrackingSwipe = false;
        return;
      }

      touchStartY = e.touches[0].clientY;
      currentDeltaY = 0;
      isTrackingSwipe = true;
      gestureStartTime = Date.now();
    },
    { passive: true }
  );

  fullscreenPlayer.addEventListener(
    'touchmove',
    (e) => {
      if (!isTrackingSwipe || !state.fullscreenPlayer || !e.touches.length) return;
      const clientY = e.touches[0].clientY;
      const deltaY = clientY - touchStartY;

      if (deltaY > 0) {
        if (e.cancelable) e.preventDefault();
        currentDeltaY = deltaY;

        fullscreenPlayer.style.transition = 'none';
        fullscreenPlayer.style.transform = `translateY(${deltaY}px)`;

        const windowH = window.innerHeight || 800;
        const progress = Math.min(deltaY / (windowH * 0.75), 1);
        fullscreenPlayer.style.opacity = `${Math.max(0.35, 1 - progress * 0.55)}`;
      } else {
        fullscreenPlayer.style.transform = 'translateY(0)';
        currentDeltaY = 0;
      }
    },
    { passive: false }
  );

  fullscreenPlayer.addEventListener(
    'touchend',
    () => {
      if (!isTrackingSwipe || !state.fullscreenPlayer) return;
      isTrackingSwipe = false;

      const elapsed = Math.max(1, Date.now() - gestureStartTime);
      const velocityY = currentDeltaY / elapsed;
      const threshold = 100;
      const shouldDismiss = currentDeltaY > threshold || (currentDeltaY > 35 && velocityY > 0.35);

      if (shouldDismiss) {
        fullscreenPlayer.style.transition =
          'transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.28s cubic-bezier(0.2, 0, 0, 1)';
        fullscreenPlayer.style.transform = 'translateY(100%)';
        fullscreenPlayer.style.opacity = '0';

        setTimeout(() => {
          fullscreenPlayer.style.transform = '';
          fullscreenPlayer.style.opacity = '';
          fullscreenPlayer.style.transition = '';
          closeFullscreenPlayer();
        }, 300);
      } else {
        fullscreenPlayer.style.transition =
          'transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.28s cubic-bezier(0.2, 0, 0, 1)';
        fullscreenPlayer.style.transform = 'translateY(0)';
        fullscreenPlayer.style.opacity = '1';

        setTimeout(() => {
          fullscreenPlayer.style.transform = '';
          fullscreenPlayer.style.opacity = '';
          fullscreenPlayer.style.transition = '';
        }, 300);
      }
      currentDeltaY = 0;
    },
    { passive: true }
  );

  fullscreenPlayer.addEventListener('touchcancel', () => {
    if (!isTrackingSwipe) return;
    isTrackingSwipe = false;
    fullscreenPlayer.style.transition =
      'transform 0.3s cubic-bezier(0.2, 0, 0, 1), opacity 0.28s cubic-bezier(0.2, 0, 0, 1)';
    fullscreenPlayer.style.transform = 'translateY(0)';
    fullscreenPlayer.style.opacity = '1';
    setTimeout(() => {
      fullscreenPlayer.style.transform = '';
      fullscreenPlayer.style.opacity = '';
      fullscreenPlayer.style.transition = '';
    }, 300);
    currentDeltaY = 0;
  });
}

/**
 * Renders the full-screen player matching the Spotify-inspired AMOLED design:
 * - Maximized album artwork to a large, rounded-corner square
 * - Wavy line progress bar with negative remaining time
 * - Redesigned Play/Pause button: prominent solid green squircle flanked by circular Next/Previous
 * - Bottom row with pill-shaped toggle buttons for Speed, Lyrics, and Queue
 */
export function renderFullscreenPlayer(force = false) {
  if (!fullscreenPlayer) return;
  initFullscreenGestures();

  if (!state.currentSong || !state.fullscreenPlayer) {
    teardownWavyProgress();
    fullscreenPlayer.classList.remove('active');
    document.body.classList.remove('has-fullscreen-open');
    closePlayerMoreSheet();
    return;
  }

  fullscreenPlayer.classList.add('active');
  document.body.classList.add('has-fullscreen-open');
  const song = state.currentSong;

  const isLyricsActive = Boolean(state.lyricsPanel);
  const isLyricsModeMatch = fullscreenPlayer.dataset.lyricsActive === String(isLyricsActive);
  if (
    !force &&
    isLyricsModeMatch &&
    fullscreenPlayer.dataset.renderedTrackId === String(song.id) &&
    fullscreenPlayer.querySelector('.fs-title')
  ) {
    const waveContainer = fullscreenPlayer.querySelector('#fs-wave-container');
    if (waveContainer) {
      initWavyProgress(waveContainer);
    }
    updateWavyProgress();
    return;
  }
  fullscreenPlayer.dataset.renderedTrackId = String(song.id);
  fullscreenPlayer.dataset.lyricsActive = String(isLyricsActive);

  const isFav = state.favorites.some((item) => item.id === song.id);
  const fsMax = Math.max(1, Math.floor(state.duration || song.durationSec || 1));
  const curProgress = Math.max(0, Math.min(fsMax, state.progress || 0));
  const curVolume = typeof state.volume === 'number' ? Math.max(0, Math.min(1, state.volume)) : 0.7;
  const volPct = Math.round(curVolume * 100);
  const speedLabel = state.playbackRate ? `${state.playbackRate}x` : '1x';

  const repeatIcon =
    state.repeatMode === 'one'
      ? 'repeat_one'
      : 'repeat';
  const repeatActive = state.repeatMode !== 'none' ? 'active' : '';
  const shuffleActive = state.shuffleMode ? 'active' : '';

  const displayCoverOrLyricsHTML = isLyricsActive
    ? `<div class="fs-cover-wrap fs-lyrics-mode" id="fs-cover-area">${renderLyricsViewHTML(song)}</div>`
    : `<div class="fs-cover-wrap" id="fs-cover-area">
         <img class="fs-cover" src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 720))}" alt="${escapeHTML(song.title)}" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
       </div>`;

  fullscreenPlayer.innerHTML = `
     <div class="fs-content">
       <div class="fs-header">
         <button class="fs-extra-btn fs-kebab-btn" data-action="open-player-more-sheet" type="button" aria-label="More options" title="More options">
           <span class="material-symbols-rounded">more_vert</span>
         </button>
       </div>

       <div class="fs-body">
         ${displayCoverOrLyricsHTML}

         <div class="fs-info">
           <div class="fs-text">
             <div class="fs-title">${escapeHTML(song.title)}</div>
             <div class="fs-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
           </div>
           <button class="fs-heart ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Favorite">
             <span class="material-symbols-rounded ${isFav ? 'filled' : ''}">${isFav ? 'favorite' : 'favorite'}</span>
           </button>
         </div>

         <div class="fs-progress">
           <div class="fs-wave-container" id="fs-wave-container">
             <canvas id="fs-wavy-canvas" class="fs-wavy-canvas"></canvas>
             <input id="fs-seekbar" class="fs-seekbar fs-wave-seekbar" type="range" min="0" max="${fsMax}" step="0.1" value="${curProgress}" aria-label="Playback progress" />
           </div>
           <div class="fs-time">
             <span id="fs-time-current">${formatTime(curProgress)}</span>
             <span id="fs-time-total">${formatTime(fsMax)}</span>
           </div>
         </div>

         <!-- Redesigned Spotify Player Controls -->
         <div class="fs-controls-spotify">
           <button class="fs-extra-btn ${shuffleActive}" data-action="toggle-shuffle" type="button" aria-label="Shuffle">
             <span class="material-symbols-rounded">shuffle</span>
           </button>
           <button class="fs-nav-circle-btn" data-action="prev-track" type="button" aria-label="Previous">
             <span class="material-symbols-rounded">skip_previous</span>
           </button>
           <button class="fs-play-btn-accent fs-play-btn-cyan" data-action="toggle-play" type="button" aria-label="Play/Pause">
             ${state.isLoading ? '<span class="material-symbols-rounded play-loading-spinner">progress_activity</span>' : (state.isPlaying ? '<span class="material-symbols-rounded">pause</span>' : '<span class="material-symbols-rounded">play_arrow</span>')}
           </button>
           <button class="fs-nav-circle-btn" data-action="next-track" type="button" aria-label="Next">
             <span class="material-symbols-rounded">skip_next</span>
           </button>
           <button class="fs-extra-btn ${repeatActive}" data-action="toggle-repeat" type="button" aria-label="Repeat">
             <span class="material-symbols-rounded">${repeatIcon}</span>
           </button>
         </div>

         <!-- Pill-shaped Toggle Row: Speed, Lyrics, Queue -->
         <div class="fs-pills-row">
           <button class="fs-pill-btn" data-action="toggle-speed" type="button" aria-label="Playback speed">
             <span class="material-symbols-rounded">speed</span>
             <span id="fs-speed-label">${speedLabel}</span>
           </button>
           <button class="fs-pill-btn ${state.lyricsPanel ? 'active' : ''}" data-action="open-lyrics" type="button" aria-label="Lyrics">
             <span class="material-symbols-rounded">lyrics</span>
             <span>Lyrics</span>
           </button>
           <button class="fs-pill-btn ${state.queuePanel ? 'active' : ''}" data-action="open-queue" type="button" aria-label="Queue">
             <span class="material-symbols-rounded">queue_music</span>
             <span>Queue</span>
           </button>
         </div>

         <!-- Compact MD3 Volume Control Slider -->
         <div class="fs-volume-row">
           <button class="fs-volume-btn" data-action="fs-volume-down" type="button" aria-label="Lower volume" title="Mute / Lower volume">
             <span class="material-symbols-rounded">volume_down</span>
           </button>
           <input
             id="fs-volume-slider"
             class="fs-volume-slider"
             type="range"
             min="0"
             max="1"
             step="0.01"
             value="${curVolume}"
             style="background: linear-gradient(90deg, #1DB954 0%, #1DB954 ${volPct}%, #1E1E1E ${volPct}%);"
             aria-label="Volume slider"
           />
           <button class="fs-volume-btn" data-action="fs-volume-up" type="button" aria-label="Increase volume" title="Increase volume">
             <span class="material-symbols-rounded">volume_up</span>
           </button>
         </div>
       </div>
     </div>
   `;

  const waveContainer = fullscreenPlayer.querySelector('#fs-wave-container');
  if (waveContainer) {
    initWavyProgress(waveContainer);
  }

  if (isLyricsActive) {
    if ((!state.lyricsData || state.lyricsData.songId !== song.id) && !state.lyricsLoading) {
      fetchLyricsForSong(song);
    }
    attachLyricsScrollerListeners();
    if (state.lyricsData?.hasSynced) {
      setTimeout(() => {
        syncLyricsWithPlayback();
      }, 50);
    }
  }

  const fsVolSlider = fullscreenPlayer.querySelector('#fs-volume-slider');
  if (fsVolSlider) {
    const handleVolumeInput = (e) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
        setVolume(val);
        const audio = getNativeAudio();
        if (audio) audio.volume = val;
        const pct = Math.round(val * 100);
        fsVolSlider.style.background = `linear-gradient(90deg, #1DB954 0%, #1DB954 ${pct}%, #1E1E1E ${pct}%)`;
      }
    };
    fsVolSlider.addEventListener('input', handleVolumeInput);
    fsVolSlider.addEventListener('change', handleVolumeInput);
  }
}

/**
 * 3-Dot Options Menu Bottom Sheet
 * Matches Screenshot 4 with top cards (Start radio, Source, AOD Mode) and grid of rounded pill/tile buttons
 */
export function openPlayerMoreSheet() {
  const song = state.currentSong;
  if (!song) return;

  let sheetRoot = document.getElementById('player-more-sheet-root');
  if (!sheetRoot) {
    sheetRoot = document.createElement('div');
    sheetRoot.id = 'player-more-sheet-root';
    document.body.appendChild(sheetRoot);
  }

  const isSaved = state.favorites.some((item) => item.id === song.id);

  sheetRoot.innerHTML = `
    <div class="player-more-backdrop" id="player-more-backdrop" data-action="close-player-more-sheet"></div>
    <div class="player-more-sheet" id="player-more-sheet" role="dialog" aria-modal="true" aria-label="Playback options">
      <div class="player-more-handle"></div>
      
      <!-- Track Header -->
      <div class="player-more-header">
        <img class="player-more-thumb" src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 160))}" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <div class="player-more-info">
          <div class="player-more-title">${escapeHTML(song.title)}</div>
          <div class="player-more-artist">${escapeHTML(song.artist)}</div>
        </div>
        <div class="player-more-header-actions">
          <button class="player-more-icon-btn ${isSaved ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="Save song">
            <span class="material-symbols-rounded ${isSaved ? 'filled' : ''}">${isSaved ? 'bookmark' : 'bookmark_border'}</span>
          </button>
          <button class="player-more-icon-btn" data-action="share-song" type="button" aria-label="Share song">
            <span class="material-symbols-rounded">share</span>
          </button>
        </div>
      </div>

      <!-- Top 3 Square/Pill Cards -->
      <div class="player-more-top-cards">
        <button class="player-more-card" data-action="start-song-radio" type="button">
          <div class="player-more-card-icon"><span class="material-symbols-rounded">radio</span></div>
          <span>Start radio</span>
        </button>
        <button class="player-more-card" data-action="open-song-details" type="button">
          <div class="player-more-card-icon"><span class="material-symbols-rounded">tune</span></div>
          <span>Source</span>
        </button>
        <button class="player-more-card" data-action="open-sleep-timer-menu" type="button">
          <div class="player-more-card-icon"><span class="material-symbols-rounded">bedtime</span></div>
          <span>AOD Mode</span>
        </button>
      </div>

      <!-- 2-Column Grid of Styled Rounded Pill/Tile Action Buttons -->
      <div class="player-more-grid">
        <button class="player-more-grid-btn" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button">
          <div class="player-more-grid-icon"><span class="material-symbols-rounded">playlist_add_check</span></div>
          <div class="player-more-grid-text">
            <span class="player-more-grid-title">Add to playlist</span>
          </div>
        </button>

        <button class="player-more-grid-btn" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}" type="button">
          <div class="player-more-grid-icon"><span class="material-symbols-rounded">person</span></div>
          <div class="player-more-grid-text">
            <span class="player-more-grid-title">View artist</span>
            <span class="player-more-grid-sub">${escapeHTML(song.artist)}</span>
          </div>
        </button>

        <button class="player-more-grid-btn" data-action="download-song" type="button">
          <div class="player-more-grid-icon"><span class="material-symbols-rounded">download</span></div>
          <div class="player-more-grid-text">
            <span class="player-more-grid-title">Download</span>
          </div>
        </button>

        <button class="player-more-grid-btn" data-action="open-equalizer" type="button">
          <div class="player-more-grid-icon"><span class="material-symbols-rounded">equalizer</span></div>
          <div class="player-more-grid-text">
            <span class="player-more-grid-title">Equalizer</span>
          </div>
        </button>
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const backdrop = document.getElementById('player-more-backdrop');
    const sheet = document.getElementById('player-more-sheet');
    if (backdrop) backdrop.classList.add('active');
    if (sheet) sheet.classList.add('active');
  });
}

/**
 * Closes the 3-dot Bottom Sheet modal with smooth exit animation
 */
export function closePlayerMoreSheet() {
  const backdrop = document.getElementById('player-more-backdrop');
  const sheet = document.getElementById('player-more-sheet');
  if (backdrop) backdrop.classList.remove('active');
  if (sheet) sheet.classList.remove('active');

  setTimeout(() => {
    const sheetRoot = document.getElementById('player-more-sheet-root');
    if (sheetRoot) {
      sheetRoot.innerHTML = '';
    }
  }, 320);
}

/**
 * Renders the Sleep Timer selection menu inside the Bottom Sheet
 */
export function openSleepTimerMenu() {
  const sheet = document.getElementById('player-more-sheet');
  if (!sheet) return;

  sheet.innerHTML = `
    <div class="player-more-handle"></div>
    <div class="player-more-header" style="justify-content: space-between;">
      <button class="player-more-back-btn" data-action="open-player-more-sheet" type="button" aria-label="Back" style="background:none;border:none;color:#fff;font-size:1.1rem;cursor:pointer;padding:6px 8px;">
        <span class="material-symbols-rounded">arrow_back</span>
      </button>
      <div style="font-weight:700;font-size:0.95rem;color:#fff;">Sleep Timer (AOD)</div>
      <div style="width:28px;"></div>
    </div>

    <div class="player-more-options-list">
      <button class="player-more-item ${!state.sleepTimer ? 'active' : ''}" data-action="set-sleep-timer" data-minutes="0" type="button">
        <span class="material-symbols-rounded">block</span>
        <span>Turn off timer</span>
      </button>

      <button class="player-more-item ${state.sleepTimerMinutes === 15 ? 'active' : ''}" data-action="set-sleep-timer" data-minutes="15" type="button">
        <span class="material-symbols-rounded">schedule</span>
        <span>15 minutes</span>
      </button>

      <button class="player-more-item ${state.sleepTimerMinutes === 30 ? 'active' : ''}" data-action="set-sleep-timer" data-minutes="30" type="button">
        <span class="material-symbols-rounded">schedule</span>
        <span>30 minutes</span>
      </button>

      <button class="player-more-item ${state.sleepTimerMinutes === 45 ? 'active' : ''}" data-action="set-sleep-timer" data-minutes="45" type="button">
        <span class="material-symbols-rounded">schedule</span>
        <span>45 minutes</span>
      </button>

      <button class="player-more-item ${state.sleepTimerMinutes === 60 ? 'active' : ''}" data-action="set-sleep-timer" data-minutes="60" type="button">
        <span class="material-symbols-rounded">schedule</span>
        <span>1 hour</span>
      </button>

      <button class="player-more-item ${state.sleepAtEndOfTrack ? 'active' : ''}" data-action="set-sleep-timer" data-minutes="end-of-track" type="button">
        <span class="material-symbols-rounded">skip_next</span>
        <span>End of current track</span>
      </button>
    </div>
  `;
}

/**
 * Applies the sleep timer configuration
 */
export function setSleepTimer(minutes) {
  if (sleepTimerId) {
    clearTimeout(sleepTimerId);
    sleepTimerId = null;
  }
  state.sleepTimer = false;
  state.sleepAtEndOfTrack = false;
  state.sleepTimerMinutes = null;

  if (minutes === 0 || minutes === '0' || minutes === 'off') {
    showToast('Sleep timer turned off');
    closePlayerMoreSheet();
    return;
  }

  if (minutes === 'end-of-track') {
    state.sleepAtEndOfTrack = true;
    state.sleepTimer = true;
    showToast('Music will stop after current track');
    closePlayerMoreSheet();
    return;
  }

  const mins = parseInt(minutes, 10);
  if (!mins || isNaN(mins)) return;

  state.sleepTimer = true;
  state.sleepTimerMinutes = mins;
  showToast(`Sleep timer set for ${mins} minutes`);

  sleepTimerId = setTimeout(() => {
    pause();
    state.sleepTimer = false;
    state.sleepTimerMinutes = null;
    showToast('Sleep timer ended playback');
    refreshPlaybackUI();
  }, mins * 60 * 1000);

  closePlayerMoreSheet();
}

/**
 * Toggles playback speed between 1x, 1.25x, 1.5x, 2x, 0.75x
 */
export function togglePlaybackSpeed() {
  const speeds = [1, 1.25, 1.5, 2, 0.75];
  const current = state.playbackRate || 1;
  const currentIdx = speeds.indexOf(current);
  const nextSpeed = speeds[(currentIdx + 1) % speeds.length];
  state.playbackRate = nextSpeed;

  if (globals.ytPlayer && typeof globals.ytPlayer.setPlaybackRate === 'function') {
    try {
      globals.ytPlayer.setPlaybackRate(nextSpeed);
    } catch (e) {}
  }
  const audio = document.getElementById('pawtify-native-audio');
  if (audio) {
    audio.playbackRate = nextSpeed;
  }

  showToast(`Speed: ${nextSpeed}x`);
  const label = document.getElementById('fs-speed-label');
  if (label) label.textContent = `${nextSpeed}x`;
}

export async function playYTPlaylist(playlistId) {
  state.isLoading = true;
  renderCurrentRoute();
  try {
    const res = await fetch(`/api/search?type=playlist_videos&q=${playlistId}`);
    const data = await res.json();
    if (data.items && data.items.length > 0) {
      const firstSong = data.items[0];
      state.queue = data.items;
      saveJSON(STORAGE.QUEUE, state.queue);
      await play(firstSong, data.items, true);
    } else {
      showToast('Playlist is empty or could not be loaded.');
    }
  } catch (e) {
    showToast('Error loading playlist.');
  }
  state.isLoading = false;
  renderCurrentRoute();
}

export function toggleSongInfoOverlay() {
  state.showSongInfoOverlay = !state.showSongInfoOverlay;
  const overlay = document.getElementById('fs-song-info-overlay');
  if (overlay) {
    overlay.classList.toggle('active', Boolean(state.showSongInfoOverlay));
  } else {
    renderFullscreenPlayer(true);
  }
}
