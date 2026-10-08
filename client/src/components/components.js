import { escapeHTML, getOptimizedArtwork } from '../utils/utils.js';
import { state } from '../config/config.js';
import { getSongById, dedupeSongs, rememberSongs } from '../core/details.js';
import { fetchPlaylistDetails } from '../services/apiMapping.js';

export function renderSongRowSkeleton() {
  return `
    <div class="skeleton-song-row" aria-hidden="true">
      <div class="skeleton skeleton-cover-sm"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text-main" style="width: 65%;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 40%;"></div>
      </div>
      <div class="skeleton skeleton-text-sub" style="width: 36px; margin-left: auto;"></div>
    </div>
  `;
}

export function renderCardSkeleton(isRound = false) {
  return `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-card-cover" style="border-radius: ${isRound ? '50%' : 'var(--radius-md)'}; margin-bottom: 12px; aspect-ratio: 1/1;"></div>
      <div class="skeleton skeleton-card-title" style="margin-left: 0; width: 80%;"></div>
      <div class="skeleton skeleton-card-meta" style="margin-left: 0; width: 50%;"></div>
    </div>
  `;
}

export function renderHomeGridSkeleton() {
  return `
    <div class="home-grid-card skeleton-card-item" aria-hidden="true" style="pointer-events:none;">
      <div class="home-grid-cover-wrap">
        <div class="skeleton" style="width:100%; height:100%;"></div>
      </div>
      <div style="flex: 1; min-width: 0; padding-right: 8px; display: flex; flex-direction: column; gap: 4px;">
        <div class="skeleton skeleton-text-main" style="width: 75%; height: 14px; border-radius: 4px; margin: 0;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 45%; height: 10px; border-radius: 4px; margin: 0;"></div>
      </div>
    </div>
  `;
}

export function renderHomeScrollSkeleton() {
  return `
    <div class="home-scroll-card" style="pointer-events:none;">
      <div class="scroll-cover-wrap">
        <div class="skeleton" style="width:100%; height:100%;"></div>
      </div>
      <div class="scroll-card-meta">
        <div class="skeleton skeleton-text-main" style="width: 80%; margin: 0 0 6px 0; border-radius: 4px; height: 14px;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 50%; margin: 0; border-radius: 4px; height: 12px;"></div>
      </div>
    </div>
  `;
}

export function renderHomeGridCard(song, source, playlistId = '', titleOverride = '') {
  if (!song) return '';
  const cover = getOptimizedArtwork(song.coverUrl, 240);
  const displayTitle = titleOverride || song.title;
  return `
    <article class="home-grid-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button" aria-label="Play ${escapeHTML(displayTitle)}">
      <div class="home-grid-cover-wrap">
        <img src="${escapeHTML(cover)}" alt="${escapeHTML(displayTitle)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
      </div>
      <span class="home-grid-title">${escapeHTML(displayTitle)}</span>
      <button class="home-grid-play-btn" type="button" aria-label="Play" tabindex="-1">
        <i class="fa-solid fa-play"></i>
      </button>
    </article>
  `;
}

export function renderHomeScrollCard(song, index, source, playlistId = '') {
  if (!song) return '';
  const cover = getOptimizedArtwork(song.coverUrl, 320);
  return `
    <article class="home-scroll-card" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button" aria-label="Play ${escapeHTML(song.title)} by ${escapeHTML(song.artist)}">
      <div class="scroll-cover-wrap">
        <img src="${escapeHTML(cover)}" alt="${escapeHTML(song.title)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <button class="scroll-play-btn" type="button" aria-label="Play" tabindex="-1">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <div class="scroll-card-meta">
        <h3 class="scroll-card-title">${escapeHTML(song.title)}</h3>
        <p class="scroll-card-artist">${escapeHTML(song.artist)}</p>
      </div>
    </article>
  `;
}

