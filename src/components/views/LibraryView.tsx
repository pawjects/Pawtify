'use client';

import React, { useRef } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { SongRow } from '@/components/common/SongRow';
import { PlaylistCard, SongRowSkeleton, CardSkeleton } from '@/components/common/Cards';
import { dedupeSongs } from '@/services/storageService';

export function LibraryView() {
  const {
    libraryTab,
    setLibraryTab,
    favorites,
    playlists,
    exportLibrary,
    importLibrary,
    feedLoading,
  } = useLibrary();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importLibrary(file);
    }
  };

  const recentSongs = dedupeSongs(
    [...favorites, ...playlists.flatMap((p) => p.songs)]
      .filter((s) => s.addedAt)
      .sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0))
  ).slice(0, 50);

  return (
    <section className="page">
      <div
        className="page-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <h1 className="page-title">Your Library</h1>
        <div className="header-actions" style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-soft"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            aria-label="Import Backup"
            title="Import Backup"
          >
            <i className="fa-solid fa-file-import"></i>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="application/json"
            style={{ display: 'none' }}
          />
          <button
            className="btn btn-soft"
            onClick={exportLibrary}
            type="button"
            aria-label="Export Backup"
            title="Export Backup"
          >
            <i className="fa-solid fa-file-export"></i>
          </button>
        </div>
      </div>

      <div className="tab-list">
        <button
          className={`tab-btn ${libraryTab === 'recent' ? 'active' : ''}`}
          onClick={() => setLibraryTab('recent')}
          type="button"
        >
          Recently Added
        </button>
        <button
          className={`tab-btn ${libraryTab === 'favorites' ? 'active' : ''}`}
          onClick={() => setLibraryTab('favorites')}
          type="button"
        >
          Favorites
        </button>
        <button
          className={`tab-btn ${libraryTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setLibraryTab('playlists')}
          type="button"
        >
          Playlists
        </button>
      </div>

      {feedLoading ? (
        libraryTab === 'playlists' ? (
          <div className="card-grid">
            {Array(8)
              .fill('')
              .map((_, i) => (
                <CardSkeleton key={i} />
              ))}
          </div>
        ) : (
          <div className="song-table">
            {Array(8)
              .fill('')
              .map((_, i) => (
                <SongRowSkeleton key={i} />
              ))}
          </div>
        )
      ) : libraryTab === 'playlists' ? (
        <div className="card-grid">
          {playlists.length > 0 ? (
            playlists.map((p) => <PlaylistCard key={p.id} playlist={p} />)
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-list-ul"></i>
              <h2>No playlists yet</h2>
              <p>Create a playlist to get started.</p>
            </div>
          )}
        </div>
      ) : libraryTab === 'favorites' ? (
        <div className="song-table">
          {favorites.length > 0 ? (
            favorites.map((s, i) => (
              <SongRow key={s.id + i} song={s} index={i + 1} source="favorites" />
            ))
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-heart"></i>
              <h2>No favorites yet</h2>
              <p>Like a song to add it here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="song-table">
          {recentSongs.length > 0 ? (
            recentSongs.map((s, i) => (
              <SongRow key={s.id + i} song={s} index={i + 1} source="recent" />
            ))
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-clock-rotate-left"></i>
              <h2>No recent songs</h2>
              <p>Your recent activity will appear here.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
