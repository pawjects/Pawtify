'use client';

import React, { useState, useEffect } from 'react';
import { usePawtify } from '../context/PawtifyContext';
import { LOGO_URL, DEFAULT_COVER } from '../utils/helpers';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  match: (name: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'fa-house', match: (n) => n === 'home' },
  { id: 'search', label: 'Search', icon: 'fa-magnifying-glass', match: (n) => n === 'search' },
  {
    id: 'library',
    label: 'Your Library',
    icon: 'fa-book-bookmark',
    match: (n) => n === 'library' || n === 'playlist',
  },
  { id: 'you', label: 'You', icon: 'fa-user', match: (n) => n === 'you' },
];

export const Sidebar: React.FC = () => {
  const {
    route,
    navigate,
    playlists,
    favorites,
    setModal,
  } = usePawtify();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getRouteIndex = (routeName: string) => {
    return NAV_ITEMS.findIndex((item) => item.match(routeName));
  };

  const activeIndex = getRouteIndex(route.name);
  const [visualIndex, setVisualIndex] = useState(activeIndex);

  useEffect(() => {
    setVisualIndex(activeIndex);
  }, [activeIndex]);

  const handleNav = (target: string, index?: number) => {
    if (typeof index === 'number') {
      setVisualIndex(index);
    }
    navigate(target);
  };

  const handleCreatePlaylist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setModal({ type: 'createPlaylist' });
  };

  return (
    <aside className="sidebar">
      <div
        className="sidebar-brand"
        onClick={() => handleNav('home', 0)}
        style={{ cursor: 'pointer' }}
      >
        <img
          src={LOGO_URL}
          alt="Pawtify Logo"
          className="sidebar-logo"
          onError={(e) => {
            const img = e.currentTarget;
            img.onerror = null;
            img.src = DEFAULT_COVER;
          }}
        />
        <span className="sidebar-brand-text">Pawtify</span>
      </div>

      <nav className="sidebar-nav" role="navigation" aria-label="Sidebar Navigation">
        {/* Continuous Fluid Active Pill for Desktop */}
        <div
          className="sidebar-nav-indicator"
          style={{
            transform:
              visualIndex >= 0
                ? `translate3d(0, ${visualIndex * 48}px, 0)`
                : 'translate3d(0, 0, 0)',
            opacity: visualIndex >= 0 ? 1 : 0,
            transition: mounted
              ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease'
              : 'none',
          }}
          aria-hidden="true"
        />

        {NAV_ITEMS.map((item, index) => {
          const isActive = visualIndex === index;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(item.id, index)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <i className={`fa-solid ${item.icon}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-divider" />

      <div className="sidebar-playlists-header">
        <span>Playlists</span>
        <button
          type="button"
          className="icon-btn"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--muted)',
            cursor: 'pointer',
            padding: '4px',
          }}
          onClick={handleCreatePlaylist}
          title="Create playlist"
          aria-label="Create playlist"
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>

      <div className="sidebar-playlists">
        <button
          type="button"
          className={`sidebar-playlist-item ${
            route.name === 'playlist' && route.playlistId === 'favorites'
              ? 'active'
              : ''
          }`}
          onClick={() => handleNav('playlist/favorites', 2)}
        >
          <div
            className="sidebar-playlist-thumb"
            style={{
              background: 'linear-gradient(135deg, #450af5, #c4efd9)',
              display: 'grid',
              placeItems: 'center',
              color: '#ffffff',
            }}
          >
            <i className="fa-solid fa-heart" style={{ fontSize: '0.8rem' }} />
          </div>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Liked Songs ({favorites.length})
          </span>
        </button>

        {playlists.map((pl) => {
          const firstCover = pl.songs[0]?.coverUrl;
          const isActive =
            route.name === 'playlist' && route.playlistId === pl.id;

          return (
            <button
              key={pl.id}
              type="button"
              className={`sidebar-playlist-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNav(`playlist/${pl.id}`, 2)}
              title={pl.name}
            >
              {firstCover ? (
                <img
                  src={firstCover}
                  alt={pl.name}
                  className="sidebar-playlist-thumb"
                />
              ) : (
                <div className="sidebar-playlist-thumb empty">
                  <i className="fa-solid fa-music" />
                </div>
              )}
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {pl.name}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
