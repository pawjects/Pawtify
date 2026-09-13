import { escapeHTML } from '../utils/utils.js';
import { state } from '../config/config.js';
import { getSongById } from '../core/details.js';

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

export function renderSearchPage() {
  const hasQuery = state.searchQuery.trim().length > 0;
  return `
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">Search</h1>
      </div>
      <div class="search-bar">
        <i class="fa-solid fa-magnifying-glass search-icon"></i>
        <input id="search-input" class="search-input" placeholder="Search Hindi indie, The Local Train, Anuv, Prateek, Mitraz..." autocomplete="off" onfocus="this.parentElement.classList.add('focused')" onblur="setTimeout(() => this.parentElement.classList.remove('focused'), 200)" />
        ${state.searchLoading ? '<div class="spinner" style="position:absolute;right:16px;top:50%;transform:translateY(-50%);"></div>' : ''}
        ${
          state.recentSearches.length && !hasQuery
            ? (() => {
                const queries = state.recentSearches.filter(
                  (i) => i.type === 'query'
                );
                const tracks = state.recentSearches.filter(
                  (i) => i.type === 'track'
                );
                const artists = state.recentSearches.filter(
                  (i) => i.type === 'artist'
                );
                const playlists = state.recentSearches.filter(
                  (i) => i.type === 'playlist'
                );

                let html = `
          <div class="search-dropdown">
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 16px; border-bottom:1px solid var(--border);">
              <span style="font-size:0.75rem; font-weight:700; text-transform:uppercase; color:var(--muted); letter-spacing:0.05em;">Recent Searches</span>
              <button class="btn btn-soft" style="padding:4px 8px; font-size:0.75rem; min-height:0;" data-action="clear-search-history" type="button">Clear</button>
            </div>
            <div style="max-height: 400px; overflow-y: auto; padding-bottom: 8px;">
          `;
                if (queries.length) {
                  html += queries
                    .map(
                      (item) => `
              <div class="search-dropdown-item">
                <i class="fa-solid fa-clock-rotate-left" style="color:var(--muted); width: 20px; text-align: center;"></i>
                <span style="flex:1; cursor:pointer; padding:12px 0;" data-action="use-recent-search" data-query="${escapeHTML(item.query)}">${escapeHTML(item.query)}</span>
                <button class="icon-btn" data-action="remove-recent-search" data-id="${escapeHTML(item.query)}" data-type="query" type="button"><i class="fa-solid fa-xmark"></i></button>
              </div>
            `
                    )
                    .join('');
                }

                const renderSection = (title, items, action, idField) => {
                  if (!items.length) return '';
                  let sec = `<div style="padding: 16px 16px 8px; font-size:0.75rem; font-weight:700; color:var(--muted);">${title}</div>`;
                  sec += items
                    .map(
                      (item) => `
              <div class="search-dropdown-item" style="padding-top:6px; padding-bottom:6px;">
                <img src="${escapeHTML(item.imageUrl || '')}" style="width:36px; height:36px; border-radius:${item.type === 'artist' ? '50%' : '4px'}; object-fit:cover;" alt=""/>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; cursor:pointer; overflow:hidden;" data-action="${action}" data-${idField}="${escapeHTML(item.id)}">
                  <span style="font-size:0.9rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(item.title)}</span>
                  ${item.subtitle ? `<span style="font-size:0.75rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(item.subtitle)}</span>` : ''}
                </div>
                <button class="icon-btn" data-action="remove-recent-search" data-id="${escapeHTML(item.id)}" data-type="${item.type}" type="button"><i class="fa-solid fa-xmark"></i></button>
              </div>
            `
                    )
                    .join('');
                  return sec;
                };

                html += renderSection('Tracks', tracks, 'play-song', 'song-id');
                const renderArtistSection = (title, items) => {
                  if (!items.length) return '';
                  let sec = `<div style="padding: 16px 16px 8px; font-size:0.75rem; font-weight:700; color:var(--muted);">${title}</div>`;
                  sec += items
                    .map(
                      (item) => `
              <div class="search-dropdown-item" style="padding-top:6px; padding-bottom:6px;">
                <img src="${escapeHTML(item.imageUrl || '')}" style="width:36px; height:36px; border-radius:50%; object-fit:cover;" alt=""/>
                <div style="flex:1; display:flex; flex-direction:column; justify-content:center; cursor:pointer; overflow:hidden;" data-action="open-artist-profile" data-artist="${escapeHTML(item.title)}">
                  <span style="font-size:0.9rem; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(item.title)}</span>
                  <span style="font-size:0.75rem; color:var(--muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Artist</span>
                </div>
                <button class="icon-btn" data-action="remove-recent-search" data-id="${escapeHTML(item.id)}" data-type="artist" type="button"><i class="fa-solid fa-xmark"></i></button>
              </div>
            `
                    )
                    .join('');
                  return sec;
                };

                html += renderSection('Tracks', tracks, 'play-song', 'song-id');
                html += renderArtistSection('Artists', artists);

                html += renderSection(
                  'Playlists',
                  playlists,
                  'open-playlist-profile',
                  'playlist-id'
                );

                html += `</div></div>`;
                return html;
              })()
            : ''
        }
      </div>
      ${hasQuery ? renderSearchResults() : renderSearchHistory()}
    </section>
  `;
}

