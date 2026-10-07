'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';
import { SongRow } from '@/components/common/SongRow';
import { SongRowSkeleton } from '@/components/common/Cards';

export function ArtistProfileModal() {
  const { artistProfile, closeArtistProfile, play } = usePlayer();

  if (!artistProfile) return null;

  const handlePlayFirst = () => {
    if (artistProfile.songs && artistProfile.songs.length > 0) {
      play(artistProfile.songs[0], artistProfile.songs, true);
    }
  };

  const handleShuffle = () => {
    if (artistProfile.songs && artistProfile.songs.length > 0) {
      const shuffled = [...artistProfile.songs].sort(() => Math.random() - 0.5);
      play(shuffled[0], shuffled, true);
    }
  };

  return (
    <div className="artist-profile active" id="artist-profile">
      <div className="artist-hero">
        <button
          className="artist-hero-back"
          onClick={closeArtistProfile}
          type="button"
          aria-label="Back"
        >
          <i className="fa-solid fa-chevron-down"></i>
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="artist-hero-img"
          src={artistProfile.imageUrl || '/assets/pawtify.png'}
          alt={artistProfile.name}
        />
        <div className="artist-hero-name">{artistProfile.name}</div>
        <div className="artist-hero-meta">
          {artistProfile.type || 'Artist'} • {artistProfile.songs?.length || 0} songs
        </div>
        <div className="artist-hero-actions">
          <button className="btn-play" onClick={handlePlayFirst} type="button">
            <i className="fa-solid fa-play"></i>
          </button>
          <button className="btn-icon" onClick={handleShuffle} type="button">
            <i className="fa-solid fa-shuffle"></i>
          </button>
        </div>
      </div>

      <div className="artist-section">
        <h3>
          <i className="fa-solid fa-music" style={{ marginRight: '8px', color: 'var(--green)' }}></i>
          Popular
        </h3>
        <div className="song-table">
          {artistProfile.loading ? (
            <div style={{ padding: '0 24px' }}>
              {Array(6)
                .fill('')
                .map((_, i) => (
                  <SongRowSkeleton key={i} />
                ))}
            </div>
          ) : artistProfile.songs && artistProfile.songs.length > 0 ? (
            artistProfile.songs.map((s, i) => (
              <SongRow
                key={s.id + i}
                song={s}
                index={i + 1}
                source="artist"
                queueOverride={artistProfile.songs}
              />
            ))
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-music"></i>
              <h2>No songs found</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
