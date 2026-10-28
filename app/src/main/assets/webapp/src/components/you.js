import { state, LOGO_URL } from '../config/config.js';
import {
  escapeHTML,
  formatTime,
  getOptimizedArtwork,
  formatRelativeTime,
} from '../utils/utils.js';
import { getSongById } from '../core/details.js';
import { isArtistFollowed, isPlaylistSaved, isAlbumSaved } from './player.js';

/**
 * High-Density Material Design 3 (MD3) You / Personal Library Page
 * Features compact list items, pill-shaped filter chips, and square artwork.
 */
export function renderYouPage() {
  const activeFilter = state.youFilter || 'all';

  const playlistsCount =
    (state.playlists ? state.playlists.length : 0) +
    (state.savedPlaylists ? state.savedPlaylists.length : 0);
  const favoritesCount = state.favorites ? state.favorites.length : 0;
  const historyCount = state.recentlyPlayed ? state.recentlyPlayed.length : 0;
  const albumsCount = state.savedAlbums ? state.savedAlbums.length : 0;
  const artistsCount = state.followedArtists ? state.followedArtists.length : 0;

  // Filter chips row
  const filterChipsHTML = `
    <div class="you-filter-chips-row" role="tablist">
      <button class="you-filter-chip ${activeFilter === 'all' ? 'active' : ''}" data-action="set-you-filter" data-filter="all" type="button">All</button>
      <button class="you-filter-chip ${activeFilter === 'playlists' ? 'active' : ''}" data-action="set-you-filter" data-filter="playlists" type="button">Playlists (${playlistsCount})</button>
      <button class="you-filter-chip ${activeFilter === 'liked' ? 'active' : ''}" data-action="set-you-filter" data-filter="liked" type="button">Liked (${favoritesCount})</button>
      <button class="you-filter-chip ${activeFilter === 'albums' ? 'active' : ''}" data-action="set-you-filter" data-filter="albums" type="button">Albums (${albumsCount})</button>
      <button class="you-filter-chip ${activeFilter === 'artists' ? 'active' : ''}" data-action="set-you-filter" data-filter="artists" type="button">Artists (${artistsCount})</button>
      <button class="you-filter-chip ${activeFilter === 'downloads' ? 'active' : ''}" data-action="set-you-filter" data-filter="downloads" type="button">Downloads</button>
    </div>
  `;

  // Content generation based on filter
  let listItemsHTML = '';

  // 1. Liked Songs Item
  const likedRow = `
    <article class="library-list-item" data-action="navigate" data-path="/playlist/liked" role="button" tabindex="0">
      <div class="library-item-thumb-gradient">
        <i class="fa-solid fa-heart" style="color: #ffffff; font-size: 1.35rem;"></i>
      </div>
      <div class="library-item-info">
        <h3 class="library-item-title">Liked Songs</h3>
        <p class="library-item-sub"><i class="fa-solid fa-thumbtack pinned-icon" style="color:var(--green); font-size:0.75rem;"></i> Pinned &bull; ${favoritesCount} song${favoritesCount === 1 ? '' : 's'}</p>
      </div>
      <button class="icon-btn small" data-action="play-favorites" type="button" aria-label="Play Liked Songs">
        <i class="fa-solid fa-play"></i>
      </button>
    </article>
  `;

  // 2. Playlists
  const allUserAndSavedPlaylists = [
    ...(state.playlists || []),
    ...(state.savedPlaylists || []).filter(
      (sp) => !(state.playlists || []).some((p) => p.id === sp.id)
    ),
  ];

  const playlistsItems = allUserAndSavedPlaylists.map((p) => {
    const cover = p.coverUrl || p.songs?.[0]?.coverUrl || '/assets/pawtify.png';
    const uploader =
      p.uploaderName ||
      (state.playlists.some((sp) => sp.id === p.id) ? 'You' : 'Pawtify');
    const count = p.songs ? p.songs.length : p.songCount || 0;
    return `
      <article class="library-list-item" data-action="open-playlist-profile" data-playlist-id="${escapeHTML(p.id)}" role="button" tabindex="0">
        <img class="library-item-thumb" src="${escapeHTML(getOptimizedArtwork(cover, 160))}" alt="${escapeHTML(p.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <div class="library-item-info">
          <h3 class="library-item-title">${escapeHTML(p.name)}</h3>
          <p class="library-item-sub">Playlist &bull; ${escapeHTML(uploader)}${count ? ` &bull; ${count} songs` : ''}</p>
        </div>
        <button class="icon-btn small" data-action="play-all-playlist" data-playlist-id="${escapeHTML(p.id)}" type="button" aria-label="Play playlist">
          <i class="fa-solid fa-play"></i>
        </button>
      </article>
    `;
  }).join('');

  // 3. Saved Albums
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

  const albumsItems = Array.from(albumMap.values()).map((album) => {
    const isRemote = album.id && !String(album.id).startsWith('album-');
    return `
      <article class="library-list-item" ${isRemote ? `data-action="open-playlist-profile" data-playlist-id="${escapeHTML(album.id)}"` : `data-action="open-artist-profile" data-artist="${escapeHTML(album.artist)}"`} role="button" tabindex="0">
        <img class="library-item-thumb" src="${escapeHTML(album.coverUrl)}" alt="${escapeHTML(album.name)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
        <div class="library-item-info">
          <h3 class="library-item-title">${escapeHTML(album.name)}</h3>
          <p class="library-item-sub">Album &bull; ${escapeHTML(album.artist)} &bull; ${album.songCount} track${album.songCount === 1 ? '' : 's'}</p>
        </div>
        <button class="icon-btn small" ${isRemote ? `data-action="play-all-playlist" data-playlist-id="${escapeHTML(album.id)}"` : `data-action="open-artist-profile" data-artist="${escapeHTML(album.artist)}"`} type="button" aria-label="Play Album">
          <i class="fa-solid fa-play"></i>
        </button>
      </article>
    `;
  }).join('');

  // 4. Followed Artists
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

  const artistsItems = Array.from(artistMap.values()).map((artist) => {
    return `
      <article class="library-list-item" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" role="button" tabindex="0">
        <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; background: var(--hover); flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
          ${
            artist.imageUrl
              ? `<img src="${escapeHTML(getOptimizedArtwork(artist.imageUrl, 160))}" alt="${escapeHTML(artist.name)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" /><i class="fa-solid fa-user" style="display:none; font-size: 1.5rem; color: var(--muted);"></i>`
              : `<i class="fa-solid fa-user" style="font-size: 1.5rem; color: var(--muted);"></i>`
          }
        </div>
        <div class="library-item-info">
          <h3 class="library-item-title">${escapeHTML(artist.name)}</h3>
          <p class="library-item-sub">Artist &bull; Following</p>
        </div>
        <button class="icon-btn small" data-action="open-artist-profile" data-artist="${escapeHTML(artist.name)}" type="button" aria-label="View artist">
          <i class="fa-solid fa-chevron-right"></i>
        </button>
      </article>
    `;
  }).join('');

  // 5. Downloads / Offline Item
  const downloadsItems = `
    <article class="library-list-item" data-action="install-pwa" role="button" tabindex="0">
      <div class="library-item-thumb-gradient" style="background: #1a1a1a;">
        <i class="fa-solid fa-download" style="color: #1db954; font-size: 1.3rem;"></i>
      </div>
      <div class="library-item-info">
        <h3 class="library-item-title">Offline Cache &amp; PWA</h3>
        <p class="library-item-sub">Native app installation and cached resources</p>
      </div>
      <button class="btn btn-soft btn-sm" data-action="install-pwa" type="button">
        Install
      </button>
    </article>
    <article class="library-list-item" data-action="export-library" role="button" tabindex="0">
      <div class="library-item-thumb-gradient" style="background: #1a1a1a;">
        <i class="fa-solid fa-file-export" style="color: #1db954; font-size: 1.3rem;"></i>
      </div>
      <div class="library-item-info">
        <h3 class="library-item-title">Export Library Backup</h3>
        <p class="library-item-sub">Save all playlists and history to JSON file</p>
      </div>
      <button class="btn btn-soft btn-sm" data-action="export-library" type="button">
        Export
      </button>
    </article>
  `;

  if (activeFilter === 'all') {
    listItemsHTML = likedRow + playlistsItems + albumsItems + artistsItems + downloadsItems;
  } else if (activeFilter === 'playlists') {
    listItemsHTML = `
      <div style="padding: 4px 10px 10px;">
        <button class="btn btn-primary btn-sm" data-action="open-create-playlist" type="button" style="border-radius: 9999px; width: 100%;">
          <i class="fa-solid fa-plus"></i> New Playlist
        </button>
      </div>
      ${playlistsItems || '<div class="empty-state"><p>No custom playlists saved yet.</p></div>'}
    `;
  } else if (activeFilter === 'liked') {
    const favorites = state.favorites || [];
    listItemsHTML = favorites.length
      ? favorites.map((song) => `
        <article class="library-list-item" data-action="play-song" data-song-id="${escapeHTML(song.id)}" data-source="favorites" role="button" tabindex="0">
          <img class="library-item-thumb" src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 160))}" alt="${escapeHTML(song.title)}" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
          <div class="library-item-info">
            <h3 class="library-item-title">${escapeHTML(song.title)}</h3>
            <p class="library-item-sub"><i class="fa-solid fa-heart" style="color:var(--green); font-size:0.75rem;"></i> ${escapeHTML(song.artist)}</p>
          </div>
          <button class="icon-btn small song-menu-trigger" data-action="open-track-menu" data-song-id="${escapeHTML(song.id)}" type="button" aria-label="More options">
            <i class="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </article>
      `).join('')
      : '<div class="empty-state"><p>No liked songs yet.</p></div>';
  } else if (activeFilter === 'albums') {
    listItemsHTML = albumsItems || '<div class="empty-state"><p>No saved albums found.</p></div>';
  } else if (activeFilter === 'artists') {
    listItemsHTML = artistsItems || '<div class="empty-state"><p>No followed artists found.</p></div>';
  } else if (activeFilter === 'downloads') {
    listItemsHTML = downloadsItems;
  }

  return `
    <section class="page you-page-spotify">
      <!-- High-Density Header -->
      <header class="library-header-spotify" style="padding: 16px 16px 6px;">
        <div class="library-top-bar" style="margin-bottom: 10px;">
          <div class="library-user-title-wrap">
            <button class="library-avatar-btn" data-action="edit-user-name" type="button" aria-label="Profile">
              <img class="library-avatar-img" src="${LOGO_URL}" alt="Profile" />
            </button>
            <h1 class="library-title-spotify">${escapeHTML(state.userName || 'You')}</h1>
          </div>
          <div class="library-actions">
            <button class="library-icon-btn" data-action="open-create-playlist" type="button" aria-label="New Playlist" title="Create Playlist">
              <i class="fa-solid fa-plus"></i>
            </button>
            <button class="library-icon-btn" data-action="open-settings" type="button" aria-label="Settings" title="Settings">
              <i class="fa-solid fa-gear"></i>
            </button>
          </div>
        </div>

        <!-- Filter Chips Row -->
        ${filterChipsHTML}
      </header>

      <!-- Compact MD3 List Container -->
      <div class="library-list-container">
        ${listItemsHTML}
      </div>
    </section>
  `;
}

