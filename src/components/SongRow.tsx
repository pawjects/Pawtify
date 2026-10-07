'use client';

import React from 'react';
import { Song } from '../types';
import { usePawtify } from '../context/PawtifyContext';
import { DEFAULT_COVER } from '../utils/helpers';

interface SongRowProps {
  song: Song;
  index: number;
  source?: string;
  playlistId?: string;
  queueContext?: Song[];
}

export const SongRow: React.FC<SongRowProps> = ({
  song,
  index,
  playlistId,
  queueContext,
}) => {
  const {
    currentSong,
    isPlaying,
    playSong,
    togglePlayPause,
    toggleFavorite,
    isFavorite,
    setModal,
    openArtistProfile,
    removeSongFromPlaylist,
  } = usePawtify();

  const isCurrent = currentSong?.id === song.id;
  const liked = isFavorite(song.id);

  const handleRowClick = () => {
    if (isCurrent) {
      togglePlayPause();
    } else {
      playSong(song, queueContext, index);
    }
  };

  const handleArtistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openArtistProfile(song.artist);
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(song);
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({ type: 'playlistPicker', songId: song.id });
  };

  const handleDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({ type: 'songDetails', songId: song.id });
  };

  const handleRemoveFromPlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlistId) {
      removeSongFromPlaylist(playlistId, song.id);
    }
  };

  return (
    <div
      className={`song-row ${isCurrent ? 'active' : ''}`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') handleRowClick();
      }}
    >
      <div className="song-index">
        {isCurrent && isPlaying ? (
          <i className="fa-solid fa-volume-high" style={{ color: 'var(--green)' }} />
        ) : (
          index + 1
        )}
      </div>

      <img
        src={song.coverUrl || DEFAULT_COVER}
        alt={song.title}
        className="song-cover-sm"
        loading="lazy"
        onError={(e) => {
          const img = e.currentTarget;
          img.onerror = null;
          img.src = DEFAULT_COVER;
        }}
      />

      <div className="song-info">
        <div
          className="song-title"
          style={isCurrent ? { color: 'var(--green)' } : undefined}
          title={song.title}
        >
          {song.title}
        </div>
        <div
          className="song-artist"
          onClick={handleArtistClick}
          title={song.artist}
        >
          {song.artist}
        </div>
      </div>

      <div className="song-duration">{song.duration || '3:00'}</div>

      <div className="song-actions" onClick={(e) => e.stopPropagation()}>
        <button
          className={`song-action-btn ${liked ? 'active' : ''}`}
          onClick={handleLikeClick}
          title={liked ? 'Remove from favorites' : 'Add to favorites'}
          aria-label="Like"
        >
          <i className={liked ? 'fa-solid fa-heart' : 'fa-regular fa-heart'} />
        </button>

        {playlistId && (
          <button
            className="song-action-btn"
            onClick={handleRemoveFromPlaylist}
            title="Remove from playlist"
            aria-label="Remove from playlist"
          >
            <i className="fa-solid fa-trash-can" />
          </button>
        )}

        <button
          className="song-action-btn"
          onClick={handleDetailsClick}
          title="Song Details"
          aria-label="Song Details"
        >
          <i className="fa-solid fa-circle-info" />
        </button>

        <button
          className="song-action-btn"
          onClick={handleOptionsClick}
          title="Add to playlist"
          aria-label="Add to playlist"
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>
    </div>
  );
};
