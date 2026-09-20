import { state, LOGO_URL } from '../config/config.js';
import { escapeHTML } from '../utils/utils.js';
import { renderPlaylistCard } from './components.js';

export function renderYouPage() {
  const playlistsCount = state.playlists ? state.playlists.length : 0;
  const favoritesCount = state.favorites ? state.favorites.length : 0;
  const historyCount = state.recentlyPlayed ? state.recentlyPlayed.length : 0;
  const queueCount = state.queue ? state.queue.length : 0;

  // Render user's custom playlists (up to 4 for clean preview)
  const userPlaylists = (state.playlists || []).slice(0, 4);
  const playlistsHTML = userPlaylists.length
    ? `<div class="card-grid">${userPlaylists.map((p, i) => renderPlaylistCard(p, i)).join('')}</div>`
    : `
      <div class="you-glass-card you-empty-state">
        <i class="fa-solid fa-list-ul you-empty-icon"></i>
        <div class="you-empty-text">
          <strong>No playlists created yet</strong>
          <span>Organize your favorite music into custom playlists stored directly on your device.</span>
        </div>
        <button class="btn btn-primary you-action-btn" data-action="open-create-playlist" type="button">
          <i class="fa-solid fa-plus"></i> Create Playlist
        </button>
      </div>
    `;

  return `
    <section class="page you-page">
      <!-- Profile / Header Area -->
      <div class="you-profile-card">
        <div class="you-profile-main">
          <div class="you-avatar-wrap">
            <img src="${LOGO_URL}" alt="Pawtify" class="you-avatar-img" />
            <span class="you-status-dot" title="Active & Privacy Preserved"></span>
          </div>
          <div class="you-profile-details">
            <div class="you-title-row" style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <h1 class="you-name">${escapeHTML(state.userName || 'Pawtify')}</h1>
              <button class="icon-btn small you-edit-name-btn" data-action="edit-user-name" type="button" aria-label="Edit your name" title="Edit your name" style="width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--muted);">
                <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
              </button>
              <span class="you-badge"><i class="fa-solid fa-shield-halved"></i> Privacy First</span>
            </div>
            <p class="you-tagline">${state.userName ? `Welcome back, ${escapeHTML(state.userName)}. Your personal music hub, offline library & distraction-free streaming sanctuary.` : 'Your personal music hub, offline library & distraction-free streaming sanctuary.'}</p>
            <div class="you-pill-row">
              <span class="you-pill"><i class="fa-solid fa-code-branch"></i> v1.0.0</span>
              <span class="you-pill"><i class="fa-solid fa-ban"></i> Zero Ads</span>
              <span class="you-pill"><i class="fa-solid fa-hard-drive"></i> 100% Local</span>
            </div>
          </div>
        </div>

        <!-- Metric Counter Strip -->
        <div class="you-stats-grid">
          <button class="you-stat-card" data-route="/library" type="button">
            <span class="you-stat-val">${favoritesCount}</span>
            <span class="you-stat-lbl"><i class="fa-solid fa-heart" style="color:var(--green);"></i> Favorites</span>
          </button>
          <button class="you-stat-card" data-route="/library" type="button">
            <span class="you-stat-val">${playlistsCount}</span>
            <span class="you-stat-lbl"><i class="fa-solid fa-list-ul" style="color:var(--green);"></i> Playlists</span>
          </button>
          <button class="you-stat-card" data-route="/playlist/history" type="button">
            <span class="you-stat-val">${historyCount}</span>
            <span class="you-stat-lbl"><i class="fa-solid fa-clock-rotate-left" style="color:var(--green);"></i> Played</span>
          </button>
          <button class="you-stat-card" data-action="open-queue" type="button">
            <span class="you-stat-val">${queueCount}</span>
            <span class="you-stat-lbl"><i class="fa-solid fa-bars-staggered" style="color:var(--green);"></i> In Queue</span>
          </button>
        </div>
      </div>

      <!-- D3 Chart Section: Taste Distribution & Library Insights -->
      <div class="you-section" id="you-chart-section">
        <div class="you-section-head you-chart-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 class="you-section-title" id="you-chart-title">
              <i class="fa-solid fa-chart-pie" style="color:var(--green); margin-right:8px;"></i>Music Taste &amp; Distribution
            </h2>
            <span class="you-section-sub">Interactive D3 visualization of artists and genres in your library</span>
          </div>
          <div class="you-chart-toggle-group" id="you-chart-mode-toggles">
            <button class="you-chart-mode-btn active" id="you-chart-toggle-artists" data-mode="artists" type="button">
              <i class="fa-solid fa-microphone-lines"></i> Artists
            </button>
            <button class="you-chart-mode-btn" id="you-chart-toggle-genres" data-mode="genres" type="button">
              <i class="fa-solid fa-compact-disc"></i> Genres
            </button>
          </div>
        </div>

        <div class="you-glass-card you-chart-card" id="you-chart-card">
          <div class="you-chart-layout" id="you-chart-layout">
            <!-- D3 Visual Stage -->
            <div class="you-chart-visual-stage" id="you-chart-visual-stage">
              <div class="you-chart-svg-container" id="you-chart-container"></div>
            </div>
            <!-- Interactive Legend & Details List -->
            <div class="you-chart-legend-stage" id="you-chart-legend-stage">
              <div class="you-chart-meta-summary" id="you-chart-meta-summary"></div>
              <div class="you-chart-legend-list" id="you-chart-legend-list"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Hub -->
      <div class="you-section">
        <div class="you-section-head">
          <h2 class="you-section-title">
            <i class="fa-solid fa-bolt" style="color:var(--green); margin-right:8px;"></i>Quick Actions
          </h2>
        </div>
        <div class="you-quick-grid">
          <button class="you-quick-card" data-route="/playlist/history" type="button">
            <div class="you-quick-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
            <div class="you-quick-info">
              <strong>Recently Played</strong>
              <span>${historyCount} tracks in history</span>
            </div>
            <i class="fa-solid fa-chevron-right you-quick-arrow"></i>
          </button>

          <button class="you-quick-card" data-route="/library" type="button">
            <div class="you-quick-icon"><i class="fa-solid fa-heart"></i></div>
            <div class="you-quick-info">
              <strong>Liked Songs</strong>
              <span>${favoritesCount} saved songs</span>
            </div>
            <i class="fa-solid fa-chevron-right you-quick-arrow"></i>
          </button>

          <button class="you-quick-card" data-route="/library" type="button">
            <div class="you-quick-icon"><i class="fa-solid fa-book-open"></i></div>
            <div class="you-quick-info">
              <strong>Your Library</strong>
              <span>${playlistsCount} custom playlists</span>
            </div>
            <i class="fa-solid fa-chevron-right you-quick-arrow"></i>
          </button>

          <button class="you-quick-card" data-action="open-queue" type="button">
            <div class="you-quick-icon"><i class="fa-solid fa-bars-staggered"></i></div>
            <div class="you-quick-info">
              <strong>Now Playing Queue</strong>
              <span>${queueCount} tracks queued</span>
            </div>
            <i class="fa-solid fa-chevron-right you-quick-arrow"></i>
          </button>

          <button class="you-quick-card" data-action="download-song" type="button">
            <div class="you-quick-icon"><i class="fa-solid fa-cloud-arrow-down"></i></div>
            <div class="you-quick-info">
              <strong>Offline & PWA</strong>
              <span>Service Worker caching</span>
            </div>
            <i class="fa-solid fa-chevron-right you-quick-arrow"></i>
          </button>

          <button class="you-quick-card" data-action="refresh-feed" type="button">
            <div class="you-quick-icon"><i class="fa-solid fa-arrows-rotate"></i></div>
            <div class="you-quick-info">
              <strong>Refresh Feed</strong>
              <span>Update recommendations</span>
            </div>
            <i class="fa-solid fa-chevron-right you-quick-arrow"></i>
          </button>
        </div>
      </div>

      <!-- Your Library Management -->
      <div class="you-section">
        <div class="you-section-head" style="display:flex; justify-content:space-between; align-items:center;">
          <h2 class="you-section-title">
            <i class="fa-solid fa-bookmark" style="color:var(--green); margin-right:8px;"></i>Your Library
          </h2>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-soft" data-action="open-create-playlist" type="button" style="font-size:0.8125rem; padding:6px 12px;">
              <i class="fa-solid fa-plus"></i> New
            </button>
            <button class="btn btn-soft" data-route="/library" type="button" style="font-size:0.8125rem; padding:6px 12px;">
              View All
            </button>
          </div>
        </div>

        ${playlistsHTML}

        <!-- Backup & Migration Glass Card -->
        <div class="you-glass-card you-backup-card">
          <div class="you-backup-content">
            <div class="you-backup-icon">
              <i class="fa-solid fa-database"></i>
            </div>
            <div class="you-backup-text">
              <strong>Device Storage & Data Backup</strong>
              <p>Your playlists, favorites, and listening preferences are stored 100% locally on this device via IndexedDB. Export a portable JSON backup to keep your music safe or transfer between browsers.</p>
            </div>
          </div>
          <div class="you-backup-actions">
            <button class="btn btn-soft you-action-btn" data-action="export-library" type="button">
              <i class="fa-solid fa-file-export"></i> Export Backup
            </button>
            <button class="btn btn-soft you-action-btn" data-action="import-library" type="button">
              <i class="fa-solid fa-file-import"></i> Import Backup
            </button>
          </div>
        </div>
      </div>

      <!-- Pawtify Wiki Section -->
      <div class="you-section">
        <div class="you-section-head">
          <h2 class="you-section-title">
            <i class="fa-solid fa-paw" style="color:var(--green); margin-right:8px;"></i>Pawtify Wiki
          </h2>
          <span class="you-section-sub">Everything you need to know about Pawtify</span>
        </div>

        <div class="you-wiki-grid">
          <!-- Card 1: What is Pawtify & Mission -->
          <article class="you-wiki-card">
            <div class="you-wiki-head">
              <div class="you-wiki-badge-icon"><i class="fa-solid fa-compass"></i></div>
              <div>
                <h3 class="you-wiki-title">What is Pawtify?</h3>
                <span class="you-wiki-tag">Purpose & Vision</span>
              </div>
            </div>
            <p class="you-wiki-body">
              Pawtify is a browser-based, privacy-first static music streaming player designed to give you an uncluttered, ad-free listening experience. It pairs the world's most extensive music catalog with a lightweight, distraction-free interface free from commercial tracking, algorithms, and mandatory logins.
            </p>
          </article>

          <!-- Card 2: Core Capabilities -->
          <article class="you-wiki-card">
            <div class="you-wiki-head">
              <div class="you-wiki-badge-icon"><i class="fa-solid fa-wand-magic-sparkles"></i></div>
              <div>
                <h3 class="you-wiki-title">Major Features</h3>
                <span class="you-wiki-tag">Capabilities</span>
              </div>
            </div>
            <ul class="you-wiki-list">
              <li><i class="fa-solid fa-check"></i> <b>Zero Ads & Interruptions:</b> Pure music without commercial breaks.</li>
              <li><i class="fa-solid fa-check"></i> <b>Liquid Glass AMOLED UI:</b> Battery-saving true black with real-time blur.</li>
              <li><i class="fa-solid fa-check"></i> <b>Progressive Web App:</b> Installable on Android, iOS, Windows, and Mac.</li>
              <li><i class="fa-solid fa-check"></i> <b>Synchronized Live Lyrics:</b> Auto-scroll with jump-to-line timestamps.</li>
              <li><i class="fa-solid fa-check"></i> <b>Audio Visualizer:</b> Responsive canvas spectrum rendering.</li>
              <li><i class="fa-solid fa-check"></i> <b>Media Session API:</b> Lockscreen controls & keyboard media keys.</li>
            </ul>
          </article>

          <!-- Card 3: Technology Stack -->
          <article class="you-wiki-card">
            <div class="you-wiki-head">
              <div class="you-wiki-badge-icon"><i class="fa-solid fa-microchip"></i></div>
              <div>
                <h3 class="you-wiki-title">Playback Technology</h3>
                <span class="you-wiki-tag">Engineering</span>
              </div>
            </div>
            <p class="you-wiki-body">
              Pawtify utilizes YouTube's IFrame & Audio Engine through an Express API proxy. If an embed is region-blocked, the intelligent <b>Stream Fallback Recovery</b> automatically detects playback errors and resolves alternative playable official audio streams within seconds. State is stored natively with dual LocalStorage and IndexedDB synchronization.
            </p>
          </article>

          <!-- Card 4: Privacy Philosophy -->
          <article class="you-wiki-card">
            <div class="you-wiki-head">
              <div class="you-wiki-badge-icon"><i class="fa-solid fa-user-shield"></i></div>
              <div>
                <h3 class="you-wiki-title">Privacy Philosophy</h3>
                <span class="you-wiki-tag">Data Rights</span>
              </div>
            </div>
            <p class="you-wiki-body">
              <b>No accounts. No cookies. No trackers.</b> Your personal library, favorite songs, search history, and listening habits never leave your browser. Zero user profiling or telemetry scripts are executed, ensuring your listening habits remain entirely yours.
            </p>
          </article>
        </div>
      </div>

      <!-- Settings & Preferences Section -->
      <div class="you-section">
        <div class="you-section-head">
          <h2 class="you-section-title">
            <i class="fa-solid fa-sliders" style="color:var(--green); margin-right:8px;"></i>Settings & Preferences
          </h2>
        </div>

        <div class="you-glass-card you-settings-container">
          <!-- Setting item 0: Profile Display Name -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Your Name</div>
              <div class="you-setting-desc">${state.userName ? `Personalized for "<b>${escapeHTML(state.userName)}</b>". Stored locally on this device.` : 'Set your name to personalize your greetings and recommendations.'}</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="btn btn-soft you-setting-btn" data-action="edit-user-name" type="button">
                <i class="fa-solid fa-pen"></i> ${state.userName ? 'Edit Name' : 'Set Name'}
              </button>
              ${state.userName ? `
                <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="reset-user-name" type="button" title="Clear saved name">
                  <i class="fa-solid fa-rotate-left"></i> Reset
                </button>
              ` : ''}
            </div>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 1: Floating Video -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Floating Video Mode</div>
              <div class="you-setting-desc">Display the accompanying YouTube video window in the corner.</div>
            </div>
            <button class="btn btn-soft you-setting-btn" data-action="toggle-video" type="button">
              <i class="fa-solid fa-tv"></i> Toggle Video
            </button>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 2: Welcome tour -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Pawtify Guide</div>
              <div class="you-setting-desc">Reopen the welcome guide and feature highlights.</div>
            </div>
            <button class="btn btn-soft you-setting-btn" data-action="open-welcome-modal" type="button">
              <i class="fa-solid fa-circle-question"></i> Open Guide
            </button>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 3: Clear History -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Clear Listening History</div>
              <div class="you-setting-desc">Remove all tracks from your recently played list (${historyCount} items).</div>
            </div>
            <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="clear-history" type="button">
              <i class="fa-solid fa-trash"></i> Clear History
            </button>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 4: Clear Search History -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Clear Search History</div>
              <div class="you-setting-desc">Remove recent search keywords and query cache.</div>
            </div>
            <button class="btn btn-soft you-setting-btn" data-action="clear-search-history" type="button">
              <i class="fa-solid fa-eraser"></i> Clear Searches
            </button>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 5: Clear Play Queue -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Clear Play Queue</div>
              <div class="you-setting-desc">Empty the current track lineup (${queueCount} tracks).</div>
            </div>
            <button class="btn btn-soft you-setting-btn" data-action="clear-queue" type="button">
              <i class="fa-solid fa-broom"></i> Clear Queue
            </button>
          </div>
        </div>
      </div>

      <!-- About Pawtify & Support/Links -->
      <div class="you-section">
        <div class="you-section-head">
          <h2 class="you-section-title">
            <i class="fa-solid fa-circle-info" style="color:var(--green); margin-right:8px;"></i>About & Community
          </h2>
        </div>

        <div class="you-about-card">
          <div class="you-about-main">
            <img src="${LOGO_URL}" alt="Pawtify" class="you-about-logo" />
            <div>
              <h3 class="you-about-name">Pawtify <span class="you-version-badge">v1.0.0</span></h3>
              <p class="you-about-sub">Open-Source Distraction-Free Audio Player</p>
              <div class="you-credits-list">
                <span><i class="fa-solid fa-user-ninja" style="color:var(--green);"></i> Developed by <b>Sky &lt;PawDevs&gt;</b></span>
                <span><i class="fa-solid fa-people-group" style="color:var(--green);"></i> Maintained by <b>Pawjects ORG</b></span>
                <span><i class="fa-solid fa-scale-balanced" style="color:var(--green);"></i> Licensed under <b>MIT License</b></span>
              </div>
            </div>
          </div>

          <div class="you-links-grid">
            <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener noreferrer" class="you-link-card">
              <i class="fa-brands fa-github you-link-icon"></i>
              <div class="you-link-text">
                <strong>GitHub Repository</strong>
                <span>Source code, releases & star</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square you-link-ext"></i>
            </a>

            <a href="https://github.com/pawjects/Pawtify/issues" target="_blank" rel="noopener noreferrer" class="you-link-card">
              <i class="fa-solid fa-bug you-link-icon"></i>
              <div class="you-link-text">
                <strong>Feedback & Issues</strong>
                <span>Report bugs or suggest ideas</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square you-link-ext"></i>
            </a>

            <a href="https://github.com/pawjects/Pawtify#readme" target="_blank" rel="noopener noreferrer" class="you-link-card">
              <i class="fa-solid fa-book you-link-icon"></i>
              <div class="you-link-text">
                <strong>Documentation</strong>
                <span>Architecture and deploy guide</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square you-link-ext"></i>
            </a>

            <button class="you-link-card you-link-btn" data-action="open-app-info" type="button">
              <i class="fa-solid fa-circle-info you-link-icon"></i>
              <div class="you-link-text">
                <strong>App Dialog</strong>
                <span>Open about modal card</span>
              </div>
              <i class="fa-solid fa-chevron-right you-link-ext"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}
