import { escapeHTML } from '../utils/utils.js';
import { state } from '../config/config.js';
import { getSongById, dedupeSongs } from '../core/details.js';


export function renderSongRowSkeleton() {
  return `
    <div class="skeleton-song-row">
      <div class="skeleton skeleton-cover-sm"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text-main" style="width: 60%;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 40%;"></div>
      </div>
      <div class="skeleton skeleton-text-sub" style="width: 32px; margin-left: auto;"></div>
    </div>
  `;
}

export function renderCardSkeleton(isRound = false) {
  return `
    <div class="skeleton-card">
      <div class="skeleton skeleton-card-cover" style="border-radius: ${isRound ? '50%' : 'var(--radius-md)'}; margin-bottom: 12px; aspect-ratio: 1/1;"></div>
      <div class="skeleton skeleton-card-title" style="margin-left: 0;"></div>
      <div class="skeleton skeleton-card-meta" style="margin-left: 0;"></div>
    </div>
  `;
}

export function renderHomeGridSkeleton() {
  return `
    <div class="home-grid-card" style="pointer-events:none;">
      <div class="skeleton" style="width:56px; height:56px; flex-shrink:0;"></div>
      <div class="skeleton skeleton-text-main" style="width: 70%; margin: 0;"></div>
    </div>
  `;
}

export function renderHomeScrollSkeleton() {
  return `
    <div class="home-scroll-card" style="pointer-events:none;">
      <div class="skeleton" style="width:140px; height:140px; border-radius:var(--radius-md); margin-bottom:12px; aspect-ratio: 1/1;"></div>
      <div class="skeleton skeleton-text-main" style="width: 80%; margin: 0 0 8px 0; border-radius: 4px;"></div>
      <div class="skeleton skeleton-text-sub" style="width: 50%; margin: 0; border-radius: 4px;"></div>
    </div>
  `;
}

export function renderHomeGridCard(song, source, playlistId = '') {
  if (!song) return '';
  return `
    <article class="home-grid-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
      <img src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" loading="lazy" />
      <span>${escapeHTML(song.title)}</span>
    </article>
  `;
}

export function renderHomeScrollCard(song, index, source, playlistId = '') {
  if (!song) return '';
  return `
    <article class="home-scroll-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
      <div class="scroll-cover-wrap">
        <img src="${escapeHTML(song.coverUrl)}" alt="${escapeHTML(song.title)}" loading="lazy" />
      </div>
      <h3>${escapeHTML(song.title)}</h3>
      <p>${escapeHTML(song.artist)}</p>
    </article>
  `;
}

export function renderSearchResults() {
  const songs = state.searchResults.songs || [];
  const artists = state.searchResults.artists || [];
  const playlists = state.searchResults.playlists || [];

  let content = '';

  if (state.searchLoading) {
    if (state.searchTab === 'songs') {
      content = `<div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>`;
    } else {
      content = `<div class="card-grid">${Array(8).fill('').map(() => renderCardSkeleton(state.searchTab === 'artists')).join('')}</div>`;
    }
  } else {
    if (state.searchTab === 'songs') {
      content = `<div class="song-table">${songs.length ? songs.map((s, i) => renderSongRow(s, i + 1, 'search')).join('') : '<div class="empty-state"><i class="fa-solid fa-music"></i><h2>No songs found</h2><p>Try searching with different keywords.</p></div>'}</div>`;
    } else if (state.searchTab === 'artists') {
      content = `<div class="card-grid">${artists.length ? artists.map((a, i) => renderArtistSearchCard(a, i)).join('') : '<div class="empty-state"><i class="fa-solid fa-microphone"></i><h2>No artists found</h2><p>Try searching with different keywords.</p></div>'}</div>`;
    } else {
      content = `<div class="card-grid">${playlists.length ? playlists.map((p, i) => renderPlaylistSearchCard(p, i)).join('') : '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>No playlists found</h2><p>Try searching with different keywords.</p></div>'}</div>`;
    }
  }

  return `
    <div class="tab-list">
      <button class="tab-btn ${state.searchTab === 'songs' ? 'active' : ''}" data-action="set-search-tab" data-value="songs" type="button">Songs</button>
      <button class="tab-btn ${state.searchTab === 'artists' ? 'active' : ''}" data-action="set-search-tab" data-value="artists" type="button">Artists</button>
      <button class="tab-btn ${state.searchTab === 'playlists' ? 'active' : ''}" data-action="set-search-tab" data-value="playlists" type="button">Playlists</button>
    </div>
    ${content}
  `;
}

