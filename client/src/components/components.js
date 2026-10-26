import { escapeHTML, getOptimizedArtwork } from '../utils/utils.js';
import { state } from '../config/config.js';
import { getSongById, dedupeSongs, rememberSongs } from '../core/details.js';
import { fetchPlaylistDetails } from '../services/apiMapping.js';
import { isArtistFollowed, isPlaylistSaved, isAlbumSaved } from './player.js';

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
          <button class="search-top-play-btn" data-action="play-song" data-song-id="${escapeHTML(topSong.id)}" data-source="search" type="button" aria-label="Play ${escapeHTML(topSong.title)}">
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
    <section class="page search-page-spotify">
      <!-- Top Header: User Profile Avatar, Search Title, Camera Icon -->
      <header class="search-top-header">
        <button class="search-avatar-btn" data-route="/you" type="button" aria-label="Profile" title="Profile">
          <img class="search-avatar-img" src="/assets/pawtify.png" alt="Profile" />
        </button>
        <h1 class="search-title-spotify">Search</h1>
        <button class="search-camera-btn" type="button" aria-label="Camera search" title="Scan">
          <i class="fa-solid fa-camera"></i>
        </button>
      </header>

      <!-- Prominent Pill-Shaped Search Input Bar -->
      <div class="search-pill-container" id="search-bar-wrap">
        <i class="fa-solid fa-magnifying-glass search-pill-icon" aria-hidden="true"></i>
        <input
          type="text"
          id="search-input"
          class="search-pill-input"
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

      <div id="search-content-area" class="search-content-wrapper">
        ${hasQuery ? renderSearchResults() : renderSearchCategories()}
      </div>
    </section>
  `;
}

export function renderLibraryPage() {
  const activeTab = state.libraryTab || 'playlists';
  let tabContent = '';
  
  if (state.isLoading) {
    tabContent = `
      <div class="library-list-container">
        ${Array(6).fill('').map(() => `
          <div class="library-item-skeleton">
            <div class="skeleton" style="width: 64px; height: 64px; border-radius: 8px; flex-shrink: 0;"></div>
            <div style="flex: 1; display: flex; flex-direction: column; gap: 8px;">
              <div class="skeleton skeleton-text-main" style="width: 65%; height: 16px; border-radius: 4px;"></div>
              <div class="skeleton skeleton-text-sub" style="width: 40%; height: 12px; border-radius: 4px;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } else if (activeTab === 'playlists') {
    const allPlaylists = [
      ...(state.playlists || []),
      ...(state.savedPlaylists || []).filter((sp) => !(state.playlists || []).some((p) => p.id === sp.id)),
    ];

    const favCount = (state.favorites || []).length;
    const likedCover = favCount > 0 ? getOptimizedArtwork(state.favorites[0].coverUrl, 160) : '/assets/pawtify.png';

    const likedSongsRow = `
      <article class="library-list-item" data-action="navigate" data-path="/playlist/liked" role="button" tabindex="0">
        <div class="library-item-thumb-gradient">
          <i class="fa-solid fa-heart" style="color: #fff; font-size: 1.4rem;"></i>
        </div>
        <div class="library-item-info">
          <h3 class="library-item-title">Liked Songs</h3>
          <p class="library-item-sub"><i class="fa-solid fa-thumbtack pinned-icon"></i> Playlist &bull; ${favCount} song${favCount === 1 ? '' : 's'}</p>
        </div>
      </article>
    `;

    const playlistsList = allPlaylists.map((p) => {
      const cover = p.coverUrl || p.songs?.[0]?.coverUrl || '/assets/pawtify.png';
      const uploader = p.uploaderName || (state.playlists.some(sp => sp.id === p.id) ? 'You' : 'Pawtify');
      const count = p.songs ? p.songs.length : (p.songCount || 0);
      return `
        <article class="library-list-item" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(p.id)}" role="button" tabindex="0">
          <img class="library-item-thumb" src="${escapeHTML(getOptimizedArtwork(cover, 160))}" alt="${escapeHTML(p.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
          <div class="library-item-info">
            <h3 class="library-item-title">${escapeHTML(p.name)}</h3>
            <p class="library-item-sub">Playlist &bull; ${escapeHTML(uploader)}${count ? ` &bull; ${count} songs` : ''}</p>
          </div>
        </article>
      `;
    }).join('');

    tabContent = `
      <div class="library-list-container">
        ${likedSongsRow}
        ${playlistsList}
        ${allPlaylists.length === 0 ? `
          <div class="empty-state" style="padding: 32px 16px;">
            <i class="fa-solid fa-list-ul"></i>
            <h2>No playlists yet</h2>
            <p>Create a playlist to build your collection.</p>
            <button class="btn btn-primary" data-action="open-create-playlist" type="button" style="margin-top: 14px; background: #1ed760; color: #121212; font-weight: 700; border-radius: 999px;">
              <i class="fa-solid fa-plus"></i> New Playlist
            </button>
          </div>
        ` : ''}
      </div>
    `;
  } else if (activeTab === 'podcasts') {
    tabContent = `
      <div class="library-list-container">
        <div class="empty-state" style="padding: 48px 16px; text-align: center;">
          <div style="width: 72px; height: 72px; border-radius: 50%; background: #282828; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <i class="fa-solid fa-podcast" style="font-size: 2rem; color: #83d4d7;"></i>
          </div>
          <h2 style="font-size: 1.25rem; font-weight: 700; color: #fff; margin-bottom: 8px;">Looking for podcasts?</h2>
          <p style="color: #a7a7a7; font-size: 0.9rem; max-width: 320px; margin: 0 auto 20px;">Follow your favorite shows to stay updated with fresh episodes.</p>
          <button class="btn btn-soft" data-action="search-category" data-category="Podcasts" type="button" style="border-radius: 999px; padding: 10px 24px; font-weight: 700;">
            Browse podcasts
          </button>
        </div>
      </div>
    `;
  } else if (activeTab === 'albums') {
    const albumMap = new Map();
    (state.savedAlbums || []).forEach((alb) => {
      const key = (alb.name || alb.title || '').trim().toLowerCase();
      if (key && !albumMap.has(key)) {
        albumMap.set(key, {
          id: alb.id || alb.albumId,
          name: alb.name || alb.title,
          artist: alb.artist || 'Unknown Artist',
          coverUrl: getOptimizedArtwork(alb.coverUrl || alb.imageUrl, 240),
          songCount: alb.songCount || 1,
        });
      }
    });

    [...(state.favorites || []), ...(state.playlists || []).flatMap((p) => p.songs || [])].forEach((s) => {
      if (s && s.album && s.album !== 'Single' && s.album !== 'Unknown') {
        const key = s.album.trim().toLowerCase();
        if (!albumMap.has(key)) {
          albumMap.set(key, {
            name: s.album,
            artist: s.artist,
            coverUrl: getOptimizedArtwork(s.coverUrl, 240),
            songCount: 1,
          });
        }
      }
    });
    const savedAlbums = Array.from(albumMap.values());

    tabContent = `
      <div class="library-list-container">
        ${savedAlbums.length ? savedAlbums.map((album) => {
          const isRemote = album.id && !String(album.id).startsWith('album-');
          return `
            <article class="library-list-item" ${isRemote ? `data-action="open-playlist-profile" data-playlist-id="${escapeHTML(album.id)}"` : `data-action="open-artist-profile" data-artist="${escapeHTML(album.artist)}"`} role="button" tabindex="0">
              <img class="library-item-thumb" src="${escapeHTML(album.coverUrl)}" alt="${escapeHTML(album.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
              <div class="library-item-info">
                <h3 class="library-item-title">${escapeHTML(album.name)}</h3>
                <p class="library-item-sub">Album &bull; ${escapeHTML(album.artist)}</p>
              </div>
            </article>
          `;
        }).join('') : `
          <div class="empty-state" style="padding: 48px 16px;">
            <i class="fa-solid fa-compact-disc"></i>
            <h2>No saved albums</h2>
            <p>Save albums to organize your collection here.</p>
          </div>
        `}
      </div>
    `;
  } else if (activeTab === 'artists') {
    const artistMap = new Map();
    (state.followedArtists || []).forEach((fa) => {
      const name = (typeof fa === 'string' ? fa : fa.name || '').trim();
      if (name && !artistMap.has(name.toLowerCase())) {
        artistMap.set(name.toLowerCase(), {
          name,
          imageUrl: fa.imageUrl || '',
        });
      }
    });

    const rawArtists = [
      ...(state.favorites || []).map((s) => s.artist),
      ...(state.playlists || []).flatMap((p) => (p.songs || []).map((s) => s.artist)),
      ...(state.recentlyPlayed || []).map((id) => getSongById(id)?.artist),
    ].filter(Boolean);

    rawArtists.forEach((a) => {
      const key = a.trim().toLowerCase();
      if (!artistMap.has(key)) {
        artistMap.set(key, { name: a, imageUrl: '' });
      }
    });

    const uniqueArtists = Array.from(artistMap.values());

    tabContent = `
      <div class="library-list-container">
        ${uniqueArtists.length ? uniqueArtists.map((artist) => `
          <article class="library-list-item" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" role="button" tabindex="0">
            <div class="library-item-thumb-round">
              ${artist.imageUrl ? `
                <img src="${escapeHTML(getOptimizedArtwork(artist.imageUrl, 160))}" alt="${escapeHTML(artist.name)}" loading="lazy" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';" />
                <div class="library-item-thumb-fallback" style="display:none;"><i class="fa-solid fa-user"></i></div>
              ` : `
                <div class="library-item-thumb-fallback"><i class="fa-solid fa-user"></i></div>
              `}
            </div>
            <div class="library-item-info">
              <h3 class="library-item-title">${escapeHTML(artist.name)}</h3>
              <p class="library-item-sub">Artist</p>
            </div>
          </article>
        `).join('') : `
          <div class="empty-state" style="padding: 48px 16px;">
            <i class="fa-solid fa-user"></i>
            <h2>No followed artists</h2>
            <p>Follow artists to view them here.</p>
          </div>
        `}
      </div>
    `;
  }

  return `
    <section class="page library-page-spotify">
      <!-- Spotify Library Header -->
      <header class="library-header-spotify">
        <div class="library-top-bar">
          <div class="library-user-title-wrap">
            <button class="library-avatar-btn" data-route="/you" type="button" aria-label="Profile">
              <img class="library-avatar-img" src="/assets/pawtify.png" alt="Profile" />
            </button>
            <h1 class="library-title-spotify">Your Library</h1>
          </div>
          <div class="library-actions">
            <button class="library-icon-btn" data-action="navigate" data-path="/search" type="button" aria-label="Search in library" title="Search">
              <i class="fa-solid fa-magnifying-glass"></i>
            </button>
            <button class="library-icon-btn" data-action="open-create-playlist" type="button" aria-label="New playlist" title="Create Playlist">
              <i class="fa-solid fa-plus"></i>
            </button>
          </div>
        </div>

        <!-- Horizontal Filter Chips Row -->
        <div class="library-filter-chips-row">
          <button class="lib-filter-chip ${activeTab === 'playlists' ? 'active' : ''}" data-action="set-library-tab" data-value="playlists" type="button">Playlists</button>
          <button class="lib-filter-chip ${activeTab === 'podcasts' ? 'active' : ''}" data-action="set-library-tab" data-value="podcasts" type="button">Podcasts</button>
          <button class="lib-filter-chip ${activeTab === 'albums' ? 'active' : ''}" data-action="set-library-tab" data-value="albums" type="button">Albums</button>
          <button class="lib-filter-chip ${activeTab === 'artists' ? 'active' : ''}" data-action="set-library-tab" data-value="artists" type="button">Artists</button>
        </div>

        <!-- Sort Bar: Recents -->
        <div class="library-sort-bar">
          <button class="library-sort-btn" type="button">
            <i class="fa-solid fa-arrow-down-up-across-line"></i>
            <span>Recents</span>
          </button>
          <button class="library-view-btn" type="button" aria-label="View toggle">
            <i class="fa-solid fa-bars"></i>
          </button>
        </div>
      </header>

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
    if (!playlist && state.savedPlaylists) {
      playlist = state.savedPlaylists.find((p) => String(p.id) === String(playlistId));
    }
    if (!playlist && state.ytPlaylists && state.ytPlaylists[playlistId]) {
      playlist = state.ytPlaylists[playlistId];
    }
  }

  if (!playlist || playlist.isLoading) {
    if (!playlist) ensureRemotePlaylistLoaded(playlistId);
    return `
      <section class="page playlist-page-spotify">
        <header class="playlist-nav-bar">
          <button class="playlist-nav-btn" data-action="go-back" type="button" aria-label="Back">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div style="flex:1;"></div>
          <button class="playlist-nav-btn" type="button" aria-label="More">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </header>
        <div class="playlist-hero-centered">
          <div class="skeleton" style="width: 220px; height: 220px; border-radius: 12px; margin: 0 auto 20px;"></div>
          <div class="skeleton skeleton-text-main" style="width: 60%; height: 28px; margin: 0 auto 12px; border-radius: 6px;"></div>
          <div class="skeleton skeleton-text-sub" style="width: 40%; height: 16px; margin: 0 auto; border-radius: 4px;"></div>
        </div>
        <div class="song-table">${Array(8).fill('').map(() => renderSongRowSkeleton()).join('')}</div>
      </section>
    `;
  }

  const coverUrl = playlist.coverUrl || (playlist.songs && playlist.songs.length > 0 ? playlist.songs[0].coverUrl : '/assets/pawtify.png');
  const songCount = playlist.songs ? playlist.songs.length : 0;
  const isPlayingThis = state.isPlaying && state.currentPlaylistId === playlist.id;

  return `
    <section class="page playlist-page-spotify">
      <!-- Spotify Top Nav: Back Arrow & 3-Dot Kebab Menu -->
      <header class="playlist-nav-bar">
        <button class="playlist-nav-btn" data-action="go-back" type="button" aria-label="Back">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div class="playlist-nav-title">${escapeHTML(playlist.name)}</div>
        <button class="playlist-nav-btn" data-action="share-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="More options">
          <i class="fa-solid fa-ellipsis-vertical"></i>
        </button>
      </header>

      <!-- Centered Hero: Large Rounded Artwork & Title / Meta -->
      <div class="playlist-hero-centered">
        <div class="playlist-art-large-wrap">
          <img class="playlist-art-large" src="${escapeHTML(getOptimizedArtwork(coverUrl, 560))}" alt="${escapeHTML(playlist.name)}" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        </div>
        <h1 class="playlist-title-large">${escapeHTML(playlist.name)}</h1>
        <div class="playlist-creator-meta">
          <img class="playlist-creator-avatar" src="/assets/pawtify.png" alt="Pawtify" />
          <span class="playlist-creator-name">${escapeHTML(playlist.uploaderName || 'Pawtify')}</span>
        </div>
        <p class="playlist-sub-stats">
          ${playlist.isAlbum ? 'Album' : 'Playlist'} &bull; ${songCount} song${songCount === 1 ? '' : 's'}
        </p>
      </div>

      <!-- Action Row: Circular Download, Share, Shuffle + Green Circular Play FAB (#1ed760) -->
      <div class="playlist-action-bar">
        <div class="playlist-left-actions">
          <button class="playlist-action-circle" data-action="download-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Download playlist">
            <i class="fa-solid fa-circle-down"></i>
          </button>
          <button class="playlist-action-circle" data-action="share-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Share playlist">
            <i class="fa-solid fa-share-nodes"></i>
          </button>
          <button class="playlist-action-circle" data-action="shuffle-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Shuffle playlist">
            <i class="fa-solid fa-shuffle"></i>
          </button>
        </div>

        <button class="playlist-fab-play" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="${isPlayingThis ? 'Pause' : 'Play'}">
          <i class="fa-solid ${isPlayingThis ? 'fa-pause' : 'fa-play'}"></i>
        </button>
      </div>

      <!-- Track List -->
      <div class="song-table playlist-song-list">
        ${songCount ? playlist.songs.map((s, i) => renderSongRow(s, i + 1, 'playlist', playlist.id)).join('') : '<div class="empty-state">This playlist is empty. Search for songs to add them.</div>'}
      </div>
    </section>
  `;
}

