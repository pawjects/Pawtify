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
  const width = Math.max(rect.width, 100);
  const height = Math.max(rect.height, 28);

  waveCanvas.width = Math.floor(width * dpr);
  waveCanvas.height = Math.floor(height * dpr);
  waveCanvas.style.width = `${width}px`;
  waveCanvas.style.height = `${height}px`;

  if (waveCtx) {
    waveCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    if (state.isPlaying && !isReduced) {
      phase += 0.055;
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
  if (!waveCanvas || !waveCtx || !containerElement) return;
  const rect = containerElement.getBoundingClientRect();
  const W = rect.width;
  const H = rect.height;
  if (W <= 0 || H <= 0) return;

  const cy = Math.round(H / 2);
  const maxSec = Math.max(1, state.duration || state.currentSong?.durationSec || 1);
  const curSec = Math.max(0, Math.min(maxSec, state.progress || 0));
  const progressRatio = curSec / maxSec;
  const scrubX = Math.max(0, Math.min(W, progressRatio * W));

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

  // 2. Played portion: Wavy / Curved line with Spotify Accent Green
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

    waveCtx.strokeStyle = '#1db954';
    waveCtx.lineWidth = 3.5;
    waveCtx.lineCap = 'round';
    waveCtx.lineJoin = 'round';
    waveCtx.shadowColor = 'rgba(29, 185, 84, 0.45)';
    waveCtx.shadowBlur = 6;
    waveCtx.stroke();
    waveCtx.shadowBlur = 0;
  }

  // 3. Dynamic Scrubber Bead (White circle with emerald center and glow)
  const beadRadius = state.isSeeking ? 7.5 : 6;
  waveCtx.beginPath();
  waveCtx.arc(scrubX, cy, beadRadius, 0, Math.PI * 2);
  waveCtx.fillStyle = '#ffffff';
  waveCtx.shadowColor = 'rgba(29, 185, 84, 0.8)';
  waveCtx.shadowBlur = 8;
  waveCtx.fill();

  waveCtx.beginPath();
  waveCtx.arc(scrubX, cy, beadRadius - 2.8, 0, Math.PI * 2);
  waveCtx.fillStyle = '#1db954';
  waveCtx.shadowBlur = 0;
  waveCtx.fill();
}
