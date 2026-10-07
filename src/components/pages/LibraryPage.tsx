'use client';

import React, { useState } from 'react';
import { usePawtify } from '../../context/PawtifyContext';
import { SongRow } from '../SongRow';
import { DEFAULT_COVER } from '../../utils/helpers';

export const LibraryPage: React.FC = () => {
  const {
    playlists,
    favorites,
    history,
    navigate,
    setModal,
    playSong,
  } = usePawtify();

  const [activeTab, setActiveTab] = useState<'playlists' | 'favorites' | 'history'>('playlists');

  return (
    <div className="page library-page">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h1
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
        >
          Your Library
        </h1>

        <button
          className="btn-primary"
          onClick={() => setModal({ type: 'createPlaylist' })}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 18px',
            borderRadius: '999px',
            background: 'var(--green)',
            color: '#000',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          <i className="fa-solid fa-plus" />
          <span>New Playlist</span>
        </button>
      </div>

      {/* Tabs */}
      <div
        className="tab-list"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        <button
          className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          Playlists ({playlists.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favorites')}
        >
          Liked Songs ({favorites.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History ({history.length})
        </button>
      </div>

      {/* Playlists Tab */}
      {activeTab === 'playlists' && (
        <div className="card-grid">
          {/* Liked Songs Featured Tile */}
          <div
            className="card"
            onClick={() => navigate('#playlist/favorites')}
            style={{
              background: 'linear-gradient(135deg, #450af5 0%, #8e8ee5 100%)',
              color: '#ffffff',
            }}
          >
            <div
              style={{
                height: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                padding: '8px',
              }}
            >
              <i className="fa-solid fa-heart" style={{ fontSize: '2.5rem', marginBottom: '16px' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>Liked Songs</div>
              <div style={{ fontSize: '0.8125rem', opacity: 0.9 }}>{favorites.length} songs</div>
            </div>
          </div>

          {/* User Playlists */}
          {playlists.map((pl) => {
            const firstCover = pl.songs[0]?.coverUrl;
            return (
              <div
                key={pl.id}
                className="card"
                onClick={() => navigate(`#playlist/${pl.id}`)}
              >
                <div className="scroll-cover-wrap">
                  {firstCover ? (
                    <img
                      src={firstCover || DEFAULT_COVER}
                      alt={pl.name}
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = DEFAULT_COVER;
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'rgba(255, 255, 255, 0.05)',
                        display: 'grid',
                        placeItems: 'center',
                        color: 'var(--muted)',
                        fontSize: '2rem',
                      }}
                    >
                      <i className="fa-solid fa-music" />
                    </div>
                  )}
                </div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '8px' }}>
                  {pl.name}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                  {pl.songs.length} {pl.songs.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Liked Songs Tab */}
      {activeTab === 'favorites' && (
        <div>
          {favorites.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-heart" />
              <h2>No liked songs yet</h2>
              <p>Songs you like with the heart icon will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {favorites.map((song, idx) => (
                <SongRow
                  key={song.id}
                  song={song}
                  index={idx}
                  queueContext={favorites}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {history.length === 0 ? (
            <div className="empty-state">
              <i className="fa-solid fa-clock-rotate-left" />
              <h2>No listening history</h2>
              <p>Play some tracks to build up your listening history!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {history.map((song, idx) => (
                <SongRow
                  key={`${song.id}-hist-${idx}`}
                  song={song}
                  index={idx}
                  queueContext={history}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