export function renderSongRow(song, index, source, playlistId = '') {
  if (!song) return '';
  rememberSongs([song]);
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
         <div class="song-artist" data-action="open-artist-profile" data-artist="${escapeHTML(song.artist)}">${escapeHTML(song.artist)}</div>
       </div>
       <div class="song-duration">${escapeHTML(song.duration || '0:00')}</div>
       <div class="song-actions">
         <button class="song-action-btn song-menu-trigger" data-action="open-track-menu" data-song-id="${escapeHTML(song.id)}" data-playlist-id="${escapeHTML(playlistId)}" type="button" aria-label="More options for ${escapeHTML(song.title)}" title="More options">
           <i class="fa-solid fa-ellipsis-vertical"></i>
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
  const isSaved = isPlaylistSaved(playlist.id);
  const isCustomUserPlaylist = state.playlists.some((p) => p.id === playlist.id);
  return `
    <div class="card" data-action="navigate" data-path="/playlist/${escapeHTML(playlist.id)}" tabindex="0">
      <div class="card-img-wrap">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <button class="card-play-btn" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Play ${escapeHTML(playlist.name)}">
          <i class="fa-solid fa-play"></i>
        </button>
        ${
          !playlist.isSystem && !isCustomUserPlaylist
            ? `
          <button class="card-bookmark-btn ${isSaved ? 'saved' : ''}" data-action="toggle-save-playlist" data-playlist-id="${escapeHTML(playlist.id)}" data-playlist-name="${escapeHTML(playlist.name)}" data-playlist-uploader="${escapeHTML(playlist.uploaderName || '')}" data-playlist-cover="${escapeHTML(rawCover)}" type="button" aria-label="${isSaved ? 'Unsave playlist' : 'Save playlist'}" title="${isSaved ? 'Unsave Playlist' : 'Save Playlist'}">
            <i class="fa-solid ${isSaved ? 'fa-bookmark' : 'fa-bookmark-slash'}"></i>
          </button>
        `
            : ''
        }
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
  const isSaved = isPlaylistSaved(playlist.id);
  return `
    <div class="card" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(playlist.id)}" tabindex="0" role="button" aria-label="Open playlist ${escapeHTML(playlist.name)}">
      <div class="card-img-wrap">
        <img class="card-cover" src="${escapeHTML(coverUrl)}" alt="${escapeHTML(playlist.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <button class="card-play-btn" data-action="play-all-playlist" data-playlist-id="${escapeHTML(playlist.id)}" type="button" aria-label="Play ${escapeHTML(playlist.name)}">
          <i class="fa-solid fa-play"></i>
        </button>
        <button class="card-bookmark-btn ${isSaved ? 'saved' : ''}" data-action="toggle-save-playlist" data-playlist-id="${escapeHTML(playlist.id)}" data-playlist-name="${escapeHTML(playlist.name)}" data-playlist-uploader="${escapeHTML(playlist.uploaderName || '')}" data-playlist-cover="${escapeHTML(rawCover)}" type="button" aria-label="${isSaved ? 'Unsave playlist' : 'Save playlist'}" title="${isSaved ? 'Unsave Playlist' : 'Save Playlist'}">
          <i class="fa-solid ${isSaved ? 'fa-bookmark' : 'fa-bookmark-slash'}"></i>
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
  const isSaved = isAlbumSaved({ name: album.name, artist: album.artist, id: album.id });
  return `
    <div class="card" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(album.id)}" tabindex="0" role="button" aria-label="Open album ${escapeHTML(album.name)}">
      <div class="card-img-wrap">
        <img class="card-cover" src="${escapeHTML(coverUrl)}" alt="${escapeHTML(album.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <button class="card-play-btn" data-action="play-all-playlist" data-playlist-id="${escapeHTML(album.id)}" type="button" aria-label="Play ${escapeHTML(album.name)}">
          <i class="fa-solid fa-play"></i>
        </button>
        <button class="card-bookmark-btn ${isSaved ? 'saved' : ''}" data-action="toggle-save-album" data-album-id="${escapeHTML(album.id)}" data-album-name="${escapeHTML(album.name)}" data-album-artist="${escapeHTML(album.artist || '')}" data-album-cover="${escapeHTML(rawCover)}" data-album-year="${escapeHTML(album.year || '')}" type="button" aria-label="${isSaved ? 'Unsave album' : 'Save album'}" title="${isSaved ? 'Unsave Album' : 'Save Album'}">
          <i class="fa-solid ${isSaved ? 'fa-bookmark' : 'fa-bookmark-slash'}"></i>
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
  const isFollowed = isArtistFollowed(artist.name);
  return `
    <div class="card card-search-artist" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" tabindex="0" role="button" aria-label="View artist ${escapeHTML(artist.name)}">
      <div class="card-img-wrap" style="border-radius: 50%; overflow: hidden; margin-bottom: 12px; aspect-ratio: 1/1; position: relative;">
        <img src="${escapeHTML(coverUrl)}" alt="${escapeHTML(artist.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" style="object-fit: cover; width: 100%; height: 100%;" />
      </div>
      <div class="card-title" style="text-align: center;">${escapeHTML(artist.name)}</div>
      <div class="card-meta" style="text-align: center; margin-bottom: 8px;">Artist</div>
      <div style="display: flex; justify-content: center; margin-top: auto;">
        <button class="btn-card-follow ${isFollowed ? 'following' : ''}" data-action="toggle-follow-artist" data-artist="${escapeHTML(artist.name)}" data-image="${escapeHTML(rawCover)}" type="button" aria-label="${isFollowed ? 'Following' : 'Follow'} ${escapeHTML(artist.name)}">
          <i class="fa-solid ${isFollowed ? 'fa-check' : 'fa-plus'}"></i>
          <span>${isFollowed ? 'Following' : 'Follow'}</span>
        </button>
      </div>
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

