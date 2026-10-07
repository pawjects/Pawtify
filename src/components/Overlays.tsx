'use client';

import React, { useState } from 'react';
import { usePawtify } from '../context/PawtifyContext';
import { LOGO_URL, DEFAULT_COVER } from '../utils/helpers';

export const Overlays: React.FC = () => {
  const {
    modal,
    setModal,
    getSongById,
    currentSong,
    playlists,
    addSongToPlaylist,
    removeSongFromPlaylist,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    userName,
    setUserName,
    showToast,
  } = usePawtify();

  const [playlistNameInput, setPlaylistNameInput] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>(userName || '');
  const [renameInput, setRenameInput] = useState<string>('');

  if (!modal) return null;

  const handleClose = () => {
    setModal(null);
    setPlaylistNameInput('');
  };

  return (
    <div className="overlay" onClick={handleClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Song Details Modal */}
        {modal.type === 'songDetails' && (() => {
          const song =
            (modal.songId ? getSongById(modal.songId) : currentSong) || currentSong;
          if (!song) return null;

          return (
            <>
              <div className="modal-head">
                <h3 className="modal-title">Song Details</h3>
                <button
                  className="icon-btn"
                  onClick={handleClose}
                  aria-label="Close modal"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="modal-body">
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img
                    src={song.coverUrl || DEFAULT_COVER}
                    alt={song.title}
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = DEFAULT_COVER;
                    }}
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: 'var(--radius-sm)',
                      objectFit: 'cover',
                    }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {song.title}
                    </div>
                    <div
                      style={{
                        color: 'var(--muted)',
                        fontSize: '0.875rem',
                        marginTop: '4px',
                      }}
                    >
                      {song.artist}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Audio Stream</span>
                    <span style={{ color: 'var(--green)', fontWeight: 600 }}>
                      160 kbps Opus (High Quality)
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Format</span>
                    <span>Direct Web Audio</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Track ID</span>
                    <span style={{ fontFamily: 'monospace' }}>{song.id}</span>
                  </div>
                </div>

                <button
                  className="btn-primary"
                  onClick={() => {
                    const shareUrl = `${window.location.origin}/#song/${song.id}`;
                    navigator.clipboard.writeText(shareUrl).then(() => {
                      showToast('Track link copied!');
                      handleClose();
                    });
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--green)',
                    color: '#000',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <i className="fa-solid fa-share-nodes" />
                  <span>Copy Share Link</span>
                </button>
              </div>
            </>
          );
        })()}

        {/* Playlist Picker Modal */}
        {modal.type === 'playlistPicker' && (() => {
          const song = getSongById(modal.songId) || currentSong;
          if (!song) return null;

          return (
            <>
              <div className="modal-head">
                <h3 className="modal-title">Add to Playlist</h3>
                <button
                  className="icon-btn"
                  onClick={handleClose}
                  aria-label="Close modal"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="modal-body">
                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {playlists.map((pl) => {
                    const inPl = pl.songs.some((s) => s.id === song.id);
                    return (
                      <div
                        key={pl.id}
                        onClick={() => {
                          if (inPl) {
                            removeSongFromPlaylist(pl.id, song.id);
                          } else {
                            addSongToPlaylist(pl.id, song);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-md)',
                          background: inPl
                            ? 'rgba(29, 185, 84, 0.12)'
                            : 'rgba(255, 255, 255, 0.04)',
                          cursor: 'pointer',
                          border: inPl
                            ? '1px solid rgba(29, 185, 84, 0.3)'
                            : '1px solid transparent',
                        }}
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                          {pl.name} ({pl.songs.length})
                        </span>
                        <i
                          className={`fa-solid ${inPl ? 'fa-check' : 'fa-plus'}`}
                          style={{
                            color: inPl ? 'var(--green)' : 'var(--muted)',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '8px',
                    paddingTop: '12px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="text"
                    placeholder="New playlist name..."
                    value={playlistNameInput}
                    onChange={(e) => setPlaylistNameInput(e.target.value)}
                    className="text-input"
                    style={{ flex: 1 }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && playlistNameInput.trim()) {
                        const newPl = createPlaylist(playlistNameInput);
                        addSongToPlaylist(newPl.id, song);
                        setPlaylistNameInput('');
                      }
                    }}
                  />
                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (playlistNameInput.trim()) {
                        const newPl = createPlaylist(playlistNameInput);
                        addSongToPlaylist(newPl.id, song);
                        setPlaylistNameInput('');
                      }
                    }}
                    style={{
                      padding: '0 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--green)',
                      color: '#000',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Create
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* Create Playlist Modal */}
        {modal.type === 'createPlaylist' && (
          <>
            <div className="modal-head">
              <h3 className="modal-title">Create Playlist</h3>
              <button
                className="icon-btn"
                onClick={handleClose}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <label className="form-label">Playlist Name</label>
                <input
                  type="text"
                  placeholder="My Awesome Playlist"
                  value={playlistNameInput}
                  onChange={(e) => setPlaylistNameInput(e.target.value)}
                  className="text-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && playlistNameInput.trim()) {
                      createPlaylist(playlistNameInput);
                      handleClose();
                    }
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '12px',
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={handleClose}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'var(--text)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (playlistNameInput.trim()) {
                      createPlaylist(playlistNameInput);
                      handleClose();
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--green)',
                    color: '#000',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </>
        )}

        {/* Edit Playlist Modal */}
        {modal.type === 'editPlaylist' && (() => {
          const target = playlists.find((p) => p.id === modal.playlistId);
          if (!target) return null;

          return (
            <>
              <div className="modal-head">
                <h3 className="modal-title">Edit Playlist</h3>
                <button
                  className="icon-btn"
                  onClick={handleClose}
                  aria-label="Close modal"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                  }}
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-row">
                  <label className="form-label">Rename Playlist</label>
                  <input
                    type="text"
                    defaultValue={target.name}
                    onChange={(e) => setRenameInput(e.target.value)}
                    className="text-input"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '16px',
                  }}
                >
                  <button
                    onClick={() => {
                      deletePlaylist(target.id);
                      handleClose();
                    }}
                    style={{
                      background: 'rgba(226, 33, 52, 0.15)',
                      color: 'var(--danger)',
                      border: '1px solid rgba(226, 33, 52, 0.3)',
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Delete Playlist
                  </button>

                  <button
                    className="btn-primary"
                    onClick={() => {
                      if (renameInput.trim()) {
                        renamePlaylist(target.id, renameInput);
                      }
                      handleClose();
                    }}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--green)',
                      color: '#000',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </>
          );
        })()}

        {/* Welcome / Enter Name Modal */}
        {(modal.type === 'welcome' || modal.type === 'editName') && (
          <>
            <div className="modal-head">
              <h3 className="modal-title">
                {modal.type === 'welcome' ? 'Welcome to Pawtify' : 'Change Profile Name'}
              </h3>
              <button
                className="icon-btn"
                onClick={handleClose}
                aria-label="Close modal"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                }}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <img
                  src={LOGO_URL}
                  alt="Pawtify Logo"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--radius-md)',
                    margin: '0 auto 12px',
                    display: 'block',
                  }}
                />
                <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
                  {modal.type === 'welcome'
                    ? 'Enter your name to personalize your greetings and listening charts.'
                    : 'Update your display name across Pawtify.'}
                </p>
              </div>

              <div className="form-row">
                <input
                  type="text"
                  placeholder="Your Name..."
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="text-input"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nameInput.trim()) {
                      setUserName(nameInput.trim());
                      handleClose();
                    }
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  marginTop: '12px',
                }}
              >
                {modal.type === 'welcome' && (
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setUserName('Listener');
                      handleClose();
                    }}
                    style={{
                      padding: '10px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      color: 'var(--text)',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Skip
                  </button>
                )}
                <button
                  className="btn-primary"
                  onClick={() => {
                    if (nameInput.trim()) {
                      setUserName(nameInput.trim());
                    } else {
                      setUserName('Listener');
                    }
                    handleClose();
                  }}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--green)',
                    color: '#000',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Save & Continue
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
