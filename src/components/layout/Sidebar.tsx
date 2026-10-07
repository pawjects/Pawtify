'use client';

import React from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';

export function Sidebar() {
  const { route, navigate, playlists, setModal } = useLibrary();
  const { recentlyPlayed, queue } = usePlayer();

  const isHomeActive = route.name === 'home';
  const isSearchActive = route.name === 'search';
  const isLibraryActive = route.name === 'library' || (route.name === 'playlist' && route.playlistId !== 'history');
  const isYouActive = route.name === 'you';
  const isHistoryActive = route.name === 'playlist' && route.playlistId === 'history';

  // First track cover for history
  const historyCover = queue.find((s) => s.id === recentlyPlayed[0])?.coverUrl || '';

  return (
    <aside className="sidebar" aria-label="Main navigation">
      <div className="sidebar-brand" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pawtify.png" alt="Pawtify" className="sidebar-logo" />
        <span className="sidebar-brand-text">Pawtify</span>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-link ${isHomeActive ? 'active' : ''}`}
          onClick={() => navigate('/')}
          type="button"
        >
          <i className="fa-solid fa-house"></i>
          <span>Home</span>
        </button>
        <button
          className={`nav-link ${isSearchActive ? 'active' : ''}`}
          onClick={() => navigate('/search')}
          type="button"
        >
          <i className="fa-solid fa-magnifying-glass"></i>
          <span>Search</span>
        </button>
        <button
          className={`nav-link ${isLibraryActive ? 'active' : ''}`}
          onClick={() => navigate('/library')}
          type="button"
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Your Library</span>
        </button>
        <button
          className={`nav-link ${isYouActive ? 'active' : ''}`}
          onClick={() => navigate('/you')}
          type="button"
        >
          <i className="fa-solid fa-circle-user"></i>
          <span>You</span>
        </button>
      </nav>

      <div className="sidebar-divider"></div>

      <div className="sidebar-playlists-header">
        <span>Playlists</span>
        <button
          className="icon-btn small"
          onClick={() => setModal({ type: 'createPlaylist' })}
          type="button"
          aria-label="Create playlist"
        >
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="sidebar-playlists" id="sidebar-playlists">
        <button
          className={`sidebar-playlist-item ${isHistoryActive ? 'active' : ''}`}
          onClick={() => navigate('/playlist/history')}
          type="button"
        >
          {historyCover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="sidebar-playlist-thumb" src={historyCover} alt="" />
          ) : (
            <div className="sidebar-playlist-thumb empty">
              <i className="fa-solid fa-clock-rotate-left"></i>
            </div>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Listening History
          </span>
        </button>

        {playlists.map((playlist) => {
          const isActive = route.name === 'playlist' && route.playlistId === playlist.id;
          const cover = playlist.songs[0]?.coverUrl || playlist.coverUrl || '';
          return (
            <button
              key={playlist.id}
              className={`sidebar-playlist-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(`/playlist/${encodeURIComponent(playlist.id)}`)}
              type="button"
            >
              {cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="sidebar-playlist-thumb" src={cover} alt="" />
              ) : (
                <div className="sidebar-playlist-thumb empty">
                  <i className="fa-solid fa-music"></i>
                </div>
              )}
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {playlist.name}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
