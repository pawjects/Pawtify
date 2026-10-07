'use client';

import React, { useRef, useEffect } from 'react';
import { usePlayer } from '@/context/PlayerContext';

export function WavyProgress() {
  const { currentSong, progress, duration, isPlaying, seekTo, setIsSeeking, setProgressLocally } =
    usePlayer();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const currentAmpRef = useRef<number>(0);

  const maxSec = Math.max(1, Math.floor(duration || currentSong?.durationSec || 1));
  const currentProgress = Math.max(0, Math.min(maxSec, progress));

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(rect.width, 100);
      const height = Math.max(rect.height, 28);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();

    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
      drawFrame();
    });
    resizeObserver.observe(container);

    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const drawFrame = () => {
      const rect = container.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;
      if (W <= 0 || H <= 0) return;

      const cy = Math.round(H / 2);
      const progressRatio = currentProgress / maxSec;
      const scrubX = Math.max(0, Math.min(W, progressRatio * W));

      const targetAmp = isPlaying && !isReduced ? 4.5 : 0;
      currentAmpRef.current += (targetAmp - currentAmpRef.current) * 0.12;

      ctx.clearRect(0, 0, W, H);

      // 1. Unplayed straight line
      if (scrubX < W) {
        ctx.beginPath();
        ctx.moveTo(scrubX, cy);
        ctx.lineTo(W, cy);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // 2. Played wavy line
      if (scrubX > 0) {
        ctx.beginPath();
        ctx.moveTo(0, cy);

        if (currentAmpRef.current > 0.1 && scrubX > 8) {
          const freq = (Math.PI * 2) / 36;
          const step = 2;
          for (let x = 0; x <= scrubX; x += step) {
            const taperStart = Math.min(1, x / 12);
            const taperEnd = Math.min(1, (scrubX - x) / 12);
            const taper = Math.min(taperStart, taperEnd);
            const y = cy + Math.sin(x * freq - phaseRef.current) * currentAmpRef.current * taper;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(scrubX, cy);
        } else {
          ctx.lineTo(scrubX, cy);
        }

        const waveGrad = ctx.createLinearGradient(0, cy, Math.max(1, scrubX), cy);
        waveGrad.addColorStop(0, '#1db954');
        waveGrad.addColorStop(1, '#1ed760');
        ctx.strokeStyle = waveGrad;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    };

    const loop = () => {
      drawFrame();
      if (isPlaying && !isReduced) {
        phaseRef.current += 0.055;
        animFrameRef.current = requestAnimationFrame(loop);
      } else if (currentAmpRef.current > 0.05 && !isReduced) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [currentProgress, isPlaying, maxSec]);

  const handleSeekInput = (e: React.FormEvent<HTMLInputElement>) => {
    setIsSeeking(true);
    const val = parseFloat((e.target as HTMLInputElement).value);
    if (!isNaN(val)) {
      setProgressLocally(val);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSeeking(false);
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      seekTo(val);
    }
  };

  return (
    <div className="fs-wave-container" id="fs-wave-container" ref={containerRef}>
      <canvas id="fs-wavy-canvas" className="fs-wavy-canvas" ref={canvasRef}></canvas>
      <input
        id="fs-seekbar"
        className="fs-seekbar fs-wave-seekbar"
        type="range"
        min="0"
        max={maxSec}
        step="0.1"
        value={currentProgress}
        onInput={handleSeekInput}
        onChange={handleSeekChange}
        aria-label="Playback progress"
      />
    </div>
  );
}