export function renderSearchResults() {
  const songs = state.searchResults?.songs || [];
  const artists = state.searchResults?.artists || [];
  const playlists = state.searchResults?.playlists || [];
  const albums = state.searchResults?.albums || [];
  const currentTab = state.searchTab || 'all';

  const tabsBar = `
    <div class="search-tabs-bar" role="tablist">
      <button class="search-tab-pill ${currentTab === 'all' ? 'active' : ''}" data-action="set-search-tab" data-value="all" type="button" role="tab" aria-selected="${currentTab === 'all'}">All</button>
      <button class="search-tab-pill ${currentTab === 'songs' ? 'active' : ''}" data-action="set-search-tab" data-value="songs" type="button" role="tab" aria-selected="${currentTab === 'songs'}">Songs</button>
      <button class="search-tab-pill ${currentTab === 'artists' ? 'active' : ''}" data-action="set-search-tab" data-value="artists" type="button" role="tab" aria-selected="${currentTab === 'artists'}">Artists</button>
      <button class="search-tab-pill ${currentTab === 'playlists' ? 'active' : ''}" data-action="set-search-tab" data-value="playlists" type="button" role="tab" aria-selected="${currentTab === 'playlists'}">Playlists</button>
      <button class="search-tab-pill ${currentTab === 'albums' ? 'active' : ''}" data-action="set-search-tab" data-value="albums" type="button" role="tab" aria-selected="${currentTab === 'albums'}">Albums</button>
    </div>
  `;

  if (state.searchLoading) {
    if (currentTab === 'all') {
      return `
        ${tabsBar}
        <div class="search-all-grid">
          <div class="search-top-result-col">
            <h2 class="search-section-title">Top Result</h2>
            <div class="skeleton" style="height: 220px; border-radius: var(--radius-lg); width: 100%;"></div>
          </div>
          <div class="search-top-songs-col">
            <h2 class="search-section-title">Songs</h2>
            <div class="song-table">${Array(4).fill('').map(() => renderSongRowSkeleton()).join('')}</div>
          </div>
        </div>
        <div style="margin-top: 24px;">
          <h2 class="search-section-title">Artists</h2>
          <div class="card-grid">${Array(4).fill('').map(() => renderCardSkeleton(true)).join('')}</div>
        </div>
      `;
    }
    if (currentTab === 'songs') {
      return `${tabsBar}<div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>`;
    }
    if (currentTab === 'artists') {
      return `${tabsBar}<div class="card-grid">${Array(8).fill('').map(() => renderCardSkeleton(true)).join('')}</div>`;
    }
    return `${tabsBar}<div class="card-grid">${Array(8).fill('').map(() => renderCardSkeleton(false)).join('')}</div>`;
  }

  const noResultsHTML = `
    <div class="search-empty-state">
      <div class="search-empty-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
      <h2 class="search-empty-title">No results found for "${escapeHTML(state.searchQuery)}"</h2>
      <p class="search-empty-sub">Please check your spelling, try fewer keywords, or tap one of these trending suggestions:</p>
      <div class="search-empty-chips">
        <button class="btn btn-soft" data-action="use-recent-search" data-query="Prateek Kuhad" type="button">Prateek Kuhad</button>
        <button class="btn btn-soft" data-action="use-recent-search" data-query="Arijit Singh" type="button">Arijit Singh</button>
        <button class="btn btn-soft" data-action="use-recent-search" data-query="Lo-Fi Chill" type="button">Lo-Fi Chill</button>
        <button class="btn btn-soft" data-action="use-recent-search" data-query="Coldplay" type="button">Coldplay</button>
      </div>
    </div>
  `;

  if (!songs.length && !artists.length && !playlists.length && !albums.length) {
    return `${tabsBar}${noResultsHTML}`;
  }

  let content = '';

  if (currentTab === 'all') {
    // Determine Top Result
    const qLower = state.searchQuery.trim().toLowerCase();
    const artistExactMatch = artists.find((a) => (a.name || '').toLowerCase() === qLower);
    const topArtist = artistExactMatch || null;
    const topSong = songs[0] || null;

    let topResultHTML = '';
    if (topArtist) {
      topResultHTML = `
        <div class="search-top-card" data-action="open-artist-profile" data-artist="${escapeHTML(topArtist.name)}" role="button" tabindex="0">
          <div class="search-top-avatar-wrap">
            <img class="search-top-avatar" src="${escapeHTML(getOptimizedArtwork(topArtist.imageUrl, 280))}" alt="${escapeHTML(topArtist.name)}" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
          </div>
          <div class="search-top-meta">
            <span class="search-top-badge">Artist</span>
            <h3 class="search-top-title">${escapeHTML(topArtist.name)}</h3>
          </div>
        </div>
      `;
    } else if (topSong) {
      topResultHTML = `
        <div class="search-top-card" data-action="play-song" data-song-id="${escapeHTML(topSong.id)}" data-source="search" role="button" tabindex="0">
          <img class="search-top-cover" src="${escapeHTML(getOptimizedArtwork(topSong.coverUrl, 320))}" alt="${escapeHTML(topSong.title)}" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
          <div class="search-top-meta">
            <span class="search-top-badge">Song</span>
            <h3 class="search-top-title">${escapeHTML(topSong.title)}</h3>
            <p class="search-top-artist">${escapeHTML(topSong.artist)}</p>
          </div>
          <button class="search-top-play-btn" data-action="play-song" data-song-id="${escapeHTML(topSong.id)}" data-source="search" type="button" aria-label="Play ${escapeHTML(topSong.title)}" onclick="event.stopPropagation();">
            <i class="fa-solid fa-play"></i>
          </button>
        </div>
      `;
    }

    const topSongs = songs.slice(0, 4);

    content = `
      <div class="search-all-grid">
        ${
          topResultHTML
            ? `
          <div class="search-top-result-col">
            <h2 class="search-section-title">Top Result</h2>
            ${topResultHTML}
          </div>
        `
            : ''
        }
        ${
          topSongs.length
            ? `
          <div class="search-top-songs-col">
            <div class="search-section-head">
              <h2 class="search-section-title">Songs</h2>
              <button class="btn-text-see-all" data-action="set-search-tab" data-value="songs" type="button">Show all</button>
            </div>
            <div class="song-table">
              ${topSongs.map((s, i) => renderSongRow(s, i + 1, 'search')).join('')}
            </div>
          </div>
        `
            : ''
        }
      </div>

      ${
        artists.length
          ? `
        <section class="search-section">
          <div class="search-section-head">
            <h2 class="search-section-title">Artists</h2>
            <button class="btn-text-see-all" data-action="set-search-tab" data-value="artists" type="button">Show all</button>
          </div>
          <div class="card-grid">
            ${artists.slice(0, 6).map((a, i) => renderArtistSearchCard(a, i)).join('')}
          </div>
        </section>
      `
          : ''
      }

      ${
        playlists.length
          ? `
        <section class="search-section">
          <div class="search-section-head">
            <h2 class="search-section-title">Playlists</h2>
            <button class="btn-text-see-all" data-action="set-search-tab" data-value="playlists" type="button">Show all</button>
          </div>
          <div class="card-grid">
            ${playlists.slice(0, 6).map((p, i) => renderPlaylistSearchCard(p, i)).join('')}
          </div>
        </section>
      `
          : ''
      }

      ${
        albums.length
          ? `
        <section class="search-section">
          <div class="search-section-head">
            <h2 class="search-section-title">Albums</h2>
            <button class="btn-text-see-all" data-action="set-search-tab" data-value="albums" type="button">Show all</button>
          </div>
          <div class="card-grid">
            ${albums.slice(0, 6).map((alb, i) => renderAlbumSearchCard(alb, i)).join('')}
          </div>
        </section>
      `
          : ''
      }
    `;
  } else if (currentTab === 'songs') {
    content = songs.length
      ? `<div class="song-table">${songs.map((s, i) => renderSongRow(s, i + 1, 'search')).join('')}</div>`
      : `<div class="search-empty-state"><p class="search-empty-sub">No songs found for "${escapeHTML(state.searchQuery)}".</p></div>`;
  } else if (currentTab === 'artists') {
    content = artists.length
      ? `<div class="card-grid">${artists.map((a, i) => renderArtistSearchCard(a, i)).join('')}</div>`
      : `<div class="search-empty-state"><p class="search-empty-sub">No artists found for "${escapeHTML(state.searchQuery)}".</p></div>`;
  } else if (currentTab === 'playlists') {
    content = playlists.length
      ? `<div class="card-grid">${playlists.map((p, i) => renderPlaylistSearchCard(p, i)).join('')}</div>`
      : `<div class="search-empty-state"><p class="search-empty-sub">No playlists found for "${escapeHTML(state.searchQuery)}".</p></div>`;
  } else if (currentTab === 'albums') {
    content = albums.length
      ? `<div class="card-grid">${albums.map((alb, i) => renderAlbumSearchCard(alb, i)).join('')}</div>`
      : `<div class="search-empty-state"><p class="search-empty-sub">No albums found for "${escapeHTML(state.searchQuery)}".</p></div>`;
  }

  return `${tabsBar}${content}`;
}