export function renderSearchPage() {
  const hasQuery = state.searchQuery.trim().length > 0;
  return `
    <section class="page">
      <div class="page-header" style="flex-direction:column; align-items:flex-start; margin-bottom: 24px; gap: 16px;">
        <h1 class="page-title">Search</h1>
        <div class="search-container">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" id="search-input" class="search-input" placeholder="What do you want to listen to?" value="${escapeHTML(state.searchQuery)}" />
          ${hasQuery ? `<button class="clear-search" type="button" aria-label="Clear Search"><i class="fa-solid fa-xmark" style="font-size: 1rem;"></i></button>` : ''}
        </div>
      </div>
      ${hasQuery ? renderSearchResults() : renderSearchCategories()}
    </section>
  `;
}
export function renderLibraryPage() {
  let tabContent = '';
  
  if (state.isLoading) {
    if (state.libraryTab === 'playlists') {
      tabContent = `<div class="card-grid">${Array(8).fill('').map(() => renderCardSkeleton()).join('')}</div>`;
    } else {
      tabContent = `<div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>`;
    }
  } else {
    if (state.libraryTab === 'playlists') {
      tabContent = `<div class="card-grid">${state.playlists.length ? state.playlists.map((p, i) => renderPlaylistCard(p, i)).join('') : '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>No playlists yet</h2><p>Create a playlist to get started.</p></div>'}</div>`;
    } else if (state.libraryTab === 'favorites') {
      tabContent = `<div class="song-table">${state.favorites.length ? state.favorites.map((s, i) => renderSongRow(s, i + 1, 'favorites')).join('') : '<div class="empty-state"><i class="fa-solid fa-heart"></i><h2>No favorites yet</h2><p>Like a song to add it here.</p></div>'}</div>`;
    } else {
      const uniqueAddedSongs = dedupeSongs(
        [...state.favorites, ...state.playlists.flatMap((p) => p.songs)]
          .filter((s) => s.addedAt)
          .sort((a, b) => b.addedAt - a.addedAt)
      );
      const recentSongs = uniqueAddedSongs.slice(0, 50);
      tabContent = `<div class="song-table">${recentSongs.length ? recentSongs.map((s, i) => renderSongRow(s, i + 1, 'recent')).join('') : '<div class="empty-state"><i class="fa-solid fa-clock-rotate-left"></i><h2>No recent songs</h2><p>Your recent activity will appear here.</p></div>'}</div>`;
    }
  }

  return `
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">Your Library</h1>
      </div>
      <div class="tab-list">
        <button class="tab-btn ${state.libraryTab === 'recent' ? 'active' : ''}" data-action="set-library-tab" data-value="recent" type="button">Recently Added</button>
        <button class="tab-btn ${state.libraryTab === 'favorites' ? 'active' : ''}" data-action="set-library-tab" data-value="favorites" type="button">Favorites</button>
        <button class="tab-btn ${state.libraryTab === 'playlists' ? 'active' : ''}" data-action="set-library-tab" data-value="playlists" type="button">Playlists</button>
      </div>
      ${tabContent}
    </section>
  `;
}

