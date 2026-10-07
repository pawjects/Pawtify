'use client';

import React from 'react';
import { usePawtify } from '../context/PawtifyContext';
import { DEFAULT_COVER } from '../utils/helpers';

export const QueuePanel: React.FC = () => {
  const {
    queue,
    currentSongIndex,
    queuePanel,
    setQueuePanel,
    clearQueue,
    removeFromQueue,
    playSong,
    isPlaying,
  } = usePawtify();

  if (!queuePanel) return null;

  return (
    <aside className="queue-panel active">
      <div className="queue-header">
        <h2>Play Queue</h2>
        <div className="queue-header-actions">
          {queue.length > 0 && (
            <button
              className="queue-clear-btn"
              onClick={clearQueue}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              Clear Queue
            </button>
          )}
          <button
            className="queue-close-btn"
            onClick={() => setQueuePanel(false)}
            aria-label="Close queue"
            title="Close"
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>

      <div className="queue-list">
        {queue.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--muted)',
            }}
          >
            <i
              className="fa-solid fa-list-ul"
              style={{ fontSize: '2rem', marginBottom: '12px', display: 'block' }}
            />
            Your queue is empty
          </div>
        ) : (
          <>
            {/* Now Playing */}
            {queue[currentSongIndex] && (
              <>
                <div className="queue-section-title">Now Playing</div>
                <div
                  className="queue-item active"
                  onClick={() => playSong(queue[currentSongIndex])}
                >
                  <div className="queue-item-index">
                    {isPlaying ? (
                      <i className="fa-solid fa-volume-high" />
                    ) : (
                      <i className="fa-solid fa-play" />
                    )}
                  </div>
                  <img
                    src={
                      queue[currentSongIndex].coverUrl || DEFAULT_COVER
                    }
                    alt={queue[currentSongIndex].title}
                    className="queue-item-cover"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = DEFAULT_COVER;
                    }}
                  />
                  <div className="queue-item-info">
                    <span
                      className="queue-item-title"
                      style={{ color: 'var(--green)' }}
                    >
                      {queue[currentSongIndex].title}
                    </span>
                    <span className="queue-item-artist">
                      {queue[currentSongIndex].artist}
                    </span>
                  </div>
                </div>
              </>
            )}

            {/* Next Up */}
            {queue.slice(currentSongIndex + 1).length > 0 && (
              <>
                <div className="queue-section-title">Next Up</div>
                {queue.slice(currentSongIndex + 1).map((song, idx) => {
                  const actualIndex = currentSongIndex + 1 + idx;
                  return (
                    <div
                      key={`${song.id}-${actualIndex}`}
                      className="queue-item"
                      onClick={() => playSong(song, queue, actualIndex)}
                    >
                      <div className="queue-item-index">{actualIndex + 1}</div>
                      <img
                        src={song.coverUrl || DEFAULT_COVER}
                        alt={song.title}
                        className="queue-item-cover"
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = DEFAULT_COVER;
                        }}
                      />
                      <div className="queue-item-info">
                        <span className="queue-item-title">{song.title}</span>
                        <span className="queue-item-artist">{song.artist}</span>
                      </div>
                      <button
                        className="queue-item-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(actualIndex);
                        }}
                        title="Remove from queue"
                        aria-label="Remove"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* Previously Played in Queue */}
            {currentSongIndex > 0 && (
              <>
                <div className="queue-section-title">Previous</div>
                {queue.slice(0, currentSongIndex).map((song, idx) => (
                  <div
                    key={`${song.id}-prev-${idx}`}
                    className="queue-item"
                    style={{ opacity: 0.6 }}
                    onClick={() => playSong(song, queue, idx)}
                  >
                    <div className="queue-item-index">{idx + 1}</div>
                    <img
                      src={song.coverUrl || DEFAULT_COVER}
                      alt={song.title}
                      className="queue-item-cover"
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = DEFAULT_COVER;
                      }}
                    />
                    <div className="queue-item-info">
                      <span className="queue-item-title">{song.title}</span>
                      <span className="queue-item-artist">{song.artist}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