/**
 * Clean, Flat Material Design 3 Settings Section
 * Stripped of bulky nested cards and replaced with flat list rows and native-looking MD3 switches.
 */
export function renderSettingsSections() {
  const favoritesCount = state.favorites?.length || 0;
  const playlistsCount = state.playlists?.length || 0;
  const historyCount = state.recentlyPlayed?.length || 0;
  const activeTheme = state.theme || 'amoled';
  const quality = state.audioQuality || 'high';

  return `
    <div class="settings-flat-container">
      <!-- 1. Playback & Engine -->
      <div class="settings-flat-header">
        <i class="fa-solid fa-play"></i> Playback
      </div>
      <div class="settings-flat-group">
        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Continuous Streaming (Autoplay)</div>
            <div class="settings-flat-desc">Play similar songs automatically when queue ends</div>
          </div>
          <button class="md3-switch ${state.autoplay !== false ? 'active' : ''}" data-action="toggle-autoplay" type="button" role="switch" aria-checked="${state.autoplay !== false ? 'true' : 'false'}" aria-label="Toggle Continuous Autoplay"></button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Shuffle Playback</div>
            <div class="settings-flat-desc">Randomize the order of queued tracks</div>
          </div>
          <button class="md3-switch ${state.shuffleMode ? 'active' : ''}" data-action="toggle-shuffle" type="button" role="switch" aria-checked="${state.shuffleMode ? 'true' : 'false'}" aria-label="Toggle Shuffle"></button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Audio Quality</div>
            <div class="settings-flat-desc">Target bitrate for audio streams</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-soft btn-sm ${quality === 'normal' ? 'active' : ''}" data-action="set-audio-quality" data-quality="normal" type="button" style="border-radius:9999px;">128k</button>
            <button class="btn btn-soft btn-sm ${quality === 'high' ? 'active' : ''}" data-action="set-audio-quality" data-quality="high" type="button" style="border-radius:9999px;">160k Opus</button>
            <button class="btn btn-soft btn-sm ${quality === 'very-high' ? 'active' : ''}" data-action="set-audio-quality" data-quality="very-high" type="button" style="border-radius:9999px;">256k</button>
          </div>
        </div>
      </div>

      <!-- 2. Appearance & Dynamic AMOLED Theme -->
      <div class="settings-flat-header">
        <i class="fa-solid fa-palette"></i> Appearance &amp; Theming
      </div>
      <div class="settings-flat-group">
        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Theme Mode</div>
            <div class="settings-flat-desc">AMOLED pitch-black optimizes OLED battery life</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-soft btn-sm ${activeTheme === 'amoled' || activeTheme === 'dark' ? 'active' : ''}" data-action="set-theme" data-theme="amoled" type="button" style="border-radius:9999px;">
              <i class="fa-solid fa-circle" style="color:#000000; margin-right:4px;"></i> AMOLED
            </button>
            <button class="btn btn-soft btn-sm ${activeTheme === 'light' ? 'active' : ''}" data-action="set-theme" data-theme="light" type="button" style="border-radius:9999px;">
              <i class="fa-solid fa-sun" style="color:#f59e0b; margin-right:4px;"></i> Light
            </button>
          </div>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Floating Video Window</div>
            <div class="settings-flat-desc">Watch official music video alongside playback</div>
          </div>
          <button class="md3-switch ${state.videoVisible ? 'active' : ''}" data-action="toggle-video" type="button" role="switch" aria-checked="${state.videoVisible ? 'true' : 'false'}" aria-label="Toggle Video Player"></button>
        </div>
      </div>

      <!-- 3. Storage & Offline -->
      <div class="settings-flat-header">
        <i class="fa-solid fa-database"></i> Storage &amp; Offline
      </div>
      <div class="settings-flat-group">
        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">PWA Progressive App</div>
            <div class="settings-flat-desc">Install to home screen for offline playback</div>
          </div>
          <button class="btn btn-soft btn-sm" data-action="install-pwa" type="button" style="border-radius:9999px;">
            <i class="fa-solid fa-download"></i> Install
          </button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Clear Cached Data</div>
            <div class="settings-flat-desc">Flush temporary image/audio cache (preserves playlists)</div>
          </div>
          <button class="btn btn-soft btn-sm" data-action="clear-cache" type="button" style="border-radius:9999px; color:var(--danger);">
            <i class="fa-solid fa-trash-can"></i> Clear
          </button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Export / Import Library</div>
            <div class="settings-flat-desc">Export JSON backup or restore saved playlists</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-soft btn-sm" data-action="export-library" type="button" style="border-radius:9999px;">
              <i class="fa-solid fa-file-export"></i> Export
            </button>
            <button class="btn btn-soft btn-sm" data-action="import-library" type="button" style="border-radius:9999px;">
              <i class="fa-solid fa-file-import"></i> Import
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Privacy & About -->
      <div class="settings-flat-header">
        <i class="fa-solid fa-shield-halved"></i> Privacy &amp; About
      </div>
      <div class="settings-flat-group">
        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Listening History</div>
            <div class="settings-flat-desc">${historyCount} tracks recorded locally</div>
          </div>
          <button class="btn btn-soft btn-sm" data-action="clear-history" type="button" style="border-radius:9999px; color:var(--danger);" ${historyCount === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-clock-rotate-left"></i> Wipe
          </button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Pawtify Web Player</div>
            <div class="settings-flat-desc">v1.0.0 &bull; 100% Client-Side &bull; Zero Telemetry</div>
          </div>
          <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener noreferrer" class="btn btn-soft btn-sm" style="border-radius:9999px;">
            <i class="fa-brands fa-github"></i> GitHub
          </a>
        </div>
      </div>
    </div>
  `;
}

/**
 * Settings Page View
 */
export function renderSettingsPage() {
  return `
    <section class="page settings-page">
      <div class="settings-header-sticky" style="padding: 16px 16px 12px; display: flex; align-items: center; gap: 14px;">
        <button class="settings-back-btn" data-action="go-back" data-fallback="/you" type="button" aria-label="Back" title="Back">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h1 class="settings-page-title" style="font-size: 1.35rem; font-weight: 700;">Settings</h1>
          <p class="settings-page-sub" style="font-size: 0.825rem; color: var(--muted);">Material Design 3 preferences and audio controls</p>
        </div>
      </div>
      ${renderSettingsSections()}
    </section>
  `;
}
