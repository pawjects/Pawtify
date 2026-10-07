'use client';

import React, { useRef } from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';

export function MiniPlayer() {
  const {
    currentSong,
    isPlaying,
    isLoading,
    progress,
    duration,
    togglePlay,
    nextTrack,
    previousTrack,
    setFullscreenPlayer,
    setQueuePanel,
  } = usePlayer();

  const { isFavorite, toggleFavorite } = useLibrary();

  const touchStartXRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  if (!currentSong) return null;

  const isFav = isFavorite(currentSong.id);
  const maxVal = Math.max(1, Math.floor(duration || currentSong.durationSec || 1));
  const progressPct = maxVal > 0 ? (progress / maxVal) * 100 : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.changedTouches[0].screenX;
    touchStartYRef.current = e.changedTouches[0].screenY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    const diffX = touchEndX - touchStartXRef.current;
    const diffY = touchEndY - touchStartYRef.current;

    // Ignore short swipes
    if (Math.abs(diffX) < 50 && Math.abs(diffY) < 50) return;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        // Swipe left -> next
        nextTrack();
      } else {
        // Swipe right -> prev
        previousTrack();
      }
    }
  };

  return (
    <div
      className="mini-player"
      id="mini-player"
      aria-label="Mini player"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="mini-player-inner">
        <div
          className="mini-player-main"
          onClick={() => setFullscreenPlayer(true)}
          style={{ cursor: 'pointer' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mini-player-cover" src={currentSong.coverUrl} alt="" />
          <div className="mini-player-info">
            <div className="mini-player-title">{currentSong.title}</div>
            <div className="mini-player-artist">{currentSong.artist}</div>
          </div>
        </div>
        <div className="mini-player-btns">
          <button
            className="mini-player-btn"
            onClick={() => setQueuePanel(true)}
            type="button"
            aria-label="Queue"
          >
            <i className="fa-solid fa-list-ul"></i>
          </button>
          <button
            className={`mini-player-btn ${isFav ? 'active' : ''}`}
            onClick={() => toggleFavorite(currentSong)}
            type="button"
            aria-label="Favorite"
            style={{ color: isFav ? 'var(--green)' : 'var(--muted)' }}
          >
            <i className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
          </button>
          <button
            className="mini-player-btn"
            onClick={togglePlay}
            type="button"
            aria-label="Play/Pause"
          >
            {isLoading ? (
              <i className="fa-solid fa-spinner fa-spin"></i>
            ) : isPlaying ? (
              <i className="fa-solid fa-pause"></i>
            ) : (
              <i className="fa-solid fa-play"></i>
            )}
          </button>
        </div>
      </div>
      <div className="mini-progress">
        <div className="mini-progress-fill" style={{ width: `${progressPct}%` }}></div>
      </div>
    </div>
  );
}
