'use client';

import React, { useState, useEffect } from 'react';
import { usePawtify } from '../../context/PawtifyContext';
import { SongRow } from '../SongRow';
import { fetchPlaylistVideos } from '../../services/api';
import { Song, Playlist } from '../../types';
import { DEFAULT_COVER } from '../../utils/helpers';

interface PlaylistPageProps {
  playlistId: string;
}

export const PlaylistPage: React.FC<PlaylistPageProps> = ({ playlistId }) => {
  const {
    playlists,
    favorites,
    playSong,
    toggleShuffle,
    setModal,
    navigate,
    createPlaylist,
    addSongToPlaylist,
    showToast,
  } = usePawtify();

  const [externalLoading, setExternalLoading] = useState<boolean>(false);
  const [externalSongs, setExternalSongs] = useState<Song[]>([]);

  const isFavorites = playlistId === 'favorites';
  const localPlaylist = playlists.find((p) => p.id === playlistId);

  useEffect(() => {
    // If not favorites and not in local playlists, attempt to fetch from YouTube
    if (!isFavorites && !localPlaylist && playlistId) {
      setExternalLoading(true);
      fetchPlaylistVideos(playlistId)
        .then((songs) => {
          setExternalSongs(songs);
          setExternalLoading(false);
        })
        .catch(() => {
          setExternalLoading(false);
        });
    }
  }, [playlistId, isFavorites, localPlaylist]);

  const playlistTitle = isFavorites
    ? 'Liked Songs'
    : localPlaylist
    ? localPlaylist.name
    : 'YouTube Playlist';

  const playlistSongs: Song[] = isFavorites
    ? favorites
    : localPlaylist
    ? localPlaylist.songs
    : externalSongs;

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      playSong(playlistSongs[0], playlistSongs, 0);
    }
  };

  const handleShufflePlay = () => {
    if (playlistSongs.length > 0) {
      toggleShuffle();
      const rand = Math.floor(Math.random() * playlistSongs.length);
      playSong(playlistSongs[rand], playlistSongs, rand);
    }
  };

  const handleSaveExternalAsLocal = () => {
    if (externalSongs.length > 0) {
      const newPl = createPlaylist(playlistTitle);
      externalSongs.forEach((s) => addSongToPlaylist(newPl.id, s));
      showToast('Saved playlist to your library!');
      navigate(`#playlist/${newPl.id}`);
    }
  };

  const coverImage = isFavorites
    ? null
    : playlistSongs[0]?.coverUrl || null;

  return (
    <div className="page playlist-page">
      {/* Hero Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '24px',
          alignItems: 'flex-end',
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            width: '180px',
            height: '180px',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            flexShrink: 0,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            background: isFavorites
              ? 'linear-gradient(135deg, #450af5 0%, #8e8ee5 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {isFavorites ? (
            <i className="fa-solid fa-heart" style={{ fontSize: '4rem', color: '#fff' }} />
          ) : coverImage ? (
            <img
              src={coverImage || DEFAULT_COVER}
              alt={playlistTitle}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null;
                img.src = DEFAULT_COVER;
              }}
            />
          ) : (
            <i className="fa-solid fa-music" style={{ fontSize: '3rem', color: 'var(--muted)' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div
            style={{
              textTransform: 'uppercase',
              fontSize: '0.75rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              color: 'var(--muted)',
              marginBottom: '8px',
            }}
          >
            Playlist
          </div>
          <h1
            style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              lineHeight: 1.1,
              marginBottom: '12px',
            }}
          >
            {playlistTitle}
          </h1>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
            {playlistSongs.length} {playlistSongs.length === 1 ? 'song' : 'songs'}
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              marginTop: '20px',
            }}
          >
            {playlistSongs.length > 0 && (
              <>
                <button
                  className="btn-primary"
                  onClick={handlePlayAll}
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '50%',
                    background: 'var(--green)',
                    color: '#000',
                    border: 'none',
                    fontSize: '1.25rem',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    boxShadow: '0 4px 14px rgba(29, 185, 84, 0.4)',
                  }}
                  title="Play all"
                  aria-label="Play all"
                >
                  <i className="fa-solid fa-play" style={{ marginLeft: '2px' }} />
                </button>

                <button
                  className="icon-btn"
                  onClick={handleShufflePlay}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--muted)',
                    border: 'none',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                  title="Shuffle playlist"
                  aria-label="Shuffle"
                >
                  <i className="fa-solid fa-shuffle" />
                </button>
              </>
            )}

            {localPlaylist && (
              <button
                className="icon-btn"
                onClick={() => setModal({ type: 'editPlaylist', playlistId: localPlaylist.id })}
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--muted)',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                }}
                title="Edit playlist"
                aria-label="Edit playlist"
              >
                <i className="fa-solid fa-pen-to-square" />
              </button>
            )}

            {!isFavorites && !localPlaylist && externalSongs.length > 0 && (
              <button
                className="btn-secondary"
                onClick={handleSaveExternalAsLocal}
                style={{
                  padding: '10px 18px',
                  borderRadius: '999px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text)',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <i className="fa-solid fa-plus" style={{ marginRight: '8px' }} />
                Save to Library
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Song list */}
      {externalLoading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }} />
          Loading playlist tracks...
        </div>
      ) : playlistSongs.length === 0 ? (
        <div className="empty-state">
          <i className="fa-solid fa-music" />
          <h2>This playlist is empty</h2>
          <p>Search for songs and add them to this playlist!</p>
          <button
            className="btn-primary"
            onClick={() => navigate('#search')}
            style={{
              marginTop: '16px',
              padding: '10px 24px',
              borderRadius: '999px',
              background: 'var(--green)',
              color: '#000',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Find Songs
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {playlistSongs.map((song, idx) => (
            <SongRow
              key={`${song.id}-${idx}`}
              song={song}
              index={idx}
              playlistId={localPlaylist ? localPlaylist.id : undefined}
              queueContext={playlistSongs}
            />
          ))}
        </div>
      )}
    </div>
  );
};
