'use client';

import React, { useRef } from 'react';
import { usePawtify } from '../context/PawtifyContext';
import { DEFAULT_COVER } from '../utils/helpers';

export const MiniPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    togglePlayPause,
    pause,
    nextTrack,
    prevTrack,
    toggleFavorite,
    isFavorite,
    setFullscreenPlayer,
  } = usePawtify();

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  if (!currentSong) return null;

  const liked = isFavorite(currentSong.id);
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Detect swipe up (open fullscreen)
    if (diffY < -50 && Math.abs(diffX) < 60) {
      setFullscreenPlayer(true);
      return;
    }
    // Detect horizontal swipes (next / prev track)
    if (Math.abs(diffX) > 60 && Math.abs(diffY) < 50) {
      if (diffX < 0) {
        nextTrack();
      } else {
        prevTrack();
      }
    }
  };

  return (
    <div
      className="mini-player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mini-player-inner">
        <div
          className="mini-player-main"
          onClick={() => setFullscreenPlayer(true)}
          role="button"
          tabIndex={0}
        >
          <img
            src={currentSong.coverUrl || DEFAULT_COVER}
            alt={currentSong.title}
            className="mini-player-cover"
            onError={(e) => {
              const img = e.currentTarget;
              img.onerror = null;
              img.src = DEFAULT_COVER;
            }}
          />
          <div className="mini-player-info">
            <span className="mini-player-title">{currentSong.title}</span>
            <span className="mini-player-artist">{currentSong.artist}</span>
          </div>
        </div>

        <div className="mini-player-btns" onClick={(e) => e.stopPropagation()}>
          <button
            className="mini-player-btn mini-player-play-btn"
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <i className={isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'} />
          </button>
          <button
            className="mini-player-btn mini-player-dismiss-btn"
            onClick={() => pause()}
            title="Close player"
            aria-label="Close player"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>

      <div className="mini-progress">
        <div
          className="mini-progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};