const DISCOVER_ITEMS = [
  {
    tag: '#bollywood lofi',
    title: 'Tu Hai Kahan',
    artist: 'AUR',
    bg: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&q=80&w=320&h=480',
    query: 'Tu Hai Kahan AUR',
  },
  {
    tag: '#hindi pop',
    title: 'Husn',
    artist: 'Anuv Jain',
    bg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=320&h=480',
    query: 'Husn Anuv Jain',
  },
  {
    tag: '#playful',
    title: 'Iraaday',
    artist: 'Abdul Hannan',
    bg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=320&h=480',
    query: 'Iraaday Abdul Hannan',
  },
  {
    tag: '#chill lofi',
    title: 'Akhiyaan',
    artist: 'Mitraz',
    bg: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=320&h=480',
    query: 'Akhiyaan Mitraz',
  },
  {
    tag: '#trending beats',
    title: 'Kesariya',
    artist: 'Arijit Singh',
    bg: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=320&h=480',
    query: 'Kesariya Arijit Singh',
  },
];

const SEARCH_CATEGORIES_SPOTIFY = [
  {
    name: 'Music',
    color: '#dc148c',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Podcasts',
    color: '#006450',
    image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Live Events',
    color: '#8400e7',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Home of I-Pop',
    color: '#e91429',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Made For You',
    color: '#1e3264',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Upcoming Releases',
    color: '#e8115b',
    image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'New Releases',
    color: '#ba5d07',
    image: 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Hindi',
    color: '#8c1932',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Punjabi',
    color: '#b06239',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=200&h=200',
  },
  {
    name: 'Charts',
    color: '#8d67ab',
    image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200&h=200',
  },
];