export function renderSearchDynamicUI() {
  const hasQuery = state.searchQuery.trim().length > 0;
  const recentQueries = (state.recentSearches || [])
    .filter((item) => item.type === 'query')
    .slice(0, 8);
  const suggestions = state.searchSuggestions || [];

  let html = '';
  if (hasQuery) {
    html += `
      <button class="clear-search" data-action="clear-search-input" type="button" aria-label="Clear Search Input" title="Clear">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
  }

  if (!state.searchDropdownOpen) {
    return html;
  }

  const qLower = state.searchQuery.trim().toLowerCase();

  // Find matching recent searches
  const matchingRecent = hasQuery
    ? recentQueries.filter((r) => r.query.toLowerCase().includes(qLower) && r.query.toLowerCase() !== qLower)
    : recentQueries;

  // Filter suggestions to not duplicate matching recent
  const filteredSuggestions = suggestions.filter(
    (s) => !matchingRecent.some((r) => r.query.toLowerCase() === s.toLowerCase())
  );

  const hasAnyDropdownContent = hasQuery
    ? (matchingRecent.length > 0 || filteredSuggestions.length > 0)
    : matchingRecent.length > 0;

  if (!hasAnyDropdownContent && !hasQuery) {
    return html;
  }

  html += `
    <div class="search-suggestions-dropdown" role="listbox" id="search-suggestions-box">
      ${!hasQuery && matchingRecent.length > 0 ? `
        <div class="search-suggestions-header">
          <span>Recent Searches</span>
          <button class="btn-clear-recent-header" data-action="clear-search-history" type="button">Clear all</button>
        </div>
      ` : ''}

      ${matchingRecent.map((item) => {
        let highlighted = escapeHTML(item.query);
        if (hasQuery && item.query.toLowerCase().includes(qLower)) {
          const start = item.query.toLowerCase().indexOf(qLower);
          const before = escapeHTML(item.query.slice(0, start));
          const match = escapeHTML(item.query.slice(start, start + qLower.length));
          const after = escapeHTML(item.query.slice(start + qLower.length));
          highlighted = `${before}<strong class="search-match-text">${match}</strong>${after}`;
        }
        return `
          <div class="search-suggestion-item recent-query-item" role="option">
            <button class="recent-query-click" data-action="use-recent-search" data-query="${escapeHTML(item.query)}" type="button">
              <i class="fa-solid fa-clock-rotate-left search-suggestion-icon" aria-hidden="true"></i>
              <span class="search-suggestion-text">${highlighted}</span>
              <span class="search-suggestion-badge">Recent</span>
            </button>
            <button class="recent-query-remove" data-action="remove-recent-search" data-type="query" data-id="${escapeHTML(item.query)}" type="button" title="Remove search" aria-label="Remove search">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        `;
      }).join('')}

      ${hasQuery ? filteredSuggestions.slice(0, 7).map((s) => {
        let highlighted = escapeHTML(s);
        const sLower = s.toLowerCase();
        if (sLower.includes(qLower)) {
          const start = sLower.indexOf(qLower);
          const before = escapeHTML(s.slice(0, start));
          const match = escapeHTML(s.slice(start, start + qLower.length));
          const after = escapeHTML(s.slice(start + qLower.length));
          highlighted = `${before}<strong class="search-match-text">${match}</strong>${after}`;
        }
        return `
          <button class="search-suggestion-item" data-action="use-suggestion" data-query="${escapeHTML(s)}" type="button" role="option">
            <i class="fa-solid fa-magnifying-glass search-suggestion-icon" aria-hidden="true"></i>
            <span class="search-suggestion-text">${highlighted}</span>
            <span class="search-suggestion-badge">Search</span>
          </button>
        `;
      }).join('') : ''}
    </div>
  `;

  return html;
}

export function updateSearchDynamicUIOnly() {
  const dynamicUI = document.getElementById('search-dynamic-ui');
  if (dynamicUI) {
    dynamicUI.innerHTML = renderSearchDynamicUI();
  }
}
export const updateSearchDynamicUI = updateSearchDynamicUIOnly;

export function updateSearchPageUI() {
  updateSearchDynamicUIOnly();
  const contentArea = document.getElementById('search-content-area');
  if (contentArea) {
    const hasQuery = state.searchQuery.trim().length > 0;
    contentArea.innerHTML = hasQuery ? renderSearchResults() : renderSearchCategories();
  }
}

export function renderSearchPage() {
  const hasQuery = state.searchQuery.trim().length > 0;

  return `
    <section class="page search-page">
      <div class="search-header-container">
        <h1 class="page-title">Search</h1>
        <div class="search-container" id="search-bar-wrap">
          <i class="fa-solid fa-magnifying-glass search-icon" aria-hidden="true"></i>
          <input
            type="text"
            id="search-input"
            class="search-input"
            placeholder="What do you want to listen to?"
            value="${escapeHTML(state.searchQuery)}"
            autocomplete="off"
            spellcheck="false"
            aria-label="Search music, artists, playlists, albums"
          />
          <div id="search-dynamic-ui">
            ${renderSearchDynamicUI()}
          </div>
        </div>
        <div class="search-shortcuts-bar">
          ${TRENDING_SEARCH_SHORTCUTS.map(item => `
            <button class="btn btn-soft search-shortcut-chip" data-action="use-recent-search" data-query="${escapeHTML(item.label)}" type="button">
              <i class="fa-solid ${item.icon}"></i>
              <span>${escapeHTML(item.label)}</span>
            </button>
          `).join('')}
        </div>
      </div>
      <div id="search-content-area" class="search-content-wrapper">
        ${hasQuery ? renderSearchResults() : renderSearchCategories()}
      </div>
    </section>
  `;
}

export function renderLibraryPage() {
  let tabContent = '';
  
  if (state.isLoading) {
    if (state.libraryTab === 'playlists' || state.libraryTab === 'albums') {
      tabContent = `<div class="card-grid">${Array(8).fill('').map(() => renderCardSkeleton()).join('')}</div>`;
    } else if (state.libraryTab === 'artists') {
      tabContent = `<div class="card-grid">${Array(8).fill('').map(() => renderCardSkeleton(true)).join('')}</div>`;
    } else {
      tabContent = `<div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>`;
    }
  } else {
    if (state.libraryTab === 'playlists') {
      tabContent = `<div class="card-grid">${state.playlists.length ? state.playlists.map((p, i) => renderPlaylistCard(p, i)).join('') : '<div class="empty-state"><i class="fa-solid fa-list-ul"></i><h2>No playlists yet</h2><p>Create a playlist to organize your favorite music.</p><button class="btn btn-primary" data-action="open-create-playlist" type="button" style="margin-top:12px;"><i class="fa-solid fa-plus"></i> New Playlist</button></div>'}</div>`;
    } else if (state.libraryTab === 'albums') {
      const albumMap = new Map();
      [...(state.favorites || []), ...(state.playlists || []).flatMap((p) => p.songs || [])].forEach((s) => {
        if (s && s.album && s.album !== 'Single' && s.album !== 'Unknown') {
          if (!albumMap.has(s.album)) {
            albumMap.set(s.album, {
              name: s.album,
              artist: s.artist,
              coverUrl: getOptimizedArtwork(s.coverUrl, 320),
              songCount: 1,
            });
          } else {
            albumMap.get(s.album).songCount += 1;
          }
        }
      });
      const savedAlbums = Array.from(albumMap.values());
      tabContent = savedAlbums.length
        ? `<div class="card-grid">${savedAlbums.map((album) => `
            <div class="card" data-action="open-artist-profile" data-artist="${escapeHTML(album.artist)}" role="button" tabindex="0">
              <div class="card-img-wrap">
                <img class="card-cover" src="${escapeHTML(album.coverUrl)}" alt="${escapeHTML(album.name)}" draggable="false" loading="lazy" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
                <button class="card-play-btn" type="button" aria-label="View Album">
                  <i class="fa-solid fa-compact-disc"></i>
                </button>
              </div>
              <div class="card-title">${escapeHTML(album.name)}</div>
              <div class="card-meta">${escapeHTML(album.artist)} &bull; ${album.songCount} track${album.songCount === 1 ? '' : 's'}</div>
            </div>
          `).join('')}</div>`
        : '<div class="empty-state"><i class="fa-solid fa-compact-disc"></i><h2>No saved albums</h2><p>Favorite tracks with album metadata to organize your personal discography here.</p></div>';
    } else if (state.libraryTab === 'artists') {
      const rawArtists = [
        ...(state.favorites || []).map((s) => s.artist),
        ...(state.playlists || []).flatMap((p) => (p.songs || []).map((s) => s.artist)),
        ...(state.recentlyPlayed || []).map((id) => getSongById(id)?.artist),
      ].filter(Boolean);
      const uniqueArtists = Array.from(new Set(rawArtists));
      tabContent = uniqueArtists.length
        ? `<div class="card-grid">${uniqueArtists.map((artist) => `
            <div class="card" data-action="open-artist-profile" data-artist="${escapeHTML(artist)}" tabindex="0" role="button">
              <div class="card-img-wrap" style="border-radius: 50%; overflow: hidden; margin-bottom: 12px; aspect-ratio: 1/1; background: var(--hover); display: flex; align-items: center; justify-content: center;">
                <i class="fa-solid fa-user" style="font-size: 2.2rem; color: var(--muted);"></i>
              </div>
              <div class="card-title" style="text-align: center;">${escapeHTML(artist)}</div>
              <div class="card-meta" style="text-align: center;">Artist</div>
            </div>
          `).join('')}</div>`
        : '<div class="empty-state"><i class="fa-solid fa-user-astronaut"></i><h2>No saved artists</h2><p>Favorite tracks or playlists to populate your artists here.</p></div>';
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

  const activeTab = state.libraryTab || 'playlists';

  return `
    <section class="page">
      <div class="page-header" style="display:flex; justify-content:space-between; align-items:center;">
        <h1 class="page-title">Your Library</h1>
        <div class="header-actions" style="display:flex; gap:8px;">
          <button class="btn btn-soft" data-action="open-create-playlist" type="button" aria-label="New Playlist" title="Create Playlist">
            <i class="fa-solid fa-plus"></i> New
          </button>
          <button class="btn btn-soft" data-action="import-library" type="button" aria-label="Import Backup" title="Import Backup"><i class="fa-solid fa-file-import"></i></button>
          <button class="btn btn-soft" data-action="export-library" type="button" aria-label="Export Backup" title="Export Backup"><i class="fa-solid fa-file-export"></i></button>
        </div>
      </div>
      <div class="tab-list">
        <button class="tab-btn ${activeTab === 'playlists' ? 'active' : ''}" data-action="set-library-tab" data-value="playlists" type="button">Playlists</button>
        <button class="tab-btn ${activeTab === 'albums' ? 'active' : ''}" data-action="set-library-tab" data-value="albums" type="button">Albums</button>
        <button class="tab-btn ${activeTab === 'artists' ? 'active' : ''}" data-action="set-library-tab" data-value="artists" type="button">Artists</button>
        <button class="tab-btn ${activeTab === 'favorites' ? 'active' : ''}" data-action="set-library-tab" data-value="favorites" type="button">Favorites</button>
        <button class="tab-btn ${activeTab === 'recent' ? 'active' : ''}" data-action="set-library-tab" data-value="recent" type="button">Recently Added</button>
      </div>
      ${tabContent}
    </section>
  `;
}

export function ensureRemotePlaylistLoaded(playlistId) {
  if (!playlistId || playlistId === 'history' || playlistId === 'liked' || playlistId === 'favorites') return;
  if (state.playlists.some((p) => p.id === playlistId)) return;
  if (!state.ytPlaylists) state.ytPlaylists = {};
  if (state.ytPlaylists[playlistId] && (!state.ytPlaylists[playlistId].isLoading || state.ytPlaylists[playlistId].songs?.length)) return;

  state.ytPlaylists[playlistId] = {
    id: playlistId,
    name: 'Loading playlist...',
    coverUrl: '',
    songs: [],
    isLoading: true,
    isSystem: true,
  };

  fetchPlaylistDetails(playlistId)
    .then((data) => {
      if (data && data.songs) {
        rememberSongs(data.songs);
        state.ytPlaylists[playlistId] = {
          ...state.ytPlaylists[playlistId],
          name: data.playlist.name || 'Playlist',
          coverUrl: data.playlist.coverUrl || '',
          uploaderName: data.playlist.uploaderName || '',
          isAlbum: data.playlist.isAlbum,
          songs: data.songs,
          isLoading: false,
        };
      } else {
        if (state.ytPlaylists[playlistId]) state.ytPlaylists[playlistId].isLoading = false;
      }
      if (state.route?.name === 'playlist' && state.route?.playlistId === playlistId) {
        const appMain = document.getElementById('app-main');
        if (appMain) appMain.innerHTML = renderPlaylistPage(playlistId);
      }
    })
    .catch(() => {
      if (state.ytPlaylists[playlistId]) state.ytPlaylists[playlistId].isLoading = false;
      if (state.route?.name === 'playlist' && state.route?.playlistId === playlistId) {
        const appMain = document.getElementById('app-main');
        if (appMain) appMain.innerHTML = renderPlaylistPage(playlistId);
      }
    });
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
      coverUrl: historySongs.length ? historySongs[0].coverUrl : '',
    };
  } else if (playlistId === 'liked' || playlistId === 'favorites') {
    playlist = {
      id: 'liked',
      name: 'Liked Songs',
      songs: state.favorites || [],
      isSystem: true,
      coverUrl: state.favorites && state.favorites.length ? state.favorites[0].coverUrl : '',
    };
  } else {
    playlist = state.playlists.find((p) => p.id === playlistId);
    if (!playlist && state.ytPlaylists && state.ytPlaylists[playlistId]) {
      playlist = state.ytPlaylists[playlistId];
    }
  }

  if (!playlist) {
    ensureRemotePlaylistLoaded(playlistId);
    return `
      <section class="page playlist-page" style="padding-top: 0;">
        <div style="margin-bottom: 24px; margin-top: 16px;">
          <button class="btn btn-soft" data-action="go-back" type="button" style="padding: 8px 16px; font-size: 0.875rem;">
            <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back
          </button>
        </div>
        <div class="page-header" style="display:flex; align-items:center; gap:24px; padding-bottom:24px;">
          <div class="skeleton" style="width:160px; height:160px; border-radius:var(--radius-md);"></div>
          <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
            <div class="skeleton skeleton-text-main" style="width:80px; height:14px; border-radius:4px;"></div>
            <div class="skeleton skeleton-text-main" style="width:60%; height:40px; border-radius:8px;"></div>
            <div class="skeleton skeleton-text-sub" style="width:35%; height:14px; border-radius:4px;"></div>
          </div>
        </div>
        <div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>
      </section>
    `;
  }
  
  if (playlist.isLoading) {
    return `
      <section class="page playlist-page" style="padding-top: 0;">
        <div style="margin-bottom: 24px; margin-top: 16px;">
          <button class="btn btn-soft" data-action="go-back" type="button" style="padding: 8px 16px; font-size: 0.875rem;">
            <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back
          </button>
        </div>
        <div class="page-header" style="display:flex; align-items:center; gap:24px; padding-bottom:24px;">
          <div class="skeleton" style="width:160px; height:160px; border-radius:var(--radius-md);"></div>
          <div style="flex:1; display:flex; flex-direction:column; gap:12px;">
            <div class="skeleton skeleton-text-main" style="width:80px; height:14px; border-radius:4px;"></div>
            <div class="skeleton skeleton-text-main" style="width:60%; height:40px; border-radius:8px;"></div>
            <div class="skeleton skeleton-text-sub" style="width:35%; height:14px; border-radius:4px;"></div>
          </div>
        </div>
        <div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>
      </section>
    `;
  }
  
  const coverUrl = playlist.coverUrl || (playlist.songs && playlist.songs.length > 0 ? playlist.songs[0].coverUrl : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300');
  const songCount = playlist.songs ? playlist.songs.length : 0;
  
  return `
    <section class="page playlist-page" style="padding-top: 0;">
      <div style="margin-bottom: 24px; margin-top: 16px;">
        <button class="btn btn-soft" data-action="go-back" type="button" style="padding: 8px 16px; font-size: 0.875rem;">
          <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back
        </button>
      </div>
      <div class="hero-player">
        <img class="hero-cover" src="${escapeHTML(getOptimizedArtwork(coverUrl, 480))}" alt="${escapeHTML(playlist.name)}" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <div class="hero-info">
          <span class="hero-tag">${playlist.isAlbum ? 'Album' : 'Playlist'}</span>
          <h1 class="hero-title">${escapeHTML(playlist.name)}</h1>
          <p class="hero-meta">
            ${playlist.uploaderName ? `${escapeHTML(playlist.uploaderName)} &bull; ` : ''}${songCount} song${songCount === 1 ? '' : 's'}
          </p>
          <div class="hero-actions" style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-primary" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" ${songCount === 0 ? 'disabled' : ''}>
              <i class="fa-solid fa-play"></i> Play All
            </button>
            <button class="btn btn-soft" data-action="shuffle-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" ${songCount === 0 ? 'disabled' : ''} aria-label="Shuffle Playlist">
              <i class="fa-solid fa-shuffle"></i> Shuffle
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
        ${songCount ? playlist.songs.map((s, i) => renderSongRow(s, i + 1, 'playlist', playlist.id)).join('') : '<div class="empty-state">This playlist is empty. Search for songs to add them.</div>'}
      </div>
    </section>
  `;
}

export function renderSongRow(song, index, source, playlistId = '') {
  if (!song) return '';
  const active = state.currentSong?.id === song.id;
  const isFav = state.favorites.some((item) => item.id === song.id);
  const cover = getOptimizedArtwork(song.coverUrl, 120);
  return `
     <div class="song-row ${active ? 'active' : ''}" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="${escapeHTML(source)}" data-playlist-id="${escapeHTML(playlistId)}" type="button">
       <div class="song-index">
         ${active && state.isPlaying ? '<i class="fa-solid fa-volume-high" style="font-size:0.75rem;"></i>' : `<span>${index}</span>`}
       </div>
       <img class="song-cover-sm" src="${escapeHTML(cover)}" alt="" draggable="false" loading="lazy" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
       <div class="song-info">
         <div class="song-title">${escapeHTML(song.title)}</div>
         <div class="song-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}" onclick="event.stopPropagation();">${escapeHTML(song.artist)}</div>
       </div>
       <div class="song-duration">${escapeHTML(song.duration || '0:00')}</div>
       <div class="song-actions">
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
     </div>
   `;
}

export function renderPlaylistCard(playlist, index) {
  if (!playlist) return '';
  const rawCover =
    playlist.songs && playlist.songs.length > 0
      ? playlist.songs[0].coverUrl
      : 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';
  const coverUrl = getOptimizedArtwork(rawCover, 320);
  return `
    <div class="card" data-action="navigate" data-path="/playlist/${escapeHTML(playlist.id)}" tabindex="0">
      <div class="card-img-wrap">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
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
  const rawCover =
    playlist.imageUrl ||
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300';
  const coverUrl = getOptimizedArtwork(rawCover, 320);
  return `
    <div class="card" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(playlist.id)}" tabindex="0" role="button" aria-label="Open playlist ${escapeHTML(playlist.name)}">
      <div class="card-img-wrap">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <button class="card-play-btn" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Play ${escapeHTML(playlist.name)}" onclick="event.stopPropagation();">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <div class="card-title">${escapeHTML(playlist.name)}</div>
      <div class="card-meta">${escapeHTML(playlist.uploaderName || 'Playlist')}</div>
    </div>
  `;
}

export function renderAlbumSearchCard(album, index) {
  if (!album) return '';
  const rawCover = album.imageUrl || '/assets/pawtify.png';
  const coverUrl = getOptimizedArtwork(rawCover, 320);
  return `
    <div class="card" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(album.id)}" tabindex="0" role="button" aria-label="Open album ${escapeHTML(album.name)}">
      <div class="card-img-wrap">
        <img class="card-cover" src="${escapeHTML(coverUrl)}" alt="${escapeHTML(album.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <button class="card-play-btn" data-action="play-all-playlist" data-playlist-id="${escapeHTML(album.id)}" type="button" aria-label="Play ${escapeHTML(album.name)}" onclick="event.stopPropagation();">
          <i class="fa-solid fa-play"></i>
        </button>
      </div>
      <div class="card-title">${escapeHTML(album.name)}</div>
      <div class="card-meta">${escapeHTML(album.artist || 'Album')}${album.year ? ` &bull; ${escapeHTML(album.year)}` : ''}</div>
    </div>
  `;
}

export function renderArtistSearchCard(artist, index) {
  if (!artist) return '';
  const rawCover =
    artist.imageUrl ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300';
  const coverUrl = getOptimizedArtwork(rawCover, 320);
  return `
    <div class="card" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" tabindex="0">
      <div class="card-img-wrap" style="border-radius: 50%; overflow: hidden; margin-bottom: 12px; aspect-ratio: 1/1;">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(artist.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" style="object-fit: cover; width: 100%; height: 100%;" />
      </div>
      <div class="card-title" style="text-align: center;">${escapeHTML(artist.name)}</div>
      <div class="card-meta" style="text-align: center;">Artist</div>
    </div>
  `;
}


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

export function renderSearchCategories() {
  const recentQueries = (state.recentSearches || [])
    .filter((item) => item.type === 'query')
    .slice(0, 8);

  return `
    <div style="margin-top: 4px; display: flex; flex-direction: column; gap: 28px;">
      ${recentQueries.length > 0 ? `
        <div class="search-recent-section">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h2 style="font-size: 1.05rem; font-weight: 600; color: var(--text);">Recent searches</h2>
            <button class="btn btn-soft" data-action="clear-search-history" type="button" style="font-size: 0.75rem; padding: 4px 10px; border-radius: 6px; color: var(--muted);">
              Clear
            </button>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${recentQueries.map(item => `
              <div class="recent-search-pill" style="display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; border-radius: 999px; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1);">
                <button class="recent-search-text-btn" data-action="use-recent-search" data-query="${escapeHTML(item.query)}" type="button" style="background: none; border: none; padding: 0; color: var(--text); font-size: 0.8125rem; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                  <i class="fa-solid fa-clock-rotate-left" style="font-size: 0.75rem; color: var(--muted);"></i>
                  <span>${escapeHTML(item.query)}</span>
                </button>
                <button class="recent-search-del-btn" data-action="remove-recent-search" data-type="query" data-id="${escapeHTML(item.query)}" type="button" aria-label="Remove search" style="background: none; border: none; padding: 0; color: var(--muted); cursor: pointer; font-size: 0.75rem; display: flex; align-items: center;" title="Remove">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="search-trending-section">
        <h2 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 12px; color: var(--text);">
          Trending searches
        </h2>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${TRENDING_SEARCH_SHORTCUTS.map(item => `
            <button class="btn btn-soft" data-action="use-recent-search" data-query="${escapeHTML(item.label)}" type="button" style="font-size: 0.8125rem; padding: 6px 14px; border-radius: 999px; display: inline-flex; align-items: center; gap: 6px;">
              <span>${escapeHTML(item.label)}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="search-categories-section">
        <h2 style="font-size: 1.05rem; font-weight: 600; margin-bottom: 16px; color: var(--text);">Browse all</h2>
        <div class="category-grid">
          ${SEARCH_CATEGORIES.map(cat => `
            <div class="category-card" data-action="search-category" data-category="${escapeHTML(cat.name)}" tabindex="0" style="background: ${cat.color};">
              <span>${escapeHTML(cat.name)}</span>
              <div class="bg-accent"></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
