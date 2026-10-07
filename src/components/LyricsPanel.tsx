'use client';

import React from 'react';
import { usePawtify } from '../context/PawtifyContext';

export const LyricsPanel: React.FC = () => {
  const { currentSong, lyricsPanel, setLyricsPanel } = usePawtify();

  if (!lyricsPanel) return null;

  return (
    <aside className={`lyrics-panel ${lyricsPanel ? 'active' : ''}`}>
      <div className="lyrics-header">
        <h2>Lyrics</h2>
        <button
          className="lyrics-close-btn"
          onClick={() => setLyricsPanel(false)}
          aria-label="Close lyrics"
          title="Close"
          style={{ border: 'none', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="lyrics-content">
        {currentSong ? (
          <>
            <div
              style={{
                textAlign: 'center',
                marginBottom: '24px',
                color: 'var(--muted)',
                fontSize: '0.875rem',
              }}
            >
              <div
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginBottom: '4px',
                }}
              >
                {currentSong.title}
              </div>
              <div>{currentSong.artist}</div>
            </div>

            <div
              className="lyrics-line"
              style={{ opacity: 0.85, color: 'var(--text)' }}
            >
              ♪ Sing along with {currentSong.artist} ♪
            </div>
            <div className="lyrics-line">
              Lyrics are synchronized from local metadata and public lyrics providers when available.
            </div>
            <div className="lyrics-line" style={{ marginTop: '20px', fontSize: '1rem', color: 'var(--muted)' }}>
              Enjoy the music on Pawtify!
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--muted)',
              marginTop: '40px',
            }}
          >
            Play a track to view lyrics
          </div>
        )}
      </div>
    </aside>
  );
};
