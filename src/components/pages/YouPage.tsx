'use client';

import React from 'react';
import { usePawtify } from '../../context/PawtifyContext';
import { LOGO_URL } from '../../utils/helpers';
import { SongRow } from '../SongRow';

export const YouPage: React.FC = () => {
  const {
    userName,
    setModal,
    favorites,
    history,
    playlists,
    theme,
    setTheme,
    clearQueue,
    clearRecentSearches,
    showToast,
  } = usePawtify();

  // Compute top artist from history
  const artistCounts: Record<string, number> = {};
  history.forEach((s) => {
    if (s.artist) {
      artistCounts[s.artist] = (artistCounts[s.artist] || 0) + 1;
    }
  });
  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handleToggleTheme = () => {
    if (theme === 'dark') setTheme('amoled');
    else if (theme === 'amoled') setTheme('light');
    else setTheme('dark');
  };

  const handleClearCache = () => {
    clearQueue();
    clearRecentSearches();
    showToast('Queue & search history cleared!');
  };

  return (
    <div className="page you-page">
      {/* Profile Card */}
      <div className="you-profile-card">
        <div className="you-profile-main">
          <div className="you-avatar-wrap">
            <img
              src={LOGO_URL}
              alt="Avatar"
              className="you-avatar-img"
            />
            <div className="you-status-dot" />
          </div>

          <div className="you-profile-details">
            <div className="you-title-row">
              <h1 className="you-name">{userName || 'Music Lover'}</h1>
              <span className="you-badge">
                <i className="fa-solid fa-bolt" /> Hi-Res Audio
              </span>
            </div>
            <p className="you-tagline">
              Distraction-free, zero-telemetry personal music streaming with local IndexedDB vault.
            </p>
            <div className="you-pill-row">
              <span className="you-pill">
                <i className="fa-solid fa-shield-halved" /> Private & Local
              </span>
              <span className="you-pill">
                <i className="fa-solid fa-database" /> IndexedDB Active
              </span>
              <span className="you-pill">
                <i className="fa-solid fa-moon" /> {theme.toUpperCase()} Mode
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="you-stats-grid">
          <div className="you-stat-card">
            <span className="you-stat-val">{history.length}</span>
            <span className="you-stat-lbl">
              <i className="fa-solid fa-play" /> Played
            </span>
          </div>

          <div className="you-stat-card">
            <span className="you-stat-val">{favorites.length}</span>
            <span className="you-stat-lbl">
              <i className="fa-solid fa-heart" /> Liked
            </span>
          </div>

          <div className="you-stat-card">
            <span className="you-stat-val">{playlists.length}</span>
            <span className="you-stat-lbl">
              <i className="fa-solid fa-list-ul" /> Playlists
            </span>
          </div>

          <div className="you-stat-card" onClick={handleToggleTheme}>
            <span className="you-stat-val" style={{ textTransform: 'capitalize' }}>
              {theme}
            </span>
            <span className="you-stat-lbl">
              <i className="fa-solid fa-circle-half-stroke" /> Theme
            </span>
          </div>
        </div>
      </div>

      {/* Quick Settings & Actions */}
      <section className="you-section">
        <div className="you-section-head">
          <h2 className="you-section-title">
            <i className="fa-solid fa-sliders" style={{ marginRight: '8px', color: 'var(--green)' }} />
            Personal Settings
          </h2>
          <span className="you-section-sub">Customize your profile, playback themes, and device storage</span>
        </div>

        <div className="you-quick-grid">
          <div className="you-quick-card" onClick={() => setModal({ type: 'editName' })}>
            <div className="you-quick-icon">
              <i className="fa-solid fa-user-pen" />
            </div>
            <div className="you-quick-info">
              <strong>Display Name</strong>
              <span>{userName || 'Change profile name'}</span>
            </div>
            <i className="fa-solid fa-chevron-right you-quick-arrow" />
          </div>

          <div className="you-quick-card" onClick={handleToggleTheme}>
            <div className="you-quick-icon">
              <i className="fa-solid fa-palette" />
            </div>
            <div className="you-quick-info">
              <strong>App Theme</strong>
              <span>Current: {theme.toUpperCase()}</span>
            </div>
            <i className="fa-solid fa-chevron-right you-quick-arrow" />
          </div>

          <div className="you-quick-card" onClick={handleClearCache}>
            <div className="you-quick-icon">
              <i className="fa-solid fa-broom" />
            </div>
            <div className="you-quick-info">
              <strong>Clear Cache</strong>
              <span>Reset queue & search cache</span>
            </div>
            <i className="fa-solid fa-chevron-right you-quick-arrow" />
          </div>
        </div>
      </section>

      {/* Top Artists from History */}
      {topArtists.length > 0 && (
        <section className="you-section">
          <div className="you-section-head">
            <h2 className="you-section-title">
              <i className="fa-solid fa-fire" style={{ marginRight: '8px', color: 'var(--green)' }} />
              Most Played Artists
            </h2>
            <span className="you-section-sub">Based on your recent listening sessions</span>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {topArtists.map(([artistName, count], idx) => (
              <div
                key={idx}
                className="you-stat-card"
                style={{
                  flex: '1 1 140px',
                  padding: '16px 12px',
                  cursor: 'default',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
                  {artistName}
                </div>
                <div style={{ color: 'var(--green)', fontSize: '0.8125rem', marginTop: '4px' }}>
                  {count} {count === 1 ? 'play' : 'plays'}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Played List */}
      {history.length > 0 && (
        <section className="you-section">
          <div className="you-section-head">
            <h2 className="you-section-title">
              <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px', color: 'var(--green)' }} />
              Recently Played Tracks
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {history.slice(0, 10).map((song, idx) => (
              <SongRow
                key={`${song.id}-you-${idx}`}
                song={song}
                index={idx}
                queueContext={history}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
