import { state } from '../config/config.js';
import { formatTime } from '../utils/utils.js';

let animFrameId = null;
let waveCanvas = null;
let waveCtx = null;
let containerElement = null;
let resizeObserver = null;
let currentAmp = 0;
let phase = 0;

export function initWavyProgress(container) {
  if (!container) return;
  containerElement = container;
  waveCanvas = container.querySelector('#fs-wavy-canvas');
  if (!waveCanvas) return;

  waveCtx = waveCanvas.getContext('2d');
  resizeCanvas();

  if (resizeObserver) resizeObserver.disconnect();
  resizeObserver = new ResizeObserver(() => {
    resizeCanvas();
    drawFrame();
  });
  resizeObserver.observe(container);

  startWaveLoop();
}

function resizeCanvas() {
  if (!waveCanvas || !containerElement) return;
  const rect = containerElement.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(rect.width, 10);
  const height = Math.max(rect.height, 28);

  const targetW = Math.floor(width * dpr);
  const targetH = Math.floor(height * dpr);
  if (waveCanvas.width !== targetW || waveCanvas.height !== targetH) {
    waveCanvas.width = targetW;
    waveCanvas.height = targetH;
    if (waveCtx) {
      waveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }
}

export function teardownWavyProgress() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  waveCanvas = null;
  waveCtx = null;
  containerElement = null;
}

export function updateWavyProgress() {
  if (state.fullscreenPlayer) {
    const fsContainer = document.getElementById('fs-wave-container');
    if (fsContainer && (!waveCanvas || !waveCtx || containerElement !== fsContainer)) {
      initWavyProgress(fsContainer);
    }
  }
  drawFrame();
  if (state.isPlaying && !animFrameId && state.fullscreenPlayer) {
    startWaveLoop();
  }
}

function startWaveLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loop = () => {
    if (!state.fullscreenPlayer || !waveCanvas) {
      animFrameId = null;
      return;
    }

    drawFrame();

    if (state.isPlaying) {
      if (!isReduced) {
        phase += 0.055;
      }
      animFrameId = requestAnimationFrame(loop);
    } else if (currentAmp > 0.05 && !isReduced) {
      // Smoothly settle wave to 0 when paused
      animFrameId = requestAnimationFrame(loop);
    } else {
      animFrameId = null;
    }
  };

  animFrameId = requestAnimationFrame(loop);
}

function drawFrame() {
  if (!waveCanvas || !waveCtx || !containerElement) {
    if (state.fullscreenPlayer) {
      const fsContainer = document.getElementById('fs-wave-container');
      if (fsContainer) initWavyProgress(fsContainer);
    }
    if (!waveCanvas || !waveCtx || !containerElement) return;
  }
  const rect = containerElement.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  if (W <= 0 || H <= 0) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const targetW = Math.floor(W * dpr);
  const targetH = Math.floor(H * dpr);
  if (waveCanvas.width !== targetW || waveCanvas.height !== targetH) {
    waveCanvas.width = targetW;
    waveCanvas.height = targetH;
    if (waveCtx) {
      waveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  const cy = Math.round(H / 2);
  const maxSec = Math.max(1, state.duration || state.currentSong?.durationSec || 1);
  const curSec = Math.max(0, Math.min(maxSec, state.progress || 0));
  const progressRatio = curSec / maxSec;
  const scrubX = Math.max(0, Math.min(W, progressRatio * W));

  // Keep fs-seekbar and time label synchronized with actual playback position
  const fsSeek = document.getElementById('fs-seekbar');
  if (fsSeek && !state.isSeeking) {
    fsSeek.value = String(curSec);
  }
  const fsCurrentLabel = document.getElementById('fs-time-current');
  if (fsCurrentLabel && !state.isSeeking) {
    fsCurrentLabel.textContent = formatTime(curSec);
  }

  const fsTotalLabel = document.getElementById('fs-time-total');
  if (fsTotalLabel && !state.isSeeking) {
    const remaining = Math.max(0, maxSec - curSec);
    fsTotalLabel.textContent = `-${formatTime(remaining)}`;
  }

  const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const targetAmp = (state.isPlaying && !isReduced) ? 4.5 : 0;
  currentAmp += (targetAmp - currentAmp) * 0.12;

  waveCtx.clearRect(0, 0, W, H);

  // 1. Unplayed straight track (subtle translucent line)
  if (scrubX < W) {
    waveCtx.beginPath();
    waveCtx.moveTo(scrubX, cy);
    waveCtx.lineTo(W, cy);
    waveCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    waveCtx.lineWidth = 3.5;
    waveCtx.lineCap = 'round';
    waveCtx.stroke();
  }

  // 2. Played portion: Wavy / Curved line with Muted Cyan (#83d4d7)
  if (scrubX > 0) {
    waveCtx.beginPath();
    waveCtx.moveTo(0, cy);

    if (currentAmp > 0.1 && scrubX > 8) {
      // Frequency tuned for natural gentle wave
      const freq = (Math.PI * 2) / 36;
      const step = 2;
      for (let x = 0; x <= scrubX; x += step) {
        // Taper wave slightly near scrubber and start for organic aesthetic
        const taperStart = Math.min(1, x / 12);
        const taperEnd = Math.min(1, (scrubX - x) / 12);
        const taper = Math.min(taperStart, taperEnd);
        const y = cy + Math.sin(x * freq - phase) * currentAmp * taper;
        waveCtx.lineTo(x, y);
      }
      waveCtx.lineTo(scrubX, cy);
    } else {
      waveCtx.lineTo(scrubX, cy);
    }

    waveCtx.strokeStyle = '#83d4d7';
    waveCtx.lineWidth = 3.5;
    waveCtx.lineCap = 'round';
    waveCtx.lineJoin = 'round';
    waveCtx.stroke();
  }

  // 3. Vertical Scrubber Bar (as seen in Spotify reference screenshot)
  const barW = 4;
  const barH = 18;
  const barRadius = 2;
  waveCtx.beginPath();
  if (typeof waveCtx.roundRect === 'function') {
    waveCtx.roundRect(scrubX - barW / 2, cy - barH / 2, barW, barH, barRadius);
  } else {
    waveCtx.rect(scrubX - barW / 2, cy - barH / 2, barW, barH);
  }
  waveCtx.fillStyle = '#83d4d7';
  waveCtx.fill();
}