export function renderSearchResults() {
  const songs = state.searchResults.songs || [];
  const artists = state.searchResults.artists || [];
  const playlists = state.searchResults.playlists || [];
  if (state.searchLoading) {
    return `
      <div class="tab-list">
        <button class="tab-btn ${state.searchTab === 'songs' ? 'active' : ''}" data-action="set-search-tab" data-value="songs" type="button">Songs</button>
        <button class="tab-btn ${state.searchTab === 'artists' ? 'active' : ''}" data-action="set-search-tab" data-value="artists" type="button">Artists</button>
        <button class="tab-btn ${state.searchTab === 'playlists' ? 'active' : ''}" data-action="set-search-tab" data-value="playlists" type="button">Playlists</button>
      </div>
      <div class="empty-state">
        <div class="spinner" style="margin:0 auto 16px;"></div>
        <h2>Searching...</h2>
      </div>
    `;
  }
  let content = '';
  if (state.searchTab === 'songs') {
    content = `<div class="song-table">${songs.length ? songs.map((s, i) => renderSongRow(s, i + 1, 'search')).join('') : '<div class="empty-state">No songs found.</div>'}</div>`;
  } else if (state.searchTab === 'artists') {
    content = `<div class="card-grid">${artists.length ? artists.map((a, i) => renderArtistSearchCard(a, i)).join('') : '<div class="empty-state">No artists found.</div>'}</div>`;
  } else {
    content = `<div class="card-grid">${playlists.length ? playlists.map((p, i) => renderPlaylistSearchCard(p, i)).join('') : '<div class="empty-state">No playlists found.</div>'}</div>`;
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
      <div class="card-meta">${escapeHTML(playlist.uploaderName)}</div>
    </div>
  `;
}

export function renderSearchHistory() {
  const moods = [
    { name: 'Hindi Indie', color: '#10b981' },
    { name: 'The Local Train', color: '#f59e0b' },
    { name: 'Acoustic Folk', color: '#ec4899' },
    { name: 'Mitraz & Zaeden', color: '#3b82f6' },
    { name: 'Lofi Bollywood', color: '#8b5cf6' },
    { name: 'Classical Hindi', color: '#ff4b4b' },
  ];

  const moodGrid = `
    <div style="margin-top:24px;">
      <h2 class="page-title" style="font-size:1.25rem; margin-bottom:16px;">Browse All</h2>
      <div class="card-grid" style="grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap:16px;">
        ${moods
          .map(
            (m) => `
          <div class="card mood-card" data-action="search-mood" data-mood="${m.name}" style="background: linear-gradient(135deg, ${m.color}, #111); height:100px; display:flex; align-items:flex-end; padding:12px; border-radius:12px; cursor:pointer;">
            <h3 style="font-size:1.1rem; font-weight:700;">${m.name}</h3>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `;

  return `
    <div>
      ${moodGrid}
    </div>
  `;
}

export function renderLibraryPage() {
  const favorites = state.favorites;
  let tabContent = '';

  if (state.libraryTab === 'favorites') {
    tabContent = `<div class="song-table">${favorites.length ? favorites.map((s, i) => renderSongRow(s, i + 1, 'favorites')).join('') : '<div class="empty-state">No favorites yet. Tap the heart icon to save songs.</div>'}</div>`;
  } else if (state.libraryTab === 'playlists') {
    const historySongs = state.recentlyPlayed
      .map((id) => getSongById(id))
      .filter(Boolean);
    const historyPlaylist = {
      id: 'history',
      name: 'Listening History',
      songs: historySongs,
      isSystem: true,
      description: 'Your recently played tracks, newest first.',
    };
    const allPlaylists = [historyPlaylist, ...state.playlists];
    tabContent = `<div class="card-grid">${allPlaylists.map((p, i) => renderPlaylistCard(p, i)).join('')}</div>`;
  } else {
    // recent
    let allAddedSongs = [...state.favorites];
    state.playlists.forEach((p) => {
      if (p.songs) allAddedSongs = allAddedSongs.concat(p.songs);
    });
    allAddedSongs = allAddedSongs.filter((s) => s.addedAt);
    allAddedSongs.sort((a, b) => b.addedAt - a.addedAt);

    const uniqueAddedSongs = [];
    const seenIds = new Set();
    allAddedSongs.forEach((s) => {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        uniqueAddedSongs.push(s);
      }
    });

    const recentSongs = uniqueAddedSongs.slice(0, 50);
    tabContent = `<div class="song-table">${recentSongs.length ? recentSongs.map((s, i) => renderSongRow(s, i + 1, 'recent')).join('') : '<div class="empty-state">No recently added songs yet.</div>'}</div>`;
  }

  return `
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">Your Library</h1>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-soft" data-action="import-library" type="button" title="Import Library">
            <i class="fa-solid fa-file-import"></i>
          </button>
          <button class="btn btn-soft" data-action="export-library" type="button" title="Export Library">
            <i class="fa-solid fa-file-export"></i>
          </button>
          <button class="btn btn-soft" data-action="open-create-playlist" type="button">
            <i class="fa-solid fa-plus"></i> New Playlist
          </button>
        </div>
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
  }
  if (!playlist) return '<div class="empty-state">Playlist not found.</div>';
  return `
    <section class="page">
      <div class="page-header">
        <h1 class="page-title">${escapeHTML(playlist.name)}</h1>
        <div style="display:flex; gap:12px;">
          <button class="btn btn-primary" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button">
            <i class="fa-solid fa-play"></i> Play All
          </button>
          <button class="btn btn-soft" data-action="share-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Share Playlist">
            <i class="fa-solid fa-share-nodes"></i> Share
          </button>
          ${
            playlist.id !== 'default' && !playlist.isSystem
              ? `
            <button class="btn btn-danger" data-action="delete-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Delete Playlist">
              <i class="fa-solid fa-trash"></i>
            </button>
          `
              : ''
          }
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
