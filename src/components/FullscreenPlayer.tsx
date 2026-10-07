'use client';

import React from 'react';
import { usePawtify } from '../context/PawtifyContext';
import { formatTime, DEFAULT_COVER } from '../utils/helpers';
import { WavyProgress } from './WavyProgress';

export const FullscreenPlayer: React.FC = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffled,
    isVideoMode,
    fullscreenPlayer,
    setFullscreenPlayer,
    togglePlayPause,
    prevTrack,
    nextTrack,
    seekTo,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    toggleVideo,
    toggleFavorite,
    isFavorite,
    openArtistProfile,
    queuePanel,
    setQueuePanel,
    lyricsPanel,
    setLyricsPanel,
    setModal,
    showToast,
  } = usePawtify();

  if (!fullscreenPlayer || !currentSong) return null;

  const liked = isFavorite(currentSong.id);
  const volumePercentage = isMuted ? 0 : volume;

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      const shareUrl = `${window.location.origin}/#song/${currentSong.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('Link copied to clipboard!');
      });
    }
  };

  return (
    <div className="fullscreen-player active">
      <div
        className="fs-backdrop"
        style={{
          backgroundImage: `url(${currentSong.coverUrl || '/assets/pawtify.png'})`,
        }}
      />

      <div className="fs-content">
        {/* Header */}
        <div className="fs-header">
          <button
            className="fs-close-btn"
            onClick={() => setFullscreenPlayer(false)}
            aria-label="Close fullscreen"
            title="Close"
          >
            <i className="fa-solid fa-chevron-down" />
          </button>

          <div
            style={{
              textAlign: 'center',
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Now Playing
          </div>

          <button
            className="fs-close-btn"
            onClick={() => setModal({ type: 'songDetails', songId: currentSong.id })}
            aria-label="Song Details"
            title="Details"
          >
            <i className="fa-solid fa-circle-info" />
          </button>
        </div>

        {/* Body */}
        <div className="fs-body">
          <div className="fs-cover-wrap">
            <img
              src={currentSong.coverUrl || DEFAULT_COVER}
              alt={currentSong.title}
              className="fs-cover"
              onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null;
                img.src = DEFAULT_COVER;
              }}
            />
          </div>

          <div className="fs-info">
            <div className="fs-text">
              <div className="fs-title" title={currentSong.title}>
                {currentSong.title}
              </div>
              <div
                className="fs-artist"
                onClick={() => {
                  setFullscreenPlayer(false);
                  openArtistProfile(currentSong.artist);
                }}
                title={currentSong.artist}
              >
                {currentSong.artist}
              </div>
            </div>

            <button
              className={`fs-heart ${liked ? 'active' : ''}`}
              onClick={() => toggleFavorite(currentSong)}
              title={liked ? 'Remove from favorites' : 'Add to favorites'}
              aria-label="Like"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
            </button>
          </div>

          {/* Progress / Waveform */}
          <div className="fs-progress">
            <div className="fs-wave-container">
              <WavyProgress
                progress={progress}
                duration={duration}
                isPlaying={isPlaying}
                onSeek={seekTo}
              />
            </div>
            <div className="fs-time">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="fs-controls">
            <button
              className={`fs-btn ${isShuffled ? 'active' : ''}`}
              onClick={toggleShuffle}
              title={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
              aria-label="Shuffle"
              style={{ color: isShuffled ? 'var(--green)' : 'var(--muted)' }}
            >
              <i className="fa-solid fa-shuffle" />
            </button>

            <button
              className="fs-btn"
              onClick={prevTrack}
              title="Previous track"
              aria-label="Previous"
            >
              <i className="fa-solid fa-backward-step" />
            </button>

            <button
              className="fs-btn fs-play"
              onClick={togglePlayPause}
              title={isPlaying ? 'Pause' : 'Play'}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <i className={isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'} />
            </button>

            <button
              className="fs-btn"
              onClick={nextTrack}
              title="Next track"
              aria-label="Next"
            >
              <i className="fa-solid fa-forward-step" />
            </button>

            <button
              className={`fs-btn ${repeatMode !== 'none' ? 'active' : ''}`}
              onClick={toggleRepeat}
              title={`Repeat: ${repeatMode}`}
              aria-label="Repeat"
              style={{
                color: repeatMode !== 'none' ? 'var(--green)' : 'var(--muted)',
              }}
            >
              <i
                className={
                  repeatMode === 'one'
                    ? 'fa-solid fa-repeat-1'
                    : 'fa-solid fa-repeat'
                }
              />
            </button>
          </div>

          {/* Volume Control */}
          <div className="fs-volume">
            <button
              onClick={toggleMute}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              <i
                className={
                  isMuted || volume === 0
                    ? 'fa-solid fa-volume-xmark'
                    : volume < 50
                    ? 'fa-solid fa-volume-low'
                    : 'fa-solid fa-volume-high'
                }
              />
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="fs-volume-slider"
              aria-label="Fullscreen volume"
              style={{
                background: `linear-gradient(to right, var(--green) 0%, var(--green) ${volumePercentage}%, rgba(255, 255, 255, 0.15) ${volumePercentage}%, rgba(255, 255, 255, 0.15) 100%)`,
              }}
            />
          </div>

          {/* Action Row */}
          <div className="fs-actions">
            <button
              className={isVideoMode ? 'active' : ''}
              onClick={toggleVideo}
              title="Toggle Video Mode"
              aria-label="Toggle Video Mode"
            >
              <i className="fa-solid fa-video" />
            </button>

            <button
              className={lyricsPanel ? 'active' : ''}
              onClick={() => setLyricsPanel(!lyricsPanel)}
              title="Lyrics"
              aria-label="Lyrics"
            >
              <i className="fa-solid fa-align-left" />
            </button>

            <button
              className={queuePanel ? 'active' : ''}
              onClick={() => setQueuePanel(!queuePanel)}
              title="Queue"
              aria-label="Queue"
            >
              <i className="fa-solid fa-list-ul" />
            </button>

            <button
              onClick={handleShare}
              title="Share track"
              aria-label="Share"
            >
              <i className="fa-solid fa-share-nodes" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
