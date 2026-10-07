'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import { SongRow } from '@/components/common/SongRow';
import {
  ArtistSearchCard,
  PlaylistSearchCard,
  SongRowSkeleton,
  CardSkeleton,
} from '@/components/common/Cards';
import { fetchSearchSuggestions } from '@/services/musicApiService';
import { Playlist } from '@/types/music';

const TRENDING_SEARCH_SHORTCUTS = [
  { label: 'Prateek Kuhad', icon: 'fa-guitar' },
  { label: 'Arijit Singh', icon: 'fa-microphone' },
  { label: 'Lo-Fi Chill', icon: 'fa-headphones' },
  { label: 'Anuv Jain', icon: 'fa-heart' },
  { label: 'Desi Hip Hop', icon: 'fa-fire' },
  { label: 'Indie Rock', icon: 'fa-bolt' },
  { label: 'Late Night', icon: 'fa-moon' },
];

const SEARCH_CATEGORIES = [
  { name: 'Bollywood Hits', color: 'linear-gradient(135deg, #f97316, #c2410c)' },
  { name: 'Punjabi Pop', color: 'linear-gradient(135deg, #f43f5e, #c026d3)' },
  { name: 'Lo-Fi Chill', color: 'linear-gradient(135deg, #6366f1, #3b82f6)' },
  { name: 'Desi Hip Hop', color: 'linear-gradient(135deg, #10b981, #059669)' },
  { name: 'Sufi Soul', color: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  { name: 'Workout', color: 'linear-gradient(135deg, #ef4444, #b91c1c)' },
  { name: 'Tamil Classics', color: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' },
  { name: 'Telugu Top 50', color: 'linear-gradient(135deg, #14b8a6, #0f766e)' },
  { name: 'Indie India', color: 'linear-gradient(135deg, #ec4899, #be185d)' },
  { name: 'Devotional', color: 'linear-gradient(135deg, #0ea5e9, #0369a1)' },
  { name: 'Romantic', color: 'linear-gradient(135deg, #fb7185, #e11d48)' },
  { name: 'Ghazals', color: 'linear-gradient(135deg, #a855f7, #7e22ce)' },
];

export function SearchView() {
  const {
    searchQuery,
    setSearchQuery,
    searchTab,
    setSearchTab,
    searchResults,
    searchLoading,
    recentSearches,
    saveRecentSearch,
    saveRecentItem,
    removeRecentSearch,
    clearSearchHistory,
    runSearch,
    navigate,
  } = useLibrary();

  const { play } = usePlayer();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const hasQuery = searchQuery.trim().length > 0;
  const recentQueries = recentSearches.filter((item) => item.type === 'query').slice(0, 8);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    setShowDropdown(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (val.trim()) {
      fetchSearchSuggestions(val.trim()).then((res) => {
        setSuggestions(res);
      });
      debounceTimerRef.current = setTimeout(() => {
        runSearch(val.trim());
      }, 500);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setShowDropdown(false);
      const q = searchQuery.trim();
      if (q) {
        saveRecentSearch(q);
        runSearch(q);
      }
    }
  };

  const handleSelectQuery = (q: string) => {
    setSearchQuery(q);
    setShowDropdown(false);
    saveRecentSearch(q);
    runSearch(q);
  };

  const handleClear = () => {
    setSearchQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  const handleOpenPlaylist = (playlist: Playlist) => {
    saveRecentItem('playlist', {
      id: playlist.id,
      title: playlist.name,
      subtitle: 'Playlist',
      imageUrl: playlist.coverUrl,
    });
    navigate(`/playlist/${encodeURIComponent(playlist.id)}`);
  };

  return (
    <section className="page">
      <div
        className="page-header"
        style={{ flexDirection: 'column', alignItems: 'flex-start', marginBottom: '20px', gap: '14px' }}
      >
        <h1 className="page-title">Search</h1>
        <div className="search-container" style={{ position: 'relative' }}>
          <i className="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            type="text"
            id="search-input"
            className="search-input"
            placeholder="What do you want to listen to?"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowDropdown(true)}
            autoComplete="off"
          />
          {hasQuery && (
            <button
              className="clear-search"
              onClick={handleClear}
              type="button"
              aria-label="Clear Search"
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: '1rem' }}></i>
            </button>
          )}

          {showDropdown && (
            <div id="search-dynamic-ui">
              {hasQuery && suggestions.length > 0 ? (
                <div className="recent-searches-dropdown">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      className="recent-search-item"
                      onClick={() => handleSelectQuery(s)}
                      type="button"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-main)',
                        textAlign: 'left',
                        cursor: 'pointer',
                        width: '100%',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'none' }}>
                        <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--muted)' }}></i>
                        <span>{s}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ) : !hasQuery && recentQueries.length > 0 ? (
                <div className="recent-searches-dropdown">
                  <div
                    style={{
                      padding: '12px 16px',
                      fontSize: '0.85rem',
                      color: 'var(--text-sub)',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    Recent Searches
                  </div>
                  {recentQueries.map((item, i) => (
                    <div
                      key={i}
                      className="recent-search-item"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        width: '100%',
                      }}
                    >
                      <button
                        onClick={() => handleSelectQuery(item.query || '')}
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: 'none',
                          border: 'none',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          flex: 1,
                          textAlign: 'left',
                        }}
                      >
                        <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--muted)' }}></i>
                        <span>{item.query}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRecentSearch('query', item.query || '');
                        }}
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '4px' }}
                        title="Remove"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div
          className="search-shortcuts-bar"
          style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '2px 0 4px', maxWidth: '100%', scrollbarWidth: 'none' }}
        >
          {TRENDING_SEARCH_SHORTCUTS.map((item, i) => (
            <button
              key={i}
              className="btn btn-soft search-shortcut-chip"
              onClick={() => handleSelectQuery(item.label)}
              type="button"
              style={{
                whiteSpace: 'nowrap',
                fontSize: '0.8125rem',
                padding: '6px 14px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <i className={`fa-solid ${item.icon}`} style={{ fontSize: '0.75rem', color: 'var(--green)' }}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div id="search-content-area" style={{ width: '100%' }}>
        {hasQuery ? (
          <div>
            <div className="tab-list">
              <button
                className={`tab-btn ${searchTab === 'songs' ? 'active' : ''}`}
                onClick={() => setSearchTab('songs')}
                type="button"
              >
                Songs
              </button>
              <button
                className={`tab-btn ${searchTab === 'artists' ? 'active' : ''}`}
                onClick={() => setSearchTab('artists')}
                type="button"
              >
                Artists
              </button>
              <button
                className={`tab-btn ${searchTab === 'playlists' ? 'active' : ''}`}
                onClick={() => setSearchTab('playlists')}
                type="button"
              >
                Playlists
              </button>
            </div>

            {searchLoading ? (
              searchTab === 'songs' ? (
                <div className="song-table">
                  {Array(8)
                    .fill('')
                    .map((_, i) => (
                      <SongRowSkeleton key={i} />
                    ))}
                </div>
              ) : (
                <div className="card-grid">
                  {Array(8)
                    .fill('')
                    .map((_, i) => (
                      <CardSkeleton key={i} isRound={searchTab === 'artists'} />
                    ))}
                </div>
              )
            ) : searchTab === 'songs' ? (
              <div className="song-table">
                {searchResults.songs.length > 0 ? (
                  searchResults.songs.map((s, i) => (
                    <SongRow key={s.id + i} song={s} index={i + 1} source="search" />
                  ))
                ) : (
                  <div className="empty-state">
                    <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2rem', color: 'var(--muted)', marginBottom: '12px' }}></i>
                    <h2>No results found</h2>
                    <p>We couldn&apos;t find anything matching &quot;{searchQuery}&quot;. Check your spelling or try a different search.</p>
                    <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '480px' }}>
                      <button className="btn btn-soft" onClick={() => handleSelectQuery('Prateek Kuhad')} type="button" style={{ fontSize: '0.8125rem', padding: '6px 14px', borderRadius: '999px' }}>
                        Prateek Kuhad
                      </button>
                      <button className="btn btn-soft" onClick={() => handleSelectQuery('Lo-Fi Chill')} type="button" style={{ fontSize: '0.8125rem', padding: '6px 14px', borderRadius: '999px' }}>
                        Lo-Fi Chill
                      </button>
                      <button className="btn btn-soft" onClick={() => handleSelectQuery('Arijit Singh')} type="button" style={{ fontSize: '0.8125rem', padding: '6px 14px', borderRadius: '999px' }}>
                        Arijit Singh
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : searchTab === 'artists' ? (
              <div className="card-grid">
                {searchResults.artists.length > 0 ? (
                  searchResults.artists.map((a, i) => (
                    <ArtistSearchCard key={a.id + i} artist={a} />
                  ))
                ) : (
                  <div className="empty-state">
                    <h2>No artists found</h2>
                    <p>Try searching for a different name.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="card-grid">
                {searchResults.playlists.length > 0 ? (
                  searchResults.playlists.map((p, i) => (
                    <PlaylistSearchCard key={p.id + i} playlist={p} onOpen={handleOpenPlaylist} />
                  ))
                ) : (
                  <div className="empty-state">
                    <h2>No playlists found</h2>
                    <p>Try searching with different keywords.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {recentQueries.length > 0 && (
              <div className="search-recent-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text)' }}>Recent searches</h2>
                  <button
                    className="btn btn-soft"
                    onClick={clearSearchHistory}
                    type="button"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px', color: 'var(--muted)' }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {recentQueries.map((item, i) => (
                    <div
                      key={i}
                      className="recent-search-pill"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <button
                        className="recent-search-text-btn"
                        onClick={() => handleSelectQuery(item.query || '')}
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: 'var(--text)',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                        }}
                      >
                        <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: '0.75rem', color: 'var(--muted)' }}></i>
                        <span>{item.query}</span>
                      </button>
                      <button
                        className="recent-search-del-btn"
                        onClick={() => removeRecentSearch('query', item.query || '')}
                        type="button"
                        aria-label="Remove search"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                        title="Remove"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="search-trending-section">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text)' }}>
                Trending searches
              </h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {TRENDING_SEARCH_SHORTCUTS.map((item, i) => (
                  <button
                    key={i}
                    className="btn btn-soft"
                    onClick={() => handleSelectQuery(item.label)}
                    type="button"
                    style={{
                      fontSize: '0.8125rem',
                      padding: '6px 14px',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="search-categories-section">
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', color: 'var(--text)' }}>
                Browse all
              </h2>
              <div className="category-grid">
                {SEARCH_CATEGORIES.map((cat, i) => (
                  <div
                    key={i}
                    className="category-card"
                    onClick={() => handleSelectQuery(cat.name)}
                    tabIndex={0}
                    style={{ background: cat.color, cursor: 'pointer' }}
                  >
                    <span>{cat.name}</span>
                    <div className="bg-accent"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
