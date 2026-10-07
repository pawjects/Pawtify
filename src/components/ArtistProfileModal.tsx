'use client';

import React from 'react';
import { usePawtify } from '../context/PawtifyContext';
import { SongRow } from './SongRow';
import { DEFAULT_COVER } from '../utils/helpers';

export const ArtistProfileModal: React.FC = () => {
  const {
    artistProfile,
    closeArtistProfile,
    playSong,
    toggleShuffle,
  } = usePawtify();

  if (!artistProfile) return null;

  const handlePlayAll = () => {
    if (artistProfile.songs.length > 0) {
      playSong(artistProfile.songs[0], artistProfile.songs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (artistProfile.songs.length > 0) {
      toggleShuffle();
      const rand = Math.floor(Math.random() * artistProfile.songs.length);
      playSong(artistProfile.songs[rand], artistProfile.songs, rand);
    }
  };

  return (
    <div className={`artist-profile ${artistProfile ? 'active' : ''}`}>
      <div className="artist-hero">
        <button
          className="artist-hero-back"
          onClick={closeArtistProfile}
          aria-label="Back"
          title="Back"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-chevron-left" />
        </button>

        <img
          src={artistProfile.imageUrl || DEFAULT_COVER}
          alt={artistProfile.name}
          className="artist-hero-img"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = DEFAULT_COVER;
          }}
        />

        <h1 className="artist-hero-name">{artistProfile.name}</h1>
        <div className="artist-hero-meta">
          {artistProfile.loading
            ? 'Fetching catalog...'
            : `${artistProfile.songs.length} top releases`}
        </div>

        {artistProfile.songs.length > 0 && (
          <div className="artist-hero-actions">
            <button
              className="btn-primary"
              onClick={handlePlayAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '999px',
                background: 'var(--green)',
                color: '#000',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-play" />
              <span>Play All</span>
            </button>

            <button
              className="btn-secondary"
              onClick={handleShufflePlay}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'var(--text)',
                fontWeight: 600,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
              }}
            >
              <i className="fa-solid fa-shuffle" />
              <span>Shuffle</span>
            </button>
          </div>
        )}
      </div>

      <div className="artist-section">
        <h3>Popular Tracks</h3>
        {artistProfile.loading ? (
          <div
            style={{
              padding: '30px',
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '8px' }} />
            Loading tracks...
          </div>
        ) : (
          artistProfile.songs.map((song, index) => (
            <SongRow
              key={song.id}
              song={song}
              index={index}
              queueContext={artistProfile.songs}
            />
          ))
        )}
      </div>
    </div>
  );
};