export function renderSearchCategories() {
  const recentQueries = (state.recentSearches || [])
    .filter((item) => item.type === 'query')
    .slice(0, 8);

  return `
    <div class="search-categories-wrapper">
      ${recentQueries.length > 0 ? `
        <div class="search-recent-section">
          <div class="search-section-head">
            <h2 class="search-section-title">Recent searches</h2>
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

      <!-- Discover something new Horizontal Carousel (Tall Vertical Video Cards with tags) -->
      <section class="discover-section">
        <h2 class="discover-section-title">Discover something new</h2>
        <div class="discover-carousel">
          ${DISCOVER_ITEMS.map((item) => `
            <article class="discover-card-vertical" data-action="use-recent-search" data-query="${escapeHTML(item.query)}" role="button" tabindex="0" style="background-image: url('${item.bg}');">
              <div class="discover-card-overlay"></div>
              <div class="discover-card-tag">${escapeHTML(item.tag)}</div>
              <div class="discover-card-info">
                <span class="discover-card-title">${escapeHTML(item.title)}</span>
                <span class="discover-card-artist">${escapeHTML(item.artist)}</span>
              </div>
            </article>
          `).join('')}
        </div>
      </section>

      <!-- Browse All 2-Column Angled Category Grid -->
      <section class="search-browse-section">
        <h2 class="search-section-title" style="margin-bottom: 14px;">Browse all</h2>
        <div class="category-grid-spotify">
          ${SEARCH_CATEGORIES_SPOTIFY.map((cat) => `
            <div class="category-card-angled" data-action="search-category" data-category="${escapeHTML(cat.name)}" tabindex="0" role="button" style="background-color: ${cat.color};">
              <span class="category-card-title">${escapeHTML(cat.name)}</span>
              <img class="angled-thumb" src="${cat.image}" alt="" loading="lazy" draggable="false" />
            </div>
          `).join('')}
        </div>
      </section>
    </div>
  `;
}