export function renderPlaylistPage(playlistId) {
  let playlist;
  if (playlistId === 'history') {
    const historySongs = state.recentlyPlayed
      .map((id) => getSongById(id))
      .filter(Boolean);
    playlist = {
      id: 'history',
      name: 'Listening History',
      songs: historySongs,
      isSystem: true,
    };
  } else {
    playlist = state.playlists.find((p) => p.id === playlistId);
    if (!playlist && state.ytPlaylists && state.ytPlaylists[playlistId]) {
      playlist = state.ytPlaylists[playlistId];
    }
  }
  if (!playlist) return '<div class="empty-state">Playlist not found.</div>';
  
  if (playlist.isLoading) {
    return `<section class="page">
    <div class="page-header" style="display:flex; align-items:center; gap:24px; padding-bottom:24px;">
      <div class="skeleton" style="width:160px; height:160px; border-radius:var(--radius-md);"></div>
      <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
        <div class="skeleton skeleton-text-main" style="width:100px; height:14px; border-radius:4px;"></div>
        <div class="skeleton skeleton-text-main" style="width:60%; height:48px; border-radius:8px;"></div>
        <div class="skeleton skeleton-text-sub" style="width:40%; height:14px; border-radius:4px;"></div>
      </div>
    </div>
    <div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>
  </section>`;
  }
  
  const coverUrl = playlist.coverUrl || (playlist.songs && playlist.songs.length > 0 ? playlist.songs[0].coverUrl : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300');
  
  return `
    <section class="page" style="padding-top: 0;">
      <div style="margin-bottom: 24px; margin-top: 16px;">
        <button class="btn btn-soft" data-action="navigate" data-path="/" type="button" style="padding: 8px 16px; font-size: 0.875rem;">
          <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back to Home
        </button>
      </div>
      <div class="hero-player" style="margin-bottom: 32px; border-radius: var(--radius-lg); background: var(--glass-surface); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid var(--glass-border); padding: 32px;">
        <img class="hero-cover" src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" />
        <div class="hero-info" style="display: flex; flex-direction: column; justify-content: flex-end;">
          <h4 style="text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.1em; margin-bottom: 8px; color: var(--muted);">Playlist</h4>
          <h1 class="hero-title" style="font-size: 3rem; line-height: 1.1; margin-bottom: 16px; font-family: var(--font-display); font-weight: 800;">${escapeHTML(playlist.name)}</h1>
          <p class="hero-artist" style="margin-bottom: 24px; color: var(--muted);">
            ${playlist.isSystem ? 'System Playlist' : (playlist.songs ? playlist.songs.length : 0) + ' songs'}
          </p>
          <div class="hero-actions" style="display: flex; gap: 12px;">
            <button class="btn btn-primary" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button">
              <i class="fa-solid fa-play"></i> Play All
            </button>
            <button class="btn btn-soft" data-action="share-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Share Playlist">
              <i class="fa-solid fa-share-nodes"></i> Share
            </button>
            ${
              playlist.id !== 'default' && !playlist.isSystem
                ? `<button class="btn btn-danger" data-action="delete-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Delete Playlist"><i class="fa-solid fa-trash"></i></button>`
                : ''
            }
          </div>
        </div>
      </div>
      <div class="song-table">
        ${playlist.songs && playlist.songs.length ? playlist.songs.map((s, i) => renderSongRow(s, i + 1, 'playlist', playlist.id)).join('') : '<div class="empty-state">This playlist is empty. Search for songs to add them.</div>'}
      </div>
    </section>
  `;
}

export function renderSongRow(song, index, source, playlistId = '') {
  if (!song) return '';
  const active = state.currentSong?.id === song.id;
  const isFav = state.favorites.some((item) => item.id === song.id);
  return `
     <div class="song-row ${active ? 'active' : ''}" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
       <div class="song-index">
         ${active && state.isPlaying ? '<i class="fa-solid fa-volume-high" style="font-size:0.75rem;"></i>' : `<span>${index}</span>`}
       </div>
       <img class="song-cover-sm" src="${escapeHTML(song.coverUrl)}" alt="" />
       <div class="song-info">
         <div class="song-title">${escapeHTML(song.title)}</div>
         <div class="song-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}" onclick="event.stopPropagation();">${escapeHTML(song.artist)}</div>
       </div>
       <div class="song-duration">${escapeHTML(song.duration || '0:00')}</div>
       <button class="song-action-btn ${isFav ? 'active' : ''}" data-action="toggle-favorite" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();" title="Toggle Favorite">
         <i class="${isFav ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
       </button>
       <button class="song-action-btn" data-action="open-playlist-picker" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();" title="Add to Playlist">
         <i class="fa-solid fa-plus"></i>
       </button>
       <button class="song-action-btn" data-action="share-specific-song" data-song-id="${escapeHTML(song.id)}" type="button" onclick="event.stopPropagation();" title="Share Song">
         <i class="fa-solid fa-share-nodes"></i>
       </button>
     </div>
   `;
}

export function renderPlaylistCard(playlist, index) {
  if (!playlist) return '';
  const coverUrl =
    playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0].coverUrl
      : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';
  return `
    <div class="card" data-action="navigate" data-path="/playlist/${escapeHTML(playlist.id)}" tabindex="0">
      <div class="card-img-wrap">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" />
        <button class="card-play-btn" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Play ${escapeHTML(playlist.name)}" onclick="event.stopPropagation();">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <div class="card-title">${escapeHTML(playlist.name)}</div>
      <div class="card-meta">${playlist.isSystem ? 'System Playlist' : (playlist.songs ? playlist.songs.length : 0) + ' songs'}</div>
    </div>
  `;
}

export function renderPlaylistSearchCard(playlist, index) {
  if (!playlist) return '';
  const coverUrl =
    playlist.imageUrl ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';
  return `
    <div class="card" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(playlist.id)}" tabindex="0">
      <div class="card-img-wrap">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" />
      </div>
      <div class="card-title">${escapeHTML(playlist.name)}</div>
      <div class="card-meta">${escapeHTML(playlist.uploaderName || 'Playlist')}</div>
    </div>
  `;
}

export function renderArtistSearchCard(artist, index) {
  if (!artist) return '';
  const coverUrl =
    artist.imageUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300';
  return `
    <div class="card" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" tabindex="0">
      <div class="card-img-wrap" style="border-radius: 50%; overflow: hidden; margin-bottom: 12px; aspect-ratio: 1/1;">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(artist.name)}" loading="lazy" style="object-fit: cover; width: 100%; height: 100%;" />
      </div>
      <div class="card-title" style="text-align: center;">${escapeHTML(artist.name)}</div>
      <div class="card-meta" style="text-align: center;">Artist</div>
    </div>
  `;
}


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

export function renderSearchCategories() {
  return `
    <div style="margin-top: 8px;">
      <h2 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 16px;">Browse All</h2>
      <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px;">
        ${SEARCH_CATEGORIES.map(cat => `
          <div class="category-card" data-action="search-category" data-category="${escapeHTML(cat.name)}" tabindex="0" style="background: ${cat.color};">
            <span>${escapeHTML(cat.name)}</span>
            <div class="bg-accent"></div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
