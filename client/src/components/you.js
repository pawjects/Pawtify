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
          <strong>No playlists yet</strong>
          <span>Create custom playlists to organize your library.</span>
        </div>
        <button class="btn btn-primary you-action-btn" data-action="open-create-playlist" type="button">
          <i class="fa-solid fa-plus"></i> Create Playlist
        </button>
      </div>
    `;

  return `
    <section class="page you-page">
      <!-- Profile Header Area -->
      <div class="you-profile-card">
        <div class="you-profile-main">
          <div class="you-avatar-wrap">
            <img src="${LOGO_URL}" alt="Pawtify" class="you-avatar-img" />
          </div>
          <div class="you-profile-details">
            <div class="you-title-row" style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
              <h1 class="you-name">${escapeHTML(state.userName || 'Pawtify')}</h1>
              <button class="icon-btn small you-edit-name-btn" data-action="edit-user-name" type="button" aria-label="Edit display name" title="Edit name" style="width:28px; height:28px; border-radius:50%; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.1); color:var(--muted);">
                <i class="fa-solid fa-pen" style="font-size:0.75rem;"></i>
              </button>
            </div>
            <p class="you-tagline">${state.userName ? `Welcome back, ${escapeHTML(state.userName)}. Local library &amp; audio player.` : 'Local library &amp; audio player.'}</p>
          </div>
        </div>

        <!-- Metric Counter Strip -->
        <div class="you-stats-grid">
          <button class="you-stat-card" data-route="/library" type="button">
            <span class="you-stat-val">${favoritesCount}</span>
            <span class="you-stat-lbl">Favorites</span>
          </button>
          <button class="you-stat-card" data-route="/library" type="button">
            <span class="you-stat-val">${playlistsCount}</span>
            <span class="you-stat-lbl">Playlists</span>
          </button>
          <button class="you-stat-card" data-route="/playlist/history" type="button">
            <span class="you-stat-val">${historyCount}</span>
            <span class="you-stat-lbl">History</span>
          </button>
          <button class="you-stat-card" data-action="open-queue" type="button">
            <span class="you-stat-val">${queueCount}</span>
            <span class="you-stat-lbl">Queue</span>
          </button>
        </div>
      </div>

      <!-- D3 Chart Section: Taste Distribution -->
      <div class="you-section" id="you-chart-section">
        <div class="you-section-head you-chart-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
          <div>
            <h2 class="you-section-title" id="you-chart-title">
              Taste profile
            </h2>
            <span class="you-section-sub">Artists and genres in your library</span>
          </div>
          <div class="you-chart-toggle-group" id="you-chart-mode-toggles">
            <button class="you-chart-mode-btn active" id="you-chart-toggle-artists" data-mode="artists" type="button">
              Artists
            </button>
            <button class="you-chart-mode-btn" id="you-chart-toggle-genres" data-mode="genres" type="button">
              Genres
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

      <!-- Playlists Section -->
      <div class="you-section">
        <div class="you-section-head" style="display:flex; justify-content:space-between; align-items:center;">
          <h2 class="you-section-title">Playlists</h2>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-soft" data-action="open-create-playlist" type="button" style="font-size:0.8125rem; padding:6px 12px;">
              <i class="fa-solid fa-plus"></i> New
            </button>
            <button class="btn btn-soft" data-route="/library" type="button" style="font-size:0.8125rem; padding:6px 12px;">
              View all
            </button>
          </div>
        </div>

        ${playlistsHTML}

        <!-- Backup & Migration -->
        <div class="you-glass-card you-backup-card" style="margin-top: 16px;">
          <div class="you-backup-content">
            <div class="you-backup-icon">
              <i class="fa-solid fa-database"></i>
            </div>
            <div class="you-backup-text">
              <strong>Library backup</strong>
              <p>Your library is saved locally. Export a JSON backup to keep your music safe or move it to another browser.</p>
            </div>
          </div>
          <div class="you-backup-actions">
            <button class="btn btn-soft you-action-btn" data-action="export-library" type="button">
              <i class="fa-solid fa-file-export"></i> Export
            </button>
            <button class="btn btn-soft you-action-btn" data-action="import-library" type="button">
              <i class="fa-solid fa-file-import"></i> Import
            </button>
          </div>
        </div>
      </div>

      <!-- Settings Section -->
      <div class="you-section">
        <div class="you-section-head">
          <h2 class="you-section-title">Settings</h2>
        </div>

        <div class="you-glass-card you-settings-container">
          <!-- Setting item 0: Profile Display Name -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Display name</div>
              <div class="you-setting-desc">${state.userName ? `Personalized for "<b>${escapeHTML(state.userName)}</b>"` : 'Personalize your greetings and home tab.'}</div>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <button class="btn btn-soft you-setting-btn" data-action="edit-user-name" type="button">
                ${state.userName ? 'Edit' : 'Set name'}
              </button>
              ${state.userName ? `
                <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="reset-user-name" type="button" title="Clear saved name">
                  Reset
                </button>
              ` : ''}
            </div>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 1: Floating Video -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Floating video player</div>
              <div class="you-setting-desc">Show the video feed while music plays.</div>
            </div>
            <button class="btn btn-soft you-setting-btn" data-action="toggle-video" type="button">
              ${state.videoVisible ? 'Hide video' : 'Show video'}
            </button>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 2: Clear History -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Listening history</div>
              <div class="you-setting-desc">${historyCount} track${historyCount === 1 ? '' : 's'} recorded locally.</div>
            </div>
            <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="clear-history" type="button" ${historyCount === 0 ? 'disabled style="opacity:0.5;"' : ''}>
              Clear
            </button>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 3: Clear Search History -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Search history</div>
              <div class="you-setting-desc">Cached queries and recent searches.</div>
            </div>
            <button class="btn btn-soft you-setting-btn" data-action="clear-search-history" type="button">
              Clear
            </button>
          </div>

          <div class="you-setting-divider"></div>

          <!-- Setting item 4: Clear Play Queue -->
          <div class="you-setting-row">
            <div class="you-setting-info">
              <div class="you-setting-label">Play queue</div>
              <div class="you-setting-desc">${queueCount} track${queueCount === 1 ? '' : 's'} queued.</div>
            </div>
            <button class="btn btn-soft you-setting-btn" data-action="clear-queue" type="button" ${queueCount === 0 ? 'disabled style="opacity:0.5;"' : ''}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- About Footer -->
      <div class="you-section">
        <div class="you-about-card">
          <div class="you-about-main">
            <img src="${LOGO_URL}" alt="Pawtify" class="you-about-logo" />
            <div>
              <h3 class="you-about-name">Pawtify <span class="you-version-badge">v1.0.0</span></h3>
              <p class="you-about-sub">Open-source music streaming application</p>
            </div>
          </div>

          <div class="you-links-grid">
            <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener noreferrer" class="you-link-card">
              <i class="fa-brands fa-github you-link-icon"></i>
              <div class="you-link-text">
                <strong>GitHub</strong>
                <span>Source code and releases</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square you-link-ext"></i>
            </a>

            <a href="https://github.com/pawjects/Pawtify/issues" target="_blank" rel="noopener noreferrer" class="you-link-card">
              <i class="fa-solid fa-bug you-link-icon"></i>
              <div class="you-link-text">
                <strong>Issues</strong>
                <span>Report bugs or requests</span>
              </div>
              <i class="fa-solid fa-arrow-up-right-from-square you-link-ext"></i>
            </a>

            <button class="you-link-card you-link-btn" data-action="open-app-info" type="button">
              <i class="fa-solid fa-circle-info you-link-icon"></i>
              <div class="you-link-text">
                <strong>About Pawtify</strong>
                <span>App information</span>
              </div>
              <i class="fa-solid fa-chevron-right you-link-ext"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}
