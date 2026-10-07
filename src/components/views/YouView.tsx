'use client';

import React, { useRef } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import { TasteProfileChart } from '@/components/charts/TasteProfileChart';
import { PlaylistCard } from '@/components/common/Cards';
import { useToast } from '@/context/ToastContext';

export function YouView() {
  const {
    userName,
    setUserName,
    playlists,
    favorites,
    setModal,
    navigate,
    clearSearchHistory,
    exportLibrary,
    importLibrary,
  } = useLibrary();

  const {
    recentlyPlayed,
    queue,
    videoVisible,
    toggleVideoVisible,
    clearHistory,
    clearQueue,
    setQueuePanel,
  } = usePlayer();

  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const playlistsCount = playlists ? playlists.length : 0;
  const favoritesCount = favorites ? favorites.length : 0;
  const historyCount = recentlyPlayed ? recentlyPlayed.length : 0;
  const queueCount = queue ? queue.length : 0;

  const userPlaylists = playlists.slice(0, 4);

  const handleResetName = () => {
    setUserName('');
    showToast('Name reset to default.');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importLibrary(file);
    }
  };

  return (
    <section className="page you-page">
      {/* Profile Header Area */}
      <div className="you-profile-card">
        <div className="you-profile-main">
          <div className="you-avatar-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/pawtify.png" alt="Pawtify" className="you-avatar-img" />
          </div>
          <div className="you-profile-details">
            <div className="you-title-row" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h1 className="you-name">{userName || 'Pawtify'}</h1>
              <button
                className="icon-btn small you-edit-name-btn"
                onClick={() => setModal({ type: 'editName' })}
                type="button"
                aria-label="Edit display name"
                title="Edit name"
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--muted)',
                }}
              >
                <i className="fa-solid fa-pen" style={{ fontSize: '0.75rem' }}></i>
              </button>
            </div>
            <p className="you-tagline">
              {userName
                ? `Welcome back, ${userName}. Local library & audio player.`
                : 'Local library & audio player.'}
            </p>
          </div>
        </div>

        {/* Metric Counter Strip */}
        <div className="you-stats-grid">
          <button className="you-stat-card" onClick={() => navigate('/library')} type="button">
            <span className="you-stat-val">{favoritesCount}</span>
            <span className="you-stat-lbl">Favorites</span>
          </button>
          <button className="you-stat-card" onClick={() => navigate('/library')} type="button">
            <span className="you-stat-val">{playlistsCount}</span>
            <span className="you-stat-lbl">Playlists</span>
          </button>
          <button className="you-stat-card" onClick={() => navigate('/playlist/history')} type="button">
            <span className="you-stat-val">{historyCount}</span>
            <span className="you-stat-lbl">History</span>
          </button>
          <button className="you-stat-card" onClick={() => setQueuePanel(true)} type="button">
            <span className="you-stat-val">{queueCount}</span>
            <span className="you-stat-lbl">Queue</span>
          </button>
        </div>
      </div>

      {/* D3 Chart Section: Taste Distribution */}
      <TasteProfileChart />

      {/* Playlists Section */}
      <div className="you-section">
        <div className="you-section-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="you-section-title">Playlists</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn btn-soft"
              onClick={() => setModal({ type: 'createPlaylist' })}
              type="button"
              style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
            >
              <i className="fa-solid fa-plus"></i> New
            </button>
            <button
              className="btn btn-soft"
              onClick={() => navigate('/library')}
              type="button"
              style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
            >
              View all
            </button>
          </div>
        </div>

        {userPlaylists.length > 0 ? (
          <div className="card-grid">
            {userPlaylists.map((p) => (
              <PlaylistCard key={p.id} playlist={p} />
            ))}
          </div>
        ) : (
          <div className="you-glass-card you-empty-state">
            <i className="fa-solid fa-list-ul you-empty-icon"></i>
            <div className="you-empty-text">
              <strong>No playlists yet</strong>
              <span>Create custom playlists to organize your library.</span>
            </div>
            <button
              className="btn btn-primary you-action-btn"
              onClick={() => setModal({ type: 'createPlaylist' })}
              type="button"
            >
              <i className="fa-solid fa-plus"></i> Create Playlist
            </button>
          </div>
        )}

        {/* Backup & Migration */}
        <div className="you-glass-card you-backup-card" style={{ marginTop: '16px' }}>
          <div className="you-backup-content">
            <div className="you-backup-icon">
              <i className="fa-solid fa-database"></i>
            </div>
            <div className="you-backup-text">
              <strong>Library backup</strong>
              <p>Your library is saved locally. Export a JSON backup to keep your music safe or move it to another browser.</p>
            </div>
          </div>
          <div className="you-backup-actions">
            <button className="btn btn-soft you-action-btn" onClick={exportLibrary} type="button">
              <i className="fa-solid fa-file-export"></i> Export
            </button>
            <button
              className="btn btn-soft you-action-btn"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <i className="fa-solid fa-file-import"></i> Import
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="application/json"
              style={{ display: 'none' }}
            />
          </div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="you-section">
        <div className="you-section-head">
          <h2 className="you-section-title">Settings</h2>
        </div>

        <div className="you-glass-card you-settings-container">
          {/* Display Name */}
          <div className="you-setting-row">
            <div className="you-setting-info">
              <div className="you-setting-label">Display name</div>
              <div className="you-setting-desc">
                {userName ? `Personalized for "${userName}"` : 'Personalize your greetings and home tab.'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                className="btn btn-soft you-setting-btn"
                onClick={() => setModal({ type: 'editName' })}
                type="button"
              >
                {userName ? 'Edit' : 'Set name'}
              </button>
              {userName && (
                <button
                  className="btn btn-soft you-setting-btn you-btn-danger"
                  onClick={handleResetName}
                  type="button"
                  title="Clear saved name"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="you-setting-divider"></div>

          {/* Floating Video */}
          <div className="you-setting-row">
            <div className="you-setting-info">
              <div className="you-setting-label">Floating video player</div>
              <div className="you-setting-desc">Show the video feed while music plays.</div>
            </div>
            <button
              className="btn btn-soft you-setting-btn"
              onClick={toggleVideoVisible}
              type="button"
            >
              {videoVisible ? 'Hide video' : 'Show video'}
            </button>
          </div>

          <div className="you-setting-divider"></div>

          {/* Listening History */}
          <div className="you-setting-row">
            <div className="you-setting-info">
              <div className="you-setting-label">Listening history</div>
              <div className="you-setting-desc">{historyCount} track{historyCount === 1 ? '' : 's'} recorded locally.</div>
            </div>
            <button
              className="btn btn-soft you-setting-btn you-btn-danger"
              onClick={clearHistory}
              type="button"
              disabled={historyCount === 0}
              style={{ opacity: historyCount === 0 ? 0.5 : 1 }}
            >
              Clear
            </button>
          </div>

          <div className="you-setting-divider"></div>

          {/* Search History */}
          <div className="you-setting-row">
            <div className="you-setting-info">
              <div className="you-setting-label">Search history</div>
              <div className="you-setting-desc">Cached queries and recent searches.</div>
            </div>
            <button
              className="btn btn-soft you-setting-btn"
              onClick={clearSearchHistory}
              type="button"
            >
              Clear
            </button>
          </div>

          <div className="you-setting-divider"></div>

          {/* Play Queue */}
          <div className="you-setting-row">
            <div className="you-setting-info">
              <div className="you-setting-label">Play queue</div>
              <div className="you-setting-desc">{queueCount} track{queueCount === 1 ? '' : 's'} queued.</div>
            </div>
            <button
              className="btn btn-soft you-setting-btn"
              onClick={clearQueue}
              type="button"
              disabled={queueCount === 0}
              style={{ opacity: queueCount === 0 ? 0.5 : 1 }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* About Footer */}
      <div className="you-section">
        <div className="you-about-card">
          <div className="you-about-main">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/pawtify.png" alt="Pawtify" className="you-about-logo" />
            <div>
              <h3 className="you-about-name">
                Pawtify <span className="you-version-badge">v1.0.0</span>
              </h3>
              <p className="you-about-sub">Open-source music streaming application</p>
            </div>
          </div>

          <div className="you-links-grid">
            <a
              href="https://github.com/pawjects/Pawtify"
              target="_blank"
              rel="noopener noreferrer"
              className="you-link-card"
            >
              <i className="fa-brands fa-github you-link-icon"></i>
              <div className="you-link-text">
                <strong>GitHub</strong>
                <span>Source code and releases</span>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square you-link-ext"></i>
            </a>

            <a
              href="https://github.com/pawjects/Pawtify/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="you-link-card"
            >
              <i className="fa-solid fa-bug you-link-icon"></i>
              <div className="you-link-text">
                <strong>Issues</strong>
                <span>Report bugs or requests</span>
              </div>
              <i className="fa-solid fa-arrow-up-right-from-square you-link-ext"></i>
            </a>

            <button
              className="you-link-card you-link-btn"
              onClick={() => setModal({ type: 'appInfo' })}
              type="button"
            >
              <i className="fa-solid fa-circle-info you-link-icon"></i>
              <div className="you-link-text">
                <strong>About Pawtify</strong>
                <span>App information</span>
              </div>
              <i className="fa-solid fa-chevron-right you-link-ext"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
