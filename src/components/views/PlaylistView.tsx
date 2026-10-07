'use client';

import React, { useState, useEffect } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import { SongRow } from '@/components/common/SongRow';
import { SongRowSkeleton } from '@/components/common/Cards';
import { Playlist, Song } from '@/types/music';
import { fetchPlaylistVideos } from '@/services/musicApiService';

interface PlaylistViewProps {
  playlistId: string;
}

export function PlaylistView({ playlistId }: PlaylistViewProps) {
  const { playlists, deletePlaylist, navigate } = useLibrary();
  const { play, recentlyPlayed, queue, sharePlaylist } = usePlayer();

  const [externalPlaylist, setExternalPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(false);

  // Resolve playlist
  let playlist: Playlist | undefined;
  if (playlistId === 'history') {
    const historySongs = recentlyPlayed
      .map((id) => queue.find((s) => s.id === id))
      .filter(Boolean) as Song[];
    playlist = {
      id: 'history',
      name: 'Listening History',
      songs: historySongs,
      isSystem: true,
    };
  } else {
    playlist = playlists.find((p) => p.id === playlistId);
  }

  // If not local, fetch playlist videos from API
  useEffect(() => {
    if (!playlist && playlistId && playlistId !== 'history') {
      setLoading(true);
      fetchPlaylistVideos(playlistId)
        .then((songs) => {
          setExternalPlaylist({
            id: playlistId,
            name: 'YouTube Playlist',
            songs,
            isSystem: true,
          });
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [playlist, playlistId]);

  const activePlaylist = playlist || externalPlaylist;

  if (loading) {
    return (
      <section className="page">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '24px', paddingBottom: '24px' }}>
          <div className="skeleton" style={{ width: '160px', height: '160px', borderRadius: 'var(--radius-md)' }}></div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="skeleton skeleton-text-main" style={{ width: '100px', height: '14px', borderRadius: '4px' }}></div>
            <div className="skeleton skeleton-text-main" style={{ width: '60%', height: '48px', borderRadius: '8px' }}></div>
            <div className="skeleton skeleton-text-sub" style={{ width: '40%', height: '14px', borderRadius: '4px' }}></div>
          </div>
        </div>
        <div className="song-table">
          {Array(8)
            .fill('')
            .map((_, i) => (
              <SongRowSkeleton key={i} />
            ))}
        </div>
      </section>
    );
  }

  if (!activePlaylist) {
    return (
      <section className="page">
        <div className="empty-state">Playlist not found.</div>
      </section>
    );
  }

  const coverUrl =
    activePlaylist.coverUrl ||
    (activePlaylist.songs && activePlaylist.songs.length > 0
      ? activePlaylist.songs[0].coverUrl
      : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300');

  const handlePlayAll = () => {
    if (activePlaylist.songs && activePlaylist.songs.length > 0) {
      play(activePlaylist.songs[0], activePlaylist.songs, true);
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete "${activePlaylist.name}"?`)) {
      deletePlaylist(activePlaylist.id);
      navigate('/library');
    }
  };

  return (
    <section className="page" style={{ paddingTop: 0 }}>
      <div style={{ marginBottom: '24px', marginTop: '16px' }}>
        <button
          className="btn btn-soft"
          onClick={() => navigate('/')}
          type="button"
          style={{ padding: '8px 16px', fontSize: '0.875rem' }}
        >
          <i className="fa-solid fa-arrow-left" style={{ marginRight: '8px' }}></i> Back to Home
        </button>
      </div>

      <div
        className="hero-player"
        style={{
          marginBottom: '32px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--glass-surface)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          padding: '32px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-cover" src={coverUrl} alt={activePlaylist.name} />
        <div className="hero-info" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <h4
            style={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              letterSpacing: '0.1em',
              marginBottom: '8px',
              color: 'var(--muted)',
            }}
          >
            Playlist
          </h4>
          <h1
            className="hero-title"
            style={{
              fontSize: '3rem',
              lineHeight: 1.1,
              marginBottom: '16px',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
            }}
          >
            {activePlaylist.name}
          </h1>
          <p className="hero-artist" style={{ marginBottom: '24px', color: 'var(--muted)' }}>
            {activePlaylist.isSystem
              ? 'System Playlist'
              : `${activePlaylist.songs ? activePlaylist.songs.length : 0} songs`}
          </p>
          <div className="hero-actions" style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary" onClick={handlePlayAll} type="button">
              <i className="fa-solid fa-play"></i> Play All
            </button>
            <button
              className="btn btn-soft"
              onClick={() => sharePlaylist(activePlaylist.id, activePlaylist.name)}
              type="button"
              aria-label="Share Playlist"
            >
              <i className="fa-solid fa-share-nodes"></i> Share
            </button>
            {activePlaylist.id !== 'default' && !activePlaylist.isSystem && (
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                type="button"
                aria-label="Delete Playlist"
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="song-table">
        {activePlaylist.songs && activePlaylist.songs.length > 0 ? (
          activePlaylist.songs.map((s, i) => (
            <SongRow
              key={s.id + i}
              song={s}
              index={i + 1}
              source="playlist"
              playlistId={activePlaylist.id}
              queueOverride={activePlaylist.songs}
            />
          ))
        ) : (
          <div className="empty-state">
            This playlist is empty. Search for songs to add them.
          </div>
        )}
      </div>
    </section>
  );
}
