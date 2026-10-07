'use client';

import React, { useState } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import { useToast } from '@/context/ToastContext';

export function ModalOverlay() {
  const { modal, setModal, playlists, addToPlaylist, removeFromPlaylist, createPlaylist, userName, setUserName } =
    useLibrary();
  const { currentSong, downloadSong, shareCurrentSong } = usePlayer();
  const { showToast } = useToast();

  const [playlistNameInput, setPlaylistNameInput] = useState('');
  const [userNameInput, setUserNameInput] = useState(userName || '');

  if (!modal) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setModal(null);
    }
  };

  // 1. Song Details Modal
  if (modal.type === 'songDetails') {
    if (!currentSong) return null;
    return (
      <section className="overlay" onClick={handleDismiss}>
        <article className="modal">
          <header className="modal-head">
            <h2 className="modal-title">Song Details</h2>
            <button
              className="icon-btn"
              onClick={() => setModal(null)}
              type="button"
              aria-label="Close"
              style={{ width: '32px', height: '32px', borderRadius: '999px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div className="modal-body">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentSong.coverUrl}
                style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                alt=""
              />
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{currentSong.title}</h3>
                <p style={{ color: 'var(--muted)', marginTop: '4px' }}>{currentSong.artist}</p>
              </div>
            </div>
            <div className="meta-list">
              <p className="meta-item">
                <b>Quality:</b> HQ Audio Stream
              </p>
              <p className="meta-item">
                <b>Duration:</b> {currentSong.duration || '0:00'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={downloadSong}
                type="button"
                style={{ flex: 1 }}
              >
                <i className="fa-solid fa-download"></i> Download
              </button>
              <button
                className="btn btn-soft"
                onClick={shareCurrentSong}
                type="button"
                style={{ flex: 1 }}
              >
                <i className="fa-solid fa-share-nodes"></i> Share
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  // 2. Playlist Picker Modal
  if (modal.type === 'playlistPicker') {
    const songId = modal.songId;
    const targetSong =
      (currentSong?.id === songId ? currentSong : null) ||
      playlists.flatMap((p) => p.songs).find((s) => s.id === songId) ||
      currentSong;

    if (!targetSong) return null;

    return (
      <section className="overlay" onClick={handleDismiss}>
        <article className="modal">
          <header className="modal-head">
            <h2 className="modal-title">Add to Playlist</h2>
            <button
              className="icon-btn"
              onClick={() => setModal(null)}
              type="button"
              aria-label="Close"
              style={{ width: '32px', height: '32px', borderRadius: '999px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div className="modal-body">
            <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '12px' }}>
              {targetSong.title} • {targetSong.artist}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {playlists.map((playlist) => {
                const exists = playlist.songs.some((s) => s.id === targetSong.id);
                return (
                  <button
                    key={playlist.id}
                    className="btn btn-soft"
                    style={{ justifyContent: 'space-between' }}
                    onClick={() => {
                      if (exists) {
                        removeFromPlaylist(targetSong.id, playlist.id);
                        showToast(`Removed from ${playlist.name}`);
                      } else {
                        addToPlaylist(targetSong, playlist.id);
                      }
                    }}
                    type="button"
                  >
                    <span>{playlist.name}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>
                      {exists ? 'Remove' : 'Add'}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              className="btn btn-primary"
              onClick={() => setModal({ type: 'createPlaylist' })}
              type="button"
              style={{ marginTop: '16px' }}
            >
              Create New Playlist
            </button>
          </div>
        </article>
      </section>
    );
  }

  // 3. Create Playlist Modal
  if (modal.type === 'createPlaylist') {
    const handleCreateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = playlistNameInput.trim();
      if (!trimmed) return;
      createPlaylist(trimmed);
      setPlaylistNameInput('');
      setModal(null);
    };

    return (
      <section className="overlay" onClick={handleDismiss}>
        <article className="modal">
          <header className="modal-head">
            <h2 className="modal-title">Create Playlist</h2>
            <button
              className="icon-btn"
              onClick={() => setModal(null)}
              type="button"
              aria-label="Close"
              style={{ width: '32px', height: '32px', borderRadius: '999px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>
          <form className="modal-body" onSubmit={handleCreateSubmit}>
            <div className="form-row">
              <label className="form-label" htmlFor="playlist-name">
                Playlist Name
              </label>
              <input
                className="text-input"
                id="playlist-name"
                name="playlistName"
                required
                placeholder="My Awesome Playlist"
                maxLength={40}
                value={playlistNameInput}
                onChange={(e) => setPlaylistNameInput(e.target.value)}
                autoFocus
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Create Playlist
            </button>
          </form>
        </article>
      </section>
    );
  }

  // 4. Welcome or Edit Name Modal
  if (modal.type === 'welcome' || modal.type === 'editName') {
    const isEdit = modal.type === 'editName';

    const handleNameSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = userNameInput.trim();
      setUserName(trimmed);
      setModal(null);
      showToast(trimmed ? `Welcome to Pawtify, ${trimmed}!` : 'Welcome to Pawtify!');
    };

    return (
      <section className="overlay welcome-overlay" onClick={handleDismiss}>
        <article
          className="modal welcome-modal personalized-welcome-card"
          style={{ maxWidth: '400px' }}
        >
          <header className="modal-head">
            <h2 className="modal-title">{isEdit ? 'Edit Name' : 'Welcome'}</h2>
            <button
              className="icon-btn"
              onClick={() => setModal(null)}
              type="button"
              aria-label="Close"
              style={{ width: '32px', height: '32px', borderRadius: '999px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>
          <form
            className="modal-body"
            onSubmit={handleNameSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div>
              <label
                className="form-label"
                htmlFor="welcome-user-name"
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  marginBottom: '4px',
                  display: 'block',
                  color: 'var(--text)',
                }}
              >
                What should we call you?
              </label>
              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', margin: 0 }}>
                Stored locally on this device.
              </p>
            </div>
            <div>
              <input
                type="text"
                id="welcome-user-name"
                name="userName"
                className="text-input"
                placeholder="Your name"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                maxLength={28}
                autoComplete="name"
                required
                autoFocus
                style={{ width: '100%' }}
              />
            </div>
            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
              {isEdit ? 'Save Changes' : 'Get Started'}
            </button>
          </form>
        </article>
      </section>
    );
  }

  // 5. App Info Modal
  if (modal.type === 'appInfo') {
    return (
      <section className="overlay" onClick={handleDismiss}>
        <article className="modal" style={{ maxWidth: '440px' }}>
          <header className="modal-head">
            <h2 className="modal-title">About Pawtify</h2>
            <button
              className="icon-btn"
              onClick={() => setModal(null)}
              type="button"
              aria-label="Close"
              style={{ width: '32px', height: '32px', borderRadius: '999px' }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
          </header>
          <div className="modal-body" style={{ textAlign: 'center', padding: '24px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/pawtify.png"
              alt="Pawtify"
              style={{ width: '72px', height: '72px', margin: '0 auto 16px', borderRadius: '16px' }}
            />
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px' }}>
              Pawtify <span className="you-version-badge">v1.0.0</span>
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
              A privacy-friendly, browser-based static music player featuring local playlist controls
              and distraction-free streaming. Built with TypeScript, React, and Next.js.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                className="btn btn-soft"
                onClick={() => setModal(null)}
                type="button"
                style={{ padding: '8px 24px' }}
              >
                Close
              </button>
            </div>
          </div>
        </article>
      </section>
    );
  }

  return null;
}
