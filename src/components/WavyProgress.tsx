'use client';

import React, { useRef, useEffect } from 'react';
import { formatTime } from '../utils/helpers';

interface WavyProgressProps {
  progress: number;
  duration: number;
  isPlaying: boolean;
  onSeek: (seconds: number) => void;
}

export const WavyProgress: React.FC<WavyProgressProps> = ({
  progress,
  duration,
  isPlaying,
  onSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isActive = true;

    const render = () => {
      if (!isActive) return;

      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const width = rect.width;
      const height = rect.height;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const ratio = duration > 0 ? Math.min(1, Math.max(0, progress / duration)) : 0;
      const playedWidth = width * ratio;

      if (isPlaying) {
        phaseRef.current += 0.08;
      }

      const centerY = height / 2;
      const amp = isPlaying ? 5 : 2;
      const freq = 0.04;

      // Draw background unplayed wave track
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      for (let x = 0; x <= width; x += 3) {
        const y = centerY + Math.sin(x * freq + phaseRef.current * 0.5) * 1.5;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Draw played wavy line
      if (playedWidth > 0) {
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x <= playedWidth; x += 2) {
          const y = centerY + Math.sin(x * freq + phaseRef.current) * amp;
          ctx.lineTo(x, y);
        }
        ctx.strokeStyle = '#1db954';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw glowing seeker thumb
        const currentY =
          centerY + Math.sin(playedWidth * freq + phaseRef.current) * amp;
        ctx.beginPath();
        ctx.arc(playedWidth, currentY, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#1db954';
        ctx.shadowBlur = 10;
        ctx.fill();
      }

      ctx.restore();

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      isActive = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [progress, duration, isPlaying]);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        className="fs-wavy-canvas"
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={progress}
        onChange={(e) => onSeek(Number(e.target.value))}
        className="fs-wave-seekbar"
        aria-label="Seek waveform"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0,
          cursor: 'pointer',
          zIndex: 4,
          margin: 0,
        }}
      />
    </div>
  );
};
