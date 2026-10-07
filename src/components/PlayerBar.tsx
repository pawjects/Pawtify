'use client';

import React from 'react';
import { usePawtify } from '../context/PawtifyContext';
import { formatTime, DEFAULT_COVER } from '../utils/helpers';

export const PlayerBar: React.FC = () => {
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
    fullscreenPlayer,
    setFullscreenPlayer,
    queuePanel,
    setQueuePanel,
    lyricsPanel,
    setLyricsPanel,
  } = usePawtify();

  if (!currentSong) {
    return (
      <footer className="player-bar" style={{ opacity: 0.5 }}>
        <div className="player-bar-left">
          <div
            className="player-bar-cover"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <i className="fa-solid fa-music" style={{ color: 'var(--muted)' }} />
          </div>
          <div className="player-bar-info">
            <span className="player-bar-title">No track playing</span>
            <span className="player-bar-artist">Select a track to play</span>
          </div>
        </div>
      </footer>
    );
  }

  const liked = isFavorite(currentSong.id);
  const seekPercentage = duration > 0 ? (progress / duration) * 100 : 0;
  const volumePercentage = isMuted ? 0 : volume;

  return (
    <footer className="player-bar">
      {/* Left: Track Info & Heart */}
      <div className="player-bar-left">
        <img
          src={currentSong.coverUrl || DEFAULT_COVER}
          alt={currentSong.title}
          className="player-bar-cover"
          onClick={() => setFullscreenPlayer(true)}
          style={{ cursor: 'pointer' }}
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = DEFAULT_COVER;
          }}
        />
        <div className="player-bar-info">
          <span
            className="player-bar-title"
            title={currentSong.title}
            onClick={() => setFullscreenPlayer(true)}
            style={{ cursor: 'pointer' }}
          >
            {currentSong.title}
          </span>
          <span
            className="player-bar-artist"
            onClick={() => openArtistProfile(currentSong.artist)}
            title={currentSong.artist}
          >
            {currentSong.artist}
          </span>
        </div>
        <button
          className={`player-bar-like ${liked ? 'active' : ''}`}
          onClick={() => toggleFavorite(currentSong)}
          title={liked ? 'Remove from favorites' : 'Add to favorites'}
          style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          aria-label="Like"
        >
          <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
        </button>
      </div>

      {/* Center: Playback Controls & Seekbar */}
      <div className="player-bar-center">
        <div className="player-controls">
          <button
            className={`control-btn ${isShuffled ? 'shuffle-active' : ''}`}
            onClick={toggleShuffle}
            title={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
            aria-label="Shuffle"
          >
            <i className="fa-solid fa-shuffle" />
          </button>

          <button
            className="control-btn"
            onClick={prevTrack}
            title="Previous track"
            aria-label="Previous"
          >
            <i className="fa-solid fa-backward-step" />
          </button>

          <button
            className="control-btn main"
            onClick={togglePlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <i className={isPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play'} />
          </button>

          <button
            className="control-btn"
            onClick={nextTrack}
            title="Next track"
            aria-label="Next"
          >
            <i className="fa-solid fa-forward-step" />
          </button>

          <button
            className={`control-btn ${
              repeatMode !== 'none' ? 'repeat-active' : ''
            }`}
            onClick={toggleRepeat}
            title={`Repeat mode: ${repeatMode}`}
            aria-label="Repeat"
          >
            <i
              className={
                repeatMode === 'one' ? 'fa-solid fa-repeat-1' : 'fa-solid fa-repeat'
              }
            />
          </button>
        </div>

        <div className="progress-row">
          <span className="time-label">{formatTime(progress)}</span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="seekbar"
            aria-label="Seekbar"
            style={{
              background: `linear-gradient(to right, var(--green) 0%, var(--green) ${seekPercentage}%, rgba(255, 255, 255, 0.15) ${seekPercentage}%, rgba(255, 255, 255, 0.15) 100%)`,
            }}
          />
          <span className="time-label">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Right: Auxiliary Controls & Volume */}
      <div className="player-bar-right">
        <button
          className={`control-btn ${isVideoMode ? 'repeat-active' : ''}`}
          onClick={toggleVideo}
          title={isVideoMode ? 'Switch to Audio mode' : 'Switch to Video mode'}
          aria-label="Toggle Video"
        >
          <i className="fa-solid fa-video" />
        </button>

        <button
          className={`control-btn ${lyricsPanel ? 'repeat-active' : ''}`}
          onClick={() => setLyricsPanel(!lyricsPanel)}
          title="Lyrics"
          aria-label="Lyrics"
        >
          <i className="fa-solid fa-align-left" />
        </button>

        <button
          className={`control-btn ${queuePanel ? 'repeat-active' : ''}`}
          onClick={() => setQueuePanel(!queuePanel)}
          title="Queue"
          aria-label="Queue"
        >
          <i className="fa-solid fa-list-ul" />
        </button>

        <button
          className="control-btn"
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label="Volume"
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
          className="volume-slider"
          aria-label="Volume slider"
          style={{
            background: `linear-gradient(to right, var(--green) 0%, var(--green) ${volumePercentage}%, rgba(255, 255, 255, 0.15) ${volumePercentage}%, rgba(255, 255, 255, 0.15) 100%)`,
          }}
        />

        <button
          className={`control-btn ${fullscreenPlayer ? 'repeat-active' : ''}`}
          onClick={() => setFullscreenPlayer(!fullscreenPlayer)}
          title="Fullscreen Player"
          aria-label="Fullscreen"
        >
          <i className="fa-solid fa-expand" />
        </button>
      </div>
    </footer>
  );
};
