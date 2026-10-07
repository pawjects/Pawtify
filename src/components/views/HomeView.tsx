'use client';

import React, { useMemo } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import {
  HomeGridCard,
  HomeScrollCard,
  HomeGridSkeleton,
  HomeScrollSkeleton,
} from '@/components/common/Cards';

export function HomeView() {
  const { userName, feedCategories, feedLoading, playlists, favorites, navigate } = useLibrary();
  const { recentlyPlayed, queue } = usePlayer();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    let text = 'Good Evening';
    if (hour < 12) text = 'Good Morning';
    else if (hour < 18) text = 'Good Afternoon';

    if (userName) {
      return `${text}, ${userName}`;
    }
    return text;
  }, [userName]);

  // Diversified hero cards for top grid
  const heroCandidates = useMemo(() => {
    const list: Array<{ song: import('@/types/music').Song; source: string }> = [];
    feedCategories.forEach((cat) => {
      if (cat.songs[0]) list.push({ song: cat.songs[0], source: cat.id });
      if (cat.songs[1]) list.push({ song: cat.songs[1], source: cat.id });
    });
    return list;
  }, [feedCategories]);

  // Recently played songs resolved from queue/catalog
  const recentSongs = useMemo(() => {
    return recentlyPlayed
      .map((id) => queue.find((s) => s.id === id))
      .filter(Boolean) as import('@/types/music').Song[];
  }, [recentlyPlayed, queue]);

  return (
    <section className="page">
      <div className="home-greeting">
        <h1>{greeting}</h1>
        <button
          className="settings-btn"
          onClick={() => navigate('/you')}
          type="button"
          aria-label="Settings"
          title="Settings"
        >
          <i className="fa-solid fa-gear"></i>
        </button>
      </div>

      <div className="home-grid">
        {feedLoading ? (
          Array(6)
            .fill('')
            .map((_, i) => <HomeGridSkeleton key={i} />)
        ) : (
          <>
            {favorites.length > 0 && (
              <HomeGridCard song={favorites[0]} source="favorites" />
            )}
            {playlists[0]?.songs?.length > 0 && (
              <HomeGridCard
                song={playlists[0].songs[0]}
                source="playlist"
                playlistId={playlists[0].id}
              />
            )}
            {heroCandidates.slice(0, 4).map((h, i) => (
              <HomeGridCard key={h.song.id + i} song={h.song} source={h.source} />
            ))}
          </>
        )}
      </div>

      {feedLoading ? (
        Array(3)
          .fill('')
          .map((_, i) => (
            <div key={i} className="home-section">
              <div
                className="skeleton skeleton-text-main"
                style={{ width: '200px', height: '24px', marginBottom: '16px', marginLeft: '16px' }}
              ></div>
              <div className="home-scroll" style={{ display: 'flex', overflow: 'hidden', gap: '16px', padding: '0 16px' }}>
                {Array(4)
                  .fill('')
                  .map((__, j) => (
                    <HomeScrollSkeleton key={j} />
                  ))}
              </div>
            </div>
          ))
      ) : (
        <>
          {feedCategories.map((cat) => (
            <div key={cat.id} className="home-section">
              <h2 className="home-section-title">{cat.title}</h2>
              <div className="home-scroll">
                {cat.songs.map((song, i) => (
                  <HomeScrollCard
                    key={song.id + i}
                    song={song}
                    source={cat.id}
                  />
                ))}
              </div>
            </div>
          ))}

          {recentSongs.length > 0 && (
            <div className="home-section">
              <h2 className="home-section-title">Recently played</h2>
              <div className="home-scroll">
                {recentSongs.map((song, i) => (
                  <HomeScrollCard
                    key={song.id + i}
                    song={song}
                    source="queue"
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
