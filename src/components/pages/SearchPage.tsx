'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePawtify } from '../../context/PawtifyContext';
import { searchSongs, searchArtists, searchPlaylists, fetchSearchSuggestions } from '../../services/api';
import { SongRow } from '../SongRow';
import { Song } from '../../types';
import { DEFAULT_COVER } from '../../utils/helpers';

export const SearchPage: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    openArtistProfile,
    playSong,
    navigate,
  } = usePawtify();

  const [inputVal, setInputVal] = useState<string>(searchQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [playlists, setPlaylists] = useState<any[]>([]);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchQuery && searchQuery !== inputVal) {
      setInputVal(searchQuery);
      performSearch(searchQuery);
    }
  }, [searchQuery]);

  const performSearch = async (q: string) => {
    const query = q.trim();
    if (!query) {
      setSongs([]);
      setArtists([]);
      setPlaylists([]);
      setSuggestions([]);
      return;
    }

    setLoading(true);
    addRecentSearch({ type: 'query', query, timestamp: Date.now() });

    try {
      const [fetchedSongs, fetchedArtists, fetchedPlaylists] = await Promise.all([
        searchSongs(query, 20),
        searchArtists(query, 8),
        searchPlaylists(query, 8),
      ]);
      setSongs(fetchedSongs);
      setArtists(fetchedArtists);
      setPlaylists(fetchedPlaylists);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    setSearchQuery(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (val.trim().length > 1) {
      fetchSearchSuggestions(val.trim()).then((suggs) => {
        setSuggestions(suggs.slice(0, 6));
      });

      debounceTimerRef.current = setTimeout(() => {
        performSearch(val);
      }, 500);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (sugg: string) => {
    setInputVal(sugg);
    setSearchQuery(sugg);
    setSuggestions([]);
    performSearch(sugg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setSuggestions([]);
      performSearch(inputVal);
    }
  };

  const handleClear = () => {
    setInputVal('');
    setSearchQuery('');
    setSongs([]);
    setArtists([]);
    setPlaylists([]);
    setSuggestions([]);
  };

  return (
    <div className="page search-page">
      {/* Search Input Box */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '640px', marginBottom: '20px' }}>
        <i className="fa-solid fa-magnifying-glass search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="What do you want to listen to?"
          value={inputVal}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {inputVal && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute',
              right: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
            aria-label="Clear search"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}

        {/* Search Suggestions Dropdown */}
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: 'rgba(18, 22, 20, 0.95)',
              backdropFilter: 'blur(20px)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            {suggestions.map((sugg, i) => (
              <div
                key={i}
                className="search-dropdown-item"
                onClick={() => handleSelectSuggestion(sugg)}
                style={{
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                <i className="fa-solid fa-magnifying-glass" style={{ color: 'var(--muted)', fontSize: '0.8rem' }} />
                <span>{sugg}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        className="tab-list"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          marginBottom: '24px',
        }}
      >
        <button
          className={`tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          All
        </button>
        <button
          className={`tab-btn ${activeFilter === 'songs' ? 'active' : ''}`}
          onClick={() => setActiveFilter('songs')}
        >
          Songs
        </button>
        <button
          className={`tab-btn ${activeFilter === 'artists' ? 'active' : ''}`}
          onClick={() => setActiveFilter('artists')}
        >
          Artists
        </button>
        <button
          className={`tab-btn ${activeFilter === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveFilter('playlists')}
        >
          Playlists
        </button>
      </div>

      {/* When no search query: Recent Searches & Browse Tags */}
      {!inputVal && (
        <div>
          {recentSearches.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Searches</h3>
                <button
                  onClick={clearRecentSearches}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                  }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {recentSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      if (item.query) {
                        handleSelectSuggestion(item.query);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      color: 'var(--text)',
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--muted)', fontSize: '0.75rem' }} />
                    <span>{item.query || item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Browse Categories */}
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
              Browse Genres & Moods
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '12px',
              }}
            >
              {[
                { title: 'Pop', color: '#8d67ab' },
                { title: 'Indie', color: '#e8115b' },
                { title: 'Lo-Fi', color: '#148a08' },
                { title: 'Acoustic', color: '#bc5900' },
                { title: 'Rock', color: '#e91429' },
                { title: 'Chill', color: '#777777' },
                { title: 'Late Night', color: '#1e3264' },
                { title: 'Romance', color: '#b02897' },
              ].map((g, i) => (
                <div
                  key={i}
                  className="category-card"
                  onClick={() => handleSelectSuggestion(`${g.title} songs`)}
                  style={{
                    backgroundColor: g.color,
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    height: '100px',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{g.title}</span>
                  <div className="bg-accent" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '1.5rem', marginBottom: '8px', display: 'block' }} />
          Searching tracks, artists, and playlists...
        </div>
      )}

      {/* Search Results */}
      {!loading && inputVal && (
        <div>
          {/* Artists Section */}
          {(activeFilter === 'all' || activeFilter === 'artists') && artists.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Artists</h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: '16px',
                }}
              >
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="card"
                    onClick={() => openArtistProfile(artist.name, artist.imageUrl)}
                    style={{ textAlign: 'center', padding: '14px' }}
                  >
                    <img
                      src={artist.imageUrl || DEFAULT_COVER}
                      alt={artist.name}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        margin: '0 auto 10px',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
                      }}
                      onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = DEFAULT_COVER;
                      }}
                    />
                    <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{artist.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                      Artist
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Playlists Section */}
          {(activeFilter === 'all' || activeFilter === 'playlists') && playlists.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Playlists</h3>
              <div className="card-grid">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="card"
                    onClick={() => navigate(`#playlist/${pl.id}`)}
                  >
                    <div className="scroll-cover-wrap">
                      <img
                        src={pl.imageUrl || DEFAULT_COVER}
                        alt={pl.name}
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.onerror = null;
                          img.src = DEFAULT_COVER;
                        }}
                      />
                    </div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, marginTop: '8px' }}>
                      {pl.name}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '2px' }}>
                      {pl.uploaderName || 'Playlist'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Songs Section */}
          {(activeFilter === 'all' || activeFilter === 'songs') && songs.length > 0 && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>Songs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {songs.map((song, idx) => (
                  <SongRow
                    key={`${song.id}-${idx}`}
                    song={song}
                    index={idx}
                    queueContext={songs}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty search results */}
          {!loading &&
            songs.length === 0 &&
            artists.length === 0 &&
            playlists.length === 0 && (
              <div className="empty-state">
                <i className="fa-solid fa-magnifying-glass" />
                <h2>No results found for &ldquo;{inputVal}&rdquo;</h2>
                <p>Please check your spelling or search for another artist or song.</p>
              </div>
            )}
        </div>
      )}
    </div>
  );
};
