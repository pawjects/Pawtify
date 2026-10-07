'use client';

import React, { useState, useEffect } from 'react';
import { usePawtify } from '../../context/PawtifyContext';
import { FeedCategory } from '../../types';
import { DEFAULT_COVER } from '../../utils/helpers';

export const HomePage: React.FC = () => {
  const {
    userName,
    playlists,
    navigate,
    playSong,
    setModal,
    feedCategories,
    feedLoading,
    refreshFeed,
  } = usePawtify();

  const [greeting, setGreeting] = useState<string>('Good day');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  return (
    <div className="page home-page">
      {/* Greeting and Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
        }}
      >
        <h1
          suppressHydrationWarning
          style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
          }}
        >
          {greeting}{userName ? `, ${userName}` : ''}
        </h1>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="settings-btn icon-btn"
            onClick={refreshFeed}
            title="Refresh Feed"
            aria-label="Refresh Feed"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            <i className={`fa-solid fa-arrows-rotate ${feedLoading ? 'fa-spin' : ''}`} />
          </button>

          <button
            className="settings-btn icon-btn"
            onClick={() => setModal({ type: 'editName' })}
            title="Edit Profile"
            aria-label="Edit Profile"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
          >
            <i className="fa-solid fa-user-pen" />
          </button>
        </div>
      </div>

      {/* Quick Access Top Grid */}
      <div className="home-grid">
        <div
          className="home-grid-card"
          onClick={() => navigate('playlist/favorites')}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #450af5, #c4efd9)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: '1.4rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-heart" />
          </div>
          <span>Liked Songs</span>
        </div>

        <div
          className="home-grid-card"
          onClick={() => navigate('library')}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #1db954, #191414)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              fontSize: '1.4rem',
              flexShrink: 0,
            }}
          >
            <i className="fa-solid fa-clock-rotate-left" />
          </div>
          <span>Recently Played</span>
        </div>

        {playlists.slice(0, 4).map((pl) => (
          <div
            key={pl.id}
            className="home-grid-card"
            onClick={() => navigate(`playlist/${pl.id}`)}
          >
            {pl.songs[0]?.coverUrl ? (
              <img
                src={pl.songs[0].coverUrl}
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
                  width: '64px',
                  height: '64px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--muted)',
                  fontSize: '1.2rem',
                  flexShrink: 0,
                }}
              >
                <i className="fa-solid fa-music" />
              </div>
            )}
            <span>{pl.name}</span>
          </div>
        ))}
      </div>

      {/* Dynamic Music Shelves */}
      {feedCategories.length === 0 && feedLoading ? (
        <div style={{ padding: '20px 0' }}>
          {[1, 2].map((n) => (
            <div key={n} style={{ marginBottom: '32px' }}>
              <div
                style={{
                  width: '180px',
                  height: '24px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: '4px',
                  marginBottom: '16px',
                }}
              />
              <div style={{ display: 'flex', gap: '16px', overflowX: 'hidden' }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      width: '160px',
                      height: '210px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: 'var(--radius-md)',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        feedCategories.map((cat: FeedCategory) => (
          <section key={cat.id} className="home-section">
            <h2 className="home-section-title">{cat.title}</h2>
            <div className="home-scroll">
              {cat.songs.map((song, idx) => (
                <div
                  key={`${cat.id}-${song.id}-${idx}`}
                  className="home-scroll-card"
                  onClick={() => playSong(song, cat.songs, idx)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="scroll-cover-wrap">
                    <img
                      src={song.coverUrl || DEFAULT_COVER}
                      alt={song.title}
                      loading="lazy"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = DEFAULT_COVER;
                      }}
                    />
                    <div className="scroll-badge">HQ Audio</div>
                  </div>
                  <h3 title={song.title}>{song.title}</h3>
                  <p title={song.artist}>{song.artist}</p>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};
