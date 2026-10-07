'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';

export function LyricsPanel() {
  const { lyricsPanel, setLyricsPanel, currentSong } = usePlayer();

  if (!lyricsPanel) return null;

  return (
    <div className="lyrics-panel active" id="lyrics-panel">
      <div className="lyrics-header">
        <button
          className="icon-btn"
          onClick={() => setLyricsPanel(false)}
          type="button"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div className="lyrics-body">
        <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
          <i
            className="fa-solid fa-microphone"
            style={{ fontSize: '2.5rem', marginBottom: '16px', color: 'var(--green)' }}
          ></i>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
            {currentSong ? currentSong.title : 'Lyrics'}
          </h2>
          <p style={{ color: 'var(--muted)', marginBottom: '16px' }}>
            {currentSong ? currentSong.artist : ''}
          </p>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '0.9rem',
              maxWidth: '320px',
              margin: '0 auto',
              lineHeight: 1.5,
            }}
          >
            Live synchronized lyrics are currently not available for this stream.
          </p>
        </div>
      </div>
    </div>
  );
}
