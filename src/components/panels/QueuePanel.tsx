'use client';

import React from 'react';
import { usePlayer } from '@/context/PlayerContext';

export function QueuePanel() {
  const {
    queuePanel,
    setQueuePanel,
    queue,
    currentSongIndex,
    clearQueue,
    removeFromQueue,
    play,
  } = usePlayer();

  if (!queuePanel) return null;

  const nowPlaying =
    currentSongIndex >= 0 && currentSongIndex < queue.length ? queue[currentSongIndex] : null;
  const upcoming = queue.slice(currentSongIndex + 1);
  const previous = queue.slice(0, currentSongIndex);

  return (
    <div className="queue-panel active" id="queue-panel">
      <div className="queue-header">
        <h2>
          <i className="fa-solid fa-list-ul" style={{ marginRight: '8px', color: 'var(--green)' }}></i>
          Queue
        </h2>
        <div className="queue-header-actions">
          <button className="queue-clear-btn" onClick={clearQueue} type="button">
            Clear
          </button>
          <button
            className="queue-close-btn"
            onClick={() => setQueuePanel(false)}
            type="button"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      </div>

      <div className="queue-list">
        {!queue.length && (
          <div className="empty-state">
            <i className="fa-solid fa-list-ul"></i>
            <h2>Queue is empty</h2>
            <p>Add songs to start listening.</p>
          </div>
        )}

        {nowPlaying && (
          <>
            <div className="queue-section-title">Now Playing</div>
            <div className="queue-item active" role="button">
              <div className="queue-item-index">
                <i className="fa-solid fa-volume-high" style={{ fontSize: '0.75rem' }}></i>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="queue-item-cover" src={nowPlaying.coverUrl} alt="" />
              <div className="queue-item-info">
                <div className="queue-item-title">{nowPlaying.title}</div>
                <div className="queue-item-artist">{nowPlaying.artist}</div>
              </div>
            </div>
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <div className="queue-section-title">Next Up</div>
            {upcoming.map((s, i) => (
              <div
                key={s.id + i}
                className="queue-item"
                onClick={() => play(s, queue, true)}
                role="button"
                style={{ cursor: 'pointer' }}
              >
                <div className="queue-item-index">{currentSongIndex + i + 2}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="queue-item-cover" src={s.coverUrl} alt="" />
                <div className="queue-item-info">
                  <div className="queue-item-title">{s.title}</div>
                  <div className="queue-item-artist">{s.artist}</div>
                </div>
                <button
                  className="queue-item-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFromQueue(s.id);
                  }}
                  type="button"
                  aria-label="Remove"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ))}
          </>
        )}

        {previous.length > 0 && (
          <>
            <div className="queue-section-title">Previous</div>
            {previous.map((s, i) => (
              <div
                key={s.id + i}
                className="queue-item"
                onClick={() => play(s, queue, true)}
                role="button"
                style={{ cursor: 'pointer' }}
              >
                <div className="queue-item-index">{i + 1}</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="queue-item-cover" src={s.coverUrl} alt="" />
                <div className="queue-item-info">
                  <div className="queue-item-title">{s.title}</div>
                  <div className="queue-item-artist">{s.artist}</div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
