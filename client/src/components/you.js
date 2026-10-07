import { state, LOGO_URL } from '../config/config.js';
import { escapeHTML, formatTime, getOptimizedArtwork } from '../utils/utils.js';
import { renderPlaylistCard, renderSongRow } from './components.js';
import { getSongById } from '../core/details.js';

export function renderYouPage() {
  const playlistsCount = state.playlists ? state.playlists.length : 0;
  const favoritesCount = state.favorites ? state.favorites.length : 0;
  const historyCount = state.recentlyPlayed ? state.recentlyPlayed.length : 0;
  const queueCount = state.queue ? state.queue.length : 0;

  const hour = new Date().getHours();
  let greeting = 'Welcome back';
  if (hour >= 5 && hour < 12) greeting = 'Good morning';
  else if (hour >= 12 && hour < 18) greeting = 'Good afternoon';
  else greeting = 'Good evening';

  // 1. Liked Songs cover art preview
  const recentFavorites = (state.favorites || []).slice(0, 4);
  const firstFavCover =
    recentFavorites.length > 0
      ? getOptimizedArtwork(recentFavorites[0].coverUrl, 300)
      : '';

  // 2. User's custom playlists preview (up to 4 for clean spacing)
  const userPlaylists = (state.playlists || []).slice(0, 4);
  const playlistsHTML =
    userPlaylists.length > 0
      ? `<div class="card-grid">${userPlaylists.map((p, i) => renderPlaylistCard(p, i)).join('')}</div>`
      : `
        <div class="you-empty-card">
          <div class="you-empty-icon"><i class="fa-solid fa-list-ul"></i></div>
          <div class="you-empty-text">
            <strong>No custom playlists</strong>
            <span>Create playlists to organize your favorite songs and albums.</span>
          </div>
          <button class="btn btn-primary you-action-btn" data-action="open-create-playlist" type="button">
            <i class="fa-solid fa-plus"></i> New Playlist
          </button>
        </div>
      `;

  // 3. Recently Played Tracks Preview (latest 4 tracks)
  const recentSongObjects = (state.recentlyPlayed || [])
    .map((id) => getSongById(id))
    .filter(Boolean)
    .slice(0, 4);

  const recentTracksHTML = recentSongObjects.length
    ? `
      <div class="song-table">
        ${recentSongObjects.map((song, i) => renderSongRow(song, i + 1, 'history')).join('')}
      </div>
    `
    : `
      <div class="you-empty-card">
        <div class="you-empty-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
        <div class="you-empty-text">
          <strong>No recent tracks</strong>
          <span>Tracks you stream will be recorded here in your listening history.</span>
        </div>
        <button class="btn btn-soft you-action-btn" data-action="play-something" type="button">
          <i class="fa-solid fa-play"></i> Play Something
        </button>
      </div>
    `;

  // 4. Saved / Followed Artists in Library
  const rawArtists = [
    ...(state.favorites || []).map((s) => s.artist),
    ...(state.playlists || []).flatMap((p) =>
      (p.songs || []).map((s) => s.artist)
    ),
    ...recentSongObjects.map((s) => s.artist),
  ].filter(Boolean);

  const uniqueArtists = Array.from(new Set(rawArtists)).slice(0, 8);
  const artistsHTML = uniqueArtists.length
    ? `
      <div class="card-grid">
        ${uniqueArtists
          .map(
            (artist) => `
            <div class="card card-artist" data-action="open-artist-profile" data-artist="${escapeHTML(artist)}" role="button" tabindex="0">
              <div class="card-cover-wrap card-cover-circle">
                <div class="card-artist-avatar">
                  <i class="fa-solid fa-user"></i>
                </div>
              </div>
              <div class="card-title text-center">${escapeHTML(artist)}</div>
              <div class="card-meta text-center">Artist</div>
            </div>
          `
          )
          .join('')}
      </div>
    `
    : `
      <div class="you-empty-card compact">
        <span>Save your favorite songs or playlists to view followed artists here.</span>
      </div>
    `;

  // 5. Saved Albums & Discographies
  const albumMap = new Map();
  [
    ...(state.favorites || []),
    ...(state.playlists || []).flatMap((p) => p.songs || []),
  ].forEach((s) => {
    if (s && s.album && s.album !== 'Single' && s.album !== 'Unknown') {
      if (!albumMap.has(s.album)) {
        albumMap.set(s.album, {
          name: s.album,
          artist: s.artist,
          coverUrl: getOptimizedArtwork(s.coverUrl, 300),
          songCount: 1,
        });
      } else {
        albumMap.get(s.album).songCount += 1;
      }
    }
  });
  const savedAlbums = Array.from(albumMap.values()).slice(0, 4);

  const albumsHTML = savedAlbums.length
    ? `
      <div class="card-grid">
        ${savedAlbums
          .map(
            (album) => `
            <div class="card" data-action="open-artist-profile" data-artist="${escapeHTML(album.artist)}" role="button" tabindex="0">
              <div class="card-cover-wrap">
                <img class="card-cover" src="${escapeHTML(album.coverUrl)}" alt="${escapeHTML(album.name)}" draggable="false" loading="lazy" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
                <button class="card-play-btn" type="button" aria-label="View Album">
                  <i class="fa-solid fa-compact-disc"></i>
                </button>
              </div>
              <div class="card-title">${escapeHTML(album.name)}</div>
              <div class="card-meta">${escapeHTML(album.artist)} &bull; ${album.songCount} track${album.songCount === 1 ? '' : 's'}</div>
            </div>
          `
          )
          .join('')}
      </div>
    `
    : `
      <div class="you-empty-card compact">
        <span>Save tracks with album metadata to organize your personal discography here.</span>
      </div>
    `;

  return `
    <section class="page you-page">
      <!-- 📌 1. Page Header -->
      <div class="you-header">
        <div class="you-header-titles">
          <span class="you-header-kicker">Profile &amp; Library</span>
          <h1 class="you-header-title">You</h1>
        </div>
        <div class="you-header-actions">
          <button class="btn btn-soft btn-sm" data-action="edit-user-name" type="button" title="Edit Profile">
            <i class="fa-solid fa-pen"></i>
            <span>Edit Profile</span>
          </button>
          <button class="btn btn-soft btn-sm" data-action="open-settings" type="button" title="Settings">
            <i class="fa-solid fa-gear"></i>
            <span>Settings</span>
          </button>
        </div>
      </div>

      <!-- 👤 2. Profile / Welcome Area -->
      <header class="you-profile-card">
        <div class="you-profile-main">
          <div class="you-avatar-wrap">
            <img src="${LOGO_URL}" alt="Pawtify" class="you-avatar-img" draggable="false" />
            <span class="you-status-dot" title="Active session" aria-hidden="true"></span>
          </div>
          <div class="you-profile-details">
            <span class="you-profile-greeting">${greeting}</span>
            <div class="you-title-row">
              <h2 class="you-name">${escapeHTML(state.userName || 'Pawtify Listener')}</h2>
              <span class="you-badge-member"><i class="fa-solid fa-shield-cat"></i> Pawtify Free</span>
            </div>
            <div class="you-tagline">
              <span class="you-tagline-stat"><strong>${favoritesCount}</strong> Liked tracks</span>
              <span class="you-tagline-dot" aria-hidden="true">&bull;</span>
              <span class="you-tagline-stat"><strong>${playlistsCount}</strong> Playlists</span>
              <span class="you-tagline-dot" aria-hidden="true">&bull;</span>
              <span class="you-tagline-stat"><strong>${historyCount}</strong> Streamed</span>
            </div>
          </div>
        </div>
        <div class="you-profile-quick-actions">
          <button class="btn btn-primary btn-sm" data-action="open-create-playlist" type="button">
            <i class="fa-solid fa-plus"></i> New Playlist
          </button>
          <button class="btn btn-soft btn-sm" data-action="open-favorites" type="button">
            <i class="fa-solid fa-heart"></i> Liked Songs
          </button>
        </div>
      </header>

      <!-- 📋 3. Personal Music: Playlists -->
      <section class="you-section">
        <div class="you-section-head">
          <div class="you-section-head-titles">
            <h2 class="you-section-title"><i class="fa-solid fa-list-ul"></i>Your Playlists</h2>
            <span class="you-section-sub">Playlists created on this device</span>
          </div>
          <div class="you-section-actions">
            <button class="btn btn-soft btn-sm" data-action="open-create-playlist" type="button">
              <i class="fa-solid fa-plus"></i> New
            </button>
            <button class="btn btn-soft btn-sm" data-action="navigate" data-path="/library" type="button">
              View all
            </button>
          </div>
        </div>
        ${playlistsHTML}
      </section>

      <!-- 🕐 4. Personal Music: Recently Played -->
      <section class="you-section">
        <div class="you-section-head">
          <div class="you-section-head-titles">
            <h2 class="you-section-title"><i class="fa-solid fa-clock-rotate-left"></i>Recently Played</h2>
            <span class="you-section-sub">Your latest listening history</span>
          </div>
          <div class="you-section-actions">
            ${
              historyCount > 0
                ? `
                <button class="btn btn-soft btn-sm you-btn-danger" data-action="clear-history" type="button">
                  <i class="fa-solid fa-trash"></i> Clear
                </button>
                <button class="btn btn-soft btn-sm" data-action="navigate" data-path="/playlist/history" type="button">
                  View all
                </button>
              `
                : ''
            }
          </div>
        </div>
        ${recentTracksHTML}
      </section>

      <!-- 💿 5. Personal Music: Saved Albums -->
      <section class="you-section">
        <div class="you-section-head">
          <div class="you-section-head-titles">
            <h2 class="you-section-title"><i class="fa-solid fa-compact-disc"></i>Saved Albums &amp; EPs</h2>
            <span class="you-section-sub">Albums from your saved tracks</span>
          </div>
        </div>
        ${albumsHTML}
      </section>

      <!-- 👨‍🎤 6. Personal Music: Followed Artists -->
      <section class="you-section">
        <div class="you-section-head">
          <div class="you-section-head-titles">
            <h2 class="you-section-title"><i class="fa-solid fa-user-group"></i>Artists in Your Library</h2>
            <span class="you-section-sub">Artists from your saved music</span>
          </div>
        </div>
        ${artistsHTML}
      </section>

      <!-- 🧭 7. Library Shortcuts Hub -->
      <section class="you-section you-shortcuts-section">
        <div class="you-section-head">
          <div class="you-section-head-titles">
            <h2 class="you-section-title"><i class="fa-solid fa-compass"></i>Library Shortcuts</h2>
            <span class="you-section-sub">Quick navigation to your listening destinations</span>
          </div>
        </div>
        <div class="you-hub-grid">
          <!-- Liked Songs -->
          <article class="you-hub-card you-hub-liked" data-action="open-favorites" role="button" tabindex="0" aria-label="Open Liked Songs">
            <div class="you-hub-cover-wrap">
              ${
                firstFavCover
                  ? `<img src="${escapeHTML(firstFavCover)}" alt="" class="you-hub-cover" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />`
                  : `<div class="you-hub-icon hub-icon-heart"><i class="fa-solid fa-heart"></i></div>`
              }
            </div>
            <div class="you-hub-content">
              <strong class="you-hub-title">Liked Songs</strong>
              <span class="you-hub-sub">${favoritesCount} track${favoritesCount === 1 ? '' : 's'}</span>
            </div>
            <div class="you-hub-end">
              ${
                favoritesCount > 0
                  ? `<button class="you-hub-play" data-action="play-favorites" type="button" aria-label="Play Liked Songs" onclick="event.stopPropagation();"><i class="fa-solid fa-play"></i></button>`
                  : `<i class="fa-solid fa-chevron-right you-hub-arrow" aria-hidden="true"></i>`
              }
            </div>
          </article>

          <!-- Recently Played -->
          <article class="you-hub-card" data-action="navigate" data-path="/playlist/history" role="button" tabindex="0" aria-label="Open Recently Played">
            <div class="you-hub-cover-wrap">
              <div class="you-hub-icon hub-icon-clock"><i class="fa-solid fa-clock-rotate-left"></i></div>
            </div>
            <div class="you-hub-content">
              <strong class="you-hub-title">Recently Played</strong>
              <span class="you-hub-sub">${historyCount} track${historyCount === 1 ? '' : 's'}</span>
            </div>
            <div class="you-hub-end">
              <i class="fa-solid fa-chevron-right you-hub-arrow" aria-hidden="true"></i>
            </div>
          </article>

          <!-- Playlists -->
          <article class="you-hub-card" data-action="navigate" data-path="/library" role="button" tabindex="0" aria-label="Open Playlists">
            <div class="you-hub-cover-wrap">
              <div class="you-hub-icon hub-icon-playlist"><i class="fa-solid fa-list-ul"></i></div>
            </div>
            <div class="you-hub-content">
              <strong class="you-hub-title">Your Playlists</strong>
              <span class="you-hub-sub">${playlistsCount} playlist${playlistsCount === 1 ? '' : 's'}</span>
            </div>
            <div class="you-hub-end">
              <i class="fa-solid fa-chevron-right you-hub-arrow" aria-hidden="true"></i>
            </div>
          </article>

          <!-- Queue -->
          <article class="you-hub-card" data-action="open-queue" role="button" tabindex="0" aria-label="Open Playback Queue">
            <div class="you-hub-cover-wrap">
              <div class="you-hub-icon hub-icon-queue"><i class="fa-solid fa-bars-staggered"></i></div>
            </div>
            <div class="you-hub-content">
              <strong class="you-hub-title">Current Queue</strong>
              <span class="you-hub-sub">${queueCount > 0 ? `${queueCount} upcoming` : (state.currentSong ? '1 streaming' : 'Empty')}</span>
            </div>
            <div class="you-hub-end">
              <i class="fa-solid fa-chevron-right you-hub-arrow" aria-hidden="true"></i>
            </div>
          </article>
        </div>
      </section>

      <!-- ⚙️ 8. Settings & Preferences Gateway Entry -->
      <section class="you-section you-settings-gateway-section">
        <div class="you-section-head">
          <div class="you-section-head-titles">
            <h2 class="you-section-title"><i class="fa-solid fa-gear"></i>Settings &amp; Preferences</h2>
            <span class="you-section-sub">Appearance, playback, privacy and app preferences</span>
          </div>
        </div>
        <div class="you-settings-gateway-card" data-action="open-settings" role="button" tabindex="0" aria-label="Open Settings and Preferences">
          <div class="you-settings-gateway-left">
            <div class="you-settings-gateway-icon">
              <i class="fa-solid fa-sliders"></i>
            </div>
            <div class="you-settings-gateway-info">
              <strong class="you-settings-gateway-title">Settings &amp; Preferences</strong>
              <p class="you-settings-gateway-desc">Theme mode (AMOLED), audio stream quality, cache management, offline sync &amp; privacy controls</p>
            </div>
          </div>
          <div class="you-settings-gateway-action">
            <span class="you-settings-gateway-btn">Settings <i class="fa-solid fa-arrow-right"></i></span>
          </div>
        </div>
      </section>
    </section>
  `;
}

