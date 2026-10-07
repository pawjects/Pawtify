'use client';

import React from 'react';
import { Song, Playlist, Artist } from '@/types/music';
import { usePlayer } from '@/context/PlayerContext';
import { useLibrary } from '@/context/LibraryContext';

export function HomeGridCard({
  song,
  source,
  playlistId = '',
}: {
  song: Song;
  source: string;
  playlistId?: string;
}) {
  const { play } = usePlayer();
  const { resolveQueueForSource } = useLibrary();

  if (!song) return null;

  const handleClick = () => {
    const queue = resolveQueueForSource(source, playlistId, song);
    play(song, queue, true);
  };

  return (
    <article
      className="home-grid-card"
      onClick={handleClick}
      role="button"
      style={{ cursor: 'pointer' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={song.coverUrl} alt={song.title} loading="lazy" />
      <span>{song.title}</span>
    </article>
  );
}

export function HomeScrollCard({
  song,
  source,
  playlistId = '',
}: {
  song: Song;
  source: string;
  playlistId?: string;
}) {
  const { play } = usePlayer();
  const { resolveQueueForSource } = useLibrary();

  if (!song) return null;

  const handleClick = () => {
    const queue = resolveQueueForSource(source, playlistId, song);
    play(song, queue, true);
  };

  return (
    <article
      className="home-scroll-card"
      onClick={handleClick}
      role="button"
      style={{ cursor: 'pointer' }}
    >
      <div className="scroll-cover-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={song.coverUrl} alt={song.title} loading="lazy" />
      </div>
      <h3>{song.title}</h3>
      <p>{song.artist}</p>
    </article>
  );
}

export function PlaylistCard({ playlist }: { playlist: Playlist }) {
  const { navigate } = useLibrary();
  const { play } = usePlayer();

  const coverUrl =
    playlist.coverUrl ||
    (playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0].coverUrl
      : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300');

  const handlePlayAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (playlist.songs && playlist.songs.length > 0) {
      play(playlist.songs[0], playlist.songs, true);
    }
  };

  return (
    <div
      className="card"
      onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.id)}`)}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={playlist.name} loading="lazy" />
        <button
          className="card-play-btn"
          onClick={handlePlayAll}
          type="button"
          aria-label={`Play ${playlist.name}`}
        >
          <i className="fa-solid fa-play"></i>
        </button>
      </div>
      <div className="card-title">{playlist.name}</div>
      <div className="card-meta">
        {playlist.isSystem
          ? 'System Playlist'
          : `${playlist.songs ? playlist.songs.length : 0} songs`}
      </div>
    </div>
  );
}

export function PlaylistSearchCard({
  playlist,
  onOpen,
}: {
  playlist: Playlist;
  onOpen: (playlist: Playlist) => void;
}) {
  const coverUrl =
    playlist.coverUrl ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';

  return (
    <div
      className="card"
      onClick={() => onOpen(playlist)}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-img-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt={playlist.name} loading="lazy" />
      </div>
      <div className="card-title">{playlist.name}</div>
      <div className="card-meta">{playlist.uploaderName || 'Playlist'}</div>
    </div>
  );
}

export function ArtistSearchCard({ artist }: { artist: Artist }) {
  const { openArtistProfile } = usePlayer();

  const coverUrl =
    artist.imageUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300';

  return (
    <div
      className="card"
      onClick={() => openArtistProfile(artist.name)}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="card-img-wrap"
        style={{
          borderRadius: '50%',
          overflow: 'hidden',
          marginBottom: '12px',
          aspectRatio: '1/1',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt={artist.name}
          loading="lazy"
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
        />
      </div>
      <div className="card-title" style={{ textAlign: 'center' }}>
        {artist.name}
      </div>
      <div className="card-meta" style={{ textAlign: 'center' }}>
        Artist
      </div>
    </div>
  );
}

// Skeletons
export function SongRowSkeleton() {
  return (
    <div className="skeleton-song-row">
      <div className="skeleton skeleton-cover-sm"></div>
      <div className="skeleton-text-wrap">
        <div className="skeleton skeleton-text-main" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-text-sub" style={{ width: '40%' }}></div>
      </div>
      <div className="skeleton skeleton-text-sub" style={{ width: '32px', marginLeft: 'auto' }}></div>
    </div>
  );
}

export function CardSkeleton({ isRound = false }: { isRound?: boolean }) {
  return (
    <div className="skeleton-card">
      <div
        className="skeleton skeleton-card-cover"
        style={{
          borderRadius: isRound ? '50%' : 'var(--radius-md)',
          marginBottom: '12px',
          aspectRatio: '1/1',
        }}
      ></div>
      <div className="skeleton skeleton-card-title" style={{ marginLeft: 0 }}></div>
      <div className="skeleton skeleton-card-meta" style={{ marginLeft: 0 }}></div>
    </div>
  );
}

export function HomeGridSkeleton() {
  return (
    <div className="home-grid-card" style={{ pointerEvents: 'none' }}>
      <div className="skeleton" style={{ width: '56px', height: '56px', flexShrink: 0 }}></div>
      <div className="skeleton skeleton-text-main" style={{ width: '70%', margin: 0 }}></div>
    </div>
  );
}

export function HomeScrollSkeleton() {
  return (
    <div className="home-scroll-card" style={{ pointerEvents: 'none' }}>
      <div
        className="skeleton"
        style={{
          width: '140px',
          height: '140px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '12px',
          aspectRatio: '1/1',
        }}
      ></div>
      <div className="skeleton skeleton-text-main" style={{ width: '80%', margin: '0 0 8px 0', borderRadius: '4px' }}></div>
      <div className="skeleton skeleton-text-sub" style={{ width: '50%', margin: 0, borderRadius: '4px' }}></div>
    </div>
  );
}
