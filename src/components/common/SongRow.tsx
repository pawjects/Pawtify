'use client';

import React from 'react';
import { Song } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';

interface SongRowProps {
  song: Song;
  index: number;
  source: string;
  playlistId?: string;
  queueOverride?: Song[];
}

export function SongRow({ song, index, source, playlistId, queueOverride }: SongRowProps) {
  const {
    currentSong,
    isPlaying,
    play,
    openArtistProfile,
    shareSpecificSong,
  } = usePlayer();

  const { isFavorite, toggleFavorite, setModal, resolveQueueForSource } = useLibrary();

  if (!song) return null;

  const active = currentSong?.id === song.id;
  const isFav = isFavorite(song.id);

  const handleRowClick = () => {
    const queue = queueOverride || resolveQueueForSource(source, playlistId, song);
    play(song, queue, true);
  };

  return (
    <div
      className={`song-row ${active ? 'active' : ''}`}
      onClick={handleRowClick}
      role="button"
      style={{ cursor: 'pointer' }}
    >
      <div className="song-index">
        {active && isPlaying ? (
          <i className="fa-solid fa-volume-high" style={{ fontSize: '0.75rem' }}></i>
        ) : (
          <span>{index}</span>
        )}
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="song-cover-sm" src={song.coverUrl} alt="" loading="lazy" />

      <div className="song-info">
        <div className="song-title">{song.title}</div>
        <div
          className="song-artist"
          onClick={(e) => {
            e.stopPropagation();
            openArtistProfile(song.artist);
          }}
        >
          {song.artist}
        </div>
      </div>

      <div className="song-duration">{song.duration || '0:00'}</div>

      <div className="song-actions">
        <button
          className={`song-action-btn ${isFav ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(song);
          }}
          type="button"
          title="Toggle Favorite"
        >
          <i className={isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}></i>
        </button>
        <button
          className="song-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            setModal({ type: 'playlistPicker', songId: song.id });
          }}
          type="button"
          title="Add to Playlist"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
        <button
          className="song-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            shareSpecificSong(song.id);
          }}
          type="button"
          title="Share Song"
        >
          <i className="fa-solid fa-share-nodes"></i>
        </button>
      </div>
    </div>
  );
}