export function renderSettingsSections() {
  const favoritesCount = state.favorites?.length || 0;
  const playlistsCount = state.playlists?.length || 0;
  const historyCount = state.recentlyPlayed?.length || 0;
  const activeTheme = state.theme || 'amoled';
  const quality = state.audioQuality || 'high';

  return `
    <!-- 1. Appearance -->
    <div class="you-settings-group">
      <div class="you-settings-group-title"><i class="fa-solid fa-palette"></i> Appearance</div>
      <div class="you-settings-box">
        <div class="you-setting-row you-setting-row-stacked">
          <div class="you-setting-info">
            <div class="you-setting-label">Theme Mode</div>
            <div class="you-setting-desc">AMOLED pitch-black optimizes OLED battery life and visual comfort.</div>
          </div>
          <div class="you-theme-btn-group">
            <button class="btn btn-soft you-theme-pill ${activeTheme === 'amoled' ? 'active' : ''}" data-action="set-theme" data-theme="amoled" type="button">
              <i class="fa-solid fa-circle theme-icon-amoled"></i> AMOLED
            </button>
            <button class="btn btn-soft you-theme-pill ${activeTheme === 'dark' ? 'active' : ''}" data-action="set-theme" data-theme="dark" type="button">
              <i class="fa-solid fa-moon"></i> Dark
            </button>
            <button class="btn btn-soft you-theme-pill ${activeTheme === 'light' ? 'active' : ''}" data-action="set-theme" data-theme="light" type="button">
              <i class="fa-solid fa-sun theme-icon-light"></i> Light
            </button>
            <button class="btn btn-soft you-theme-pill ${activeTheme === 'system' ? 'active' : ''}" data-action="set-theme" data-theme="system" type="button">
              <i class="fa-solid fa-laptop"></i> System
            </button>
          </div>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-inline">
          <div class="you-setting-info">
            <div class="you-setting-label">Floating Video Window</div>
            <div class="you-setting-desc">Display synchronized YouTube music video alongside playback controls.</div>
          </div>
          <button class="toggle-switch ${state.videoVisible ? 'active' : ''}" data-action="toggle-video" type="button" role="switch" aria-checked="${state.videoVisible ? 'true' : 'false'}" aria-label="Toggle Video Player">
            <div class="toggle-switch-thumb"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- 3. Playback -->
    <div class="you-settings-group">
      <div class="you-settings-group-title"><i class="fa-solid fa-music"></i> Playback</div>
      <div class="you-settings-box">
        <div class="you-setting-row you-setting-row-inline">
          <div class="you-setting-info">
            <div class="you-setting-label">Continuous Streaming (Autoplay)</div>
            <div class="you-setting-desc">Automatically play similar tracks when current queue finishes.</div>
          </div>
          <button class="toggle-switch ${state.autoplay !== false ? 'active' : ''}" data-action="toggle-autoplay" type="button" role="switch" aria-checked="${state.autoplay !== false ? 'true' : 'false'}" aria-label="Toggle Continuous Autoplay">
            <div class="toggle-switch-thumb"></div>
          </button>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-stacked">
          <div class="you-setting-info">
            <div class="you-setting-label">Audio Stream Quality</div>
            <div class="you-setting-desc">Direct high-bitrate audio stream target.</div>
          </div>
          <div class="you-setting-actions">
            <button class="btn btn-soft you-setting-btn ${quality === 'normal' ? 'active' : ''}" data-action="set-audio-quality" data-quality="normal" type="button">128k</button>
            <button class="btn btn-soft you-setting-btn ${quality === 'high' ? 'active' : ''}" data-action="set-audio-quality" data-quality="high" type="button">160k Opus</button>
            <button class="btn btn-soft you-setting-btn ${quality === 'very-high' ? 'active' : ''}" data-action="set-audio-quality" data-quality="very-high" type="button">256k</button>
          </div>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-stacked">
          <div class="you-setting-info">
            <div class="you-setting-label">Default Repeat Mode</div>
            <div class="you-setting-desc">Control queue looping behavior.</div>
          </div>
          <div class="you-setting-actions">
            <button class="btn btn-soft you-setting-btn ${state.repeatMode === 'none' ? 'active' : ''}" data-action="set-repeat" data-mode="none" type="button">Off</button>
            <button class="btn btn-soft you-setting-btn ${state.repeatMode === 'all' ? 'active' : ''}" data-action="set-repeat" data-mode="all" type="button">All</button>
            <button class="btn btn-soft you-setting-btn ${state.repeatMode === 'one' ? 'active' : ''}" data-action="set-repeat" data-mode="one" type="button">1 Track</button>
          </div>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-inline">
          <div class="you-setting-info">
            <div class="you-setting-label">Shuffle Playback</div>
            <div class="you-setting-desc">Randomize the playback order of upcoming tracks.</div>
          </div>
          <button class="toggle-switch ${state.shuffleMode ? 'active' : ''}" data-action="toggle-shuffle" type="button" role="switch" aria-checked="${state.shuffleMode ? 'true' : 'false'}" aria-label="Toggle Shuffle">
            <div class="toggle-switch-thumb"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- 4. Downloads / Storage -->
    <div class="you-settings-group">
      <div class="you-settings-group-title"><i class="fa-solid fa-database"></i> Downloads &amp; Storage</div>
      <div class="you-settings-box">
        <div class="you-setting-row you-setting-row-responsive">
          <div class="you-setting-info">
            <div class="you-setting-label">Offline &amp; Service Worker</div>
            <div class="you-setting-desc">App shell and cached metadata cached for fast offline launch.</div>
          </div>
          <button class="btn btn-soft btn-sm" data-action="install-pwa" type="button">
            <i class="fa-solid fa-download"></i> Install App
          </button>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-responsive">
          <div class="you-setting-info">
            <div class="you-setting-label">Clear Cached Data</div>
            <div class="you-setting-desc">Flush temporary image and audio cache (keeps playlists).</div>
          </div>
          <button class="btn btn-soft btn-sm you-btn-danger" data-action="clear-cache" type="button">
            <i class="fa-solid fa-trash-can"></i> Clear Cache
          </button>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-inline">
          <div class="you-setting-info">
            <div class="you-setting-label">Local Storage Status</div>
            <div class="you-setting-desc">Dual IndexedDB + LocalStorage high-speed offline sync active.</div>
          </div>
          <span class="you-setting-tag">
            ${playlistsCount} playlists &bull; ${favoritesCount} liked
          </span>
        </div>
      </div>
    </div>

    <!-- 5. Privacy & Data -->
    <div class="you-settings-group">
      <div class="you-settings-group-title"><i class="fa-solid fa-shield-halved"></i> Privacy &amp; Data</div>
      <div class="you-settings-box">
        <div class="you-setting-row you-setting-row-responsive">
          <div class="you-setting-info">
            <div class="you-setting-label">Listening History</div>
            <div class="you-setting-desc">Clear your locally recorded stream history (${historyCount} tracks recorded).</div>
          </div>
          <button class="btn btn-soft btn-sm you-btn-danger" data-action="clear-history" type="button" ${historyCount === 0 ? 'disabled' : ''}>
            <i class="fa-solid fa-clock-rotate-left"></i> Clear History
          </button>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-stacked">
          <div class="you-setting-info">
            <div class="you-setting-label">Export / Import Library</div>
            <div class="you-setting-desc">Save a portable JSON backup or restore saved playlists.</div>
          </div>
          <div class="you-setting-actions">
            <button class="btn btn-soft btn-sm" data-action="export-library" type="button">
              <i class="fa-solid fa-file-export"></i> Export JSON
            </button>
            <button class="btn btn-soft btn-sm" data-action="import-library" type="button">
              <i class="fa-solid fa-file-import"></i> Import File
            </button>
          </div>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-inline">
          <div class="you-setting-info">
            <div class="you-setting-label">Zero-Telemetry Guarantee</div>
            <div class="you-setting-desc">No tracking pixels, third-party cookies, or analytics scripts.</div>
          </div>
          <span class="you-badge-soft">
            <i class="fa-solid fa-lock"></i> 100% Client-Side
          </span>
        </div>
      </div>
    </div>

    <!-- 6. App Settings -->
    <div class="you-settings-group">
      <div class="you-settings-group-title"><i class="fa-solid fa-sliders"></i> App Settings</div>
      <div class="you-settings-box">
        <div class="you-setting-row you-setting-row-inline">
          <div class="you-setting-info">
            <div class="you-setting-label">Media Session Controls</div>
            <div class="you-setting-desc">Lockscreen artwork, notification playback &amp; hardware media keys.</div>
          </div>
          <span class="you-badge-soft">
            <i class="fa-solid fa-check"></i> Integrated
          </span>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-responsive">
          <div class="you-setting-info">
            <div class="you-setting-label">Recent Searches History</div>
            <div class="you-setting-desc">Wipe quick query suggestions in the search bar.</div>
          </div>
          <button class="btn btn-soft btn-sm you-btn-danger" data-action="clear-recent-searches" type="button">
            <i class="fa-solid fa-magnifying-glass-minus"></i> Clear Searches
          </button>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-inline">
          <div class="you-setting-info">
            <div class="you-setting-label">Safe Stream Fallback</div>
            <div class="you-setting-desc">Automatically switch to alternative official releases if a stream restricts.</div>
          </div>
          <span class="you-setting-tag">
            <i class="fa-solid fa-circle-check you-green-icon"></i> Active
          </span>
        </div>
      </div>
    </div>

    <!-- 7. About -->
    <div class="you-settings-group">
      <div class="you-settings-group-title"><i class="fa-solid fa-circle-info"></i> About</div>
      <div class="you-settings-box">
        <div class="you-setting-row you-setting-row-responsive">
          <div class="you-setting-info">
            <div class="you-setting-label">Pawtify Web Player</div>
            <div class="you-setting-desc">v1.0.0 &bull; Private, distraction-free music streaming</div>
          </div>
          <div class="you-setting-actions">
            <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener noreferrer" class="btn btn-soft btn-sm you-nav-link">
              <i class="fa-brands fa-github"></i> GitHub
            </a>
            <button class="btn btn-soft btn-sm" data-action="open-app-info" type="button">
              <i class="fa-solid fa-paw"></i> Info
            </button>
          </div>
        </div>
        <div class="you-setting-divider"></div>
        <div class="you-setting-row you-setting-row-responsive">
          <div class="you-setting-info">
            <div class="you-setting-label you-danger-text">Factory Reset</div>
            <div class="you-setting-desc">Permanently wipe all local playlists, listening history, and personal settings.</div>
          </div>
          <button class="btn btn-soft btn-sm you-btn-danger" data-action="reset-all-data" type="button">
            <i class="fa-solid fa-triangle-exclamation"></i> Reset Everything
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderSettingsPage() {
  return `
    <section class="page settings-page">
      <div class="settings-header-sticky">
        <button class="settings-back-btn" data-action="go-back" data-fallback="/you" type="button" aria-label="Back to You" title="Back">
          <i class="fa-solid fa-arrow-left"></i>
        </button>
        <div>
          <h1 class="settings-page-title">Settings</h1>
          <p class="settings-page-sub">Personalize playback, appearance, and local storage</p>
        </div>
      </div>
      <div class="settings-card-group">
        ${renderSettingsSections()}
      </div>
    </section>
  `;
}
