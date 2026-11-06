import { state } from '../config/config.js';
import {
  escapeHTML,
  isAppInstalled,
} from '../utils/utils.js';

/**
 * Material Design 3 (MD3) You / Personal Profile & Hub Page
 * Features a listener profile card, 3x1 stats grid, and bottom system utilities.
 */
export function renderYouPage() {
  const playlistsCount =
    (state.playlists ? state.playlists.length : 0) +
    (state.savedPlaylists ? state.savedPlaylists.length : 0);
  const favoritesCount = state.favorites ? state.favorites.length : 0;
  const historyCount = state.recentlyPlayed ? state.recentlyPlayed.length : 0;

  // Preserved bottom utility and settings list items
  const utilityItems = `
    ${!isAppInstalled() ? `
    <article class="library-list-item install-pwa-row" data-action="install-pwa" role="button" tabindex="0">
      <div class="library-item-thumb-gradient" style="background: #1a1a1a;">
        <span class="material-symbols-rounded" style="color: #1db954; font-size: 1.3rem;">download</span>
      </div>
      <div class="library-item-info">
        <h3 class="library-item-title">Offline Cache &amp; PWA</h3>
        <p class="library-item-sub">Native app installation and cached resources</p>
      </div>
      <button class="btn btn-soft btn-sm" data-action="install-pwa" type="button">
        Install
      </button>
    </article>
    ` : ''}
    <article class="library-list-item" data-action="open-settings" role="button" tabindex="0">
      <div class="library-item-thumb-gradient" style="background: #1a1a1a;">
        <span class="material-symbols-rounded" style="color: #1db954; font-size: 1.3rem;">tune</span>
      </div>
      <div class="library-item-info">
        <h3 class="library-item-title">Settings &amp; Preferences</h3>
        <p class="library-item-sub">Audio quality, AMOLED pitch-black, and autoplay</p>
      </div>
      <button class="icon-btn small" data-action="open-settings" type="button" aria-label="Open Settings">
        <span class="material-symbols-rounded">chevron_right</span>
      </button>
    </article>
    <article class="library-list-item" data-action="export-library" role="button" tabindex="0">
      <div class="library-item-thumb-gradient" style="background: #1a1a1a;">
        <span class="material-symbols-rounded" style="color: #1db954; font-size: 1.3rem;">upload</span>
      </div>
      <div class="library-item-info">
        <h3 class="library-item-title">Export Library Backup</h3>
        <p class="library-item-sub">Save all playlists and history to JSON file</p>
      </div>
      <button class="btn btn-soft btn-sm" data-action="export-library" type="button">
        Export
      </button>
    </article>
    <article class="library-list-item" data-action="import-library" role="button" tabindex="0">
      <div class="library-item-thumb-gradient" style="background: #1a1a1a;">
        <span class="material-symbols-rounded" style="color: #1db954; font-size: 1.3rem;">download</span>
      </div>
      <div class="library-item-info">
        <h3 class="library-item-title">Import Library Backup</h3>
        <p class="library-item-sub">Restore playlists and history from JSON</p>
      </div>
      <button class="btn btn-soft btn-sm" data-action="import-library" type="button">
        Import
      </button>
    </article>
  `;

  return `
    <section class="page you-page-spotify">
      <!-- Prominent Material Design 3 User Profile Header & About Section -->
      <header class="you-profile-section">
        <div class="you-profile-card">
          <div class="you-profile-top-row">
            <button class="you-avatar-btn" data-action="edit-user-name" type="button" aria-label="Profile Avatar" title="Edit Profile Name">
              <div class="you-avatar-circle">
                <span class="material-symbols-rounded you-avatar-icon">person</span>
                <span class="you-avatar-badge-edit"><span class="material-symbols-rounded">edit</span></span>
              </div>
            </button>
            <div class="you-profile-info">
              <span class="you-profile-kicker">Listener Profile</span>
              <div class="you-profile-name-row" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                <h1 class="you-profile-name">${escapeHTML(state.userName || 'Music Lover')}</h1>
                <span class="you-badge-member">
                  <span class="material-symbols-rounded" style="font-size: 0.95rem; margin-right: 3px;">workspace_premium</span>
                  <span>Pawtify user</span>
                </span>
              </div>
            </div>
            <div class="you-profile-actions">
              <button class="icon-btn" data-action="open-settings" type="button" aria-label="Settings" title="Settings">
                <span class="material-symbols-rounded">settings</span>
              </button>
            </div>
          </div>

          <!-- Stat Cards: Single-Row 3x1 Grid (Liked Songs, Playlists, History) -->
          <div class="you-stats-grid you-stats-grid-3x1">
            <div class="you-stat-card" data-action="navigate" data-path="/playlist/liked" role="button" tabindex="0">
              <span class="you-stat-num">${favoritesCount}</span>
              <span class="you-stat-label">Liked Songs</span>
            </div>
            <div class="you-stat-card" data-action="navigate" data-path="/library" role="button" tabindex="0">
              <span class="you-stat-num">${playlistsCount}</span>
              <span class="you-stat-label">Playlists</span>
            </div>
            <div class="you-stat-card" data-action="navigate" data-path="/playlist/history" role="button" tabindex="0">
              <span class="you-stat-num">${historyCount}</span>
              <span class="you-stat-label">History</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Preserved Utility & Settings List Container Directly Below 3x1 Stats Grid -->
      <div class="library-list-container you-utility-list" style="margin-top: 12px;">
        ${utilityItems}
      </div>

      <!-- Neatly Aligned Compact Credit Text -->
      <footer class="you-footer-credits">
        <span>Made with</span>
        <span class="material-symbols-rounded you-credits-heart">favorite</span>
        <span>for music lovers &bull; <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">Pawtify</a></span>
      </footer>
    </section>
  `;
}

/**
 * Clean, Flat Material Design 3 Settings Section
 * Strict AMOLED Pitch Black locked mode with right-aligned pill switches.
 */
export function renderSettingsSections() {
  const historyCount = state.recentlyPlayed?.length || 0;
  const quality = state.audioQuality || 'high';

  return `
    <div class="settings-flat-container">
      <!-- 1. Playback & Engine -->
      <div class="settings-flat-header">
        <span class="material-symbols-rounded">play_arrow</span> Playback
      </div>
      <div class="settings-flat-group">
        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Continuous Streaming (Autoplay)</div>
            <div class="settings-flat-desc">Play similar songs automatically when queue ends</div>
          </div>
          <button class="md3-switch ${state.autoplay !== false ? 'active' : ''}" data-action="toggle-autoplay" type="button" role="switch" aria-checked="${state.autoplay !== false ? 'true' : 'false'}" aria-label="Toggle Continuous Autoplay">
            <span class="md3-switch-thumb"></span>
          </button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Shuffle Playback</div>
            <div class="settings-flat-desc">Randomize the order of queued tracks</div>
          </div>
          <button class="md3-switch ${state.shuffleMode ? 'active' : ''}" data-action="toggle-shuffle" type="button" role="switch" aria-checked="${state.shuffleMode ? 'true' : 'false'}" aria-label="Toggle Shuffle">
            <span class="md3-switch-thumb"></span>
          </button>
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
        <span class="material-symbols-rounded">palette</span> Appearance &amp; Theming
      </div>
      <div class="settings-flat-group">
        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Theme Mode</div>
            <div class="settings-flat-desc">AMOLED pitch-black (#000000) locked for optimal OLED battery life</div>
          </div>
          <div class="settings-badge-locked">
            <span class="material-symbols-rounded" style="color:var(--green); font-size:1rem; margin-right:4px;">dark_mode</span>
            <span>AMOLED Black</span>
          </div>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Floating Video Window</div>
            <div class="settings-flat-desc">Watch official music video alongside playback</div>
          </div>
          <button class="md3-switch ${state.videoVisible ? 'active' : ''}" data-action="toggle-video" type="button" role="switch" aria-checked="${state.videoVisible ? 'true' : 'false'}" aria-label="Toggle Video Player">
            <span class="md3-switch-thumb"></span>
          </button>
        </div>
      </div>

      <!-- 3. Storage & Offline -->
      <div class="settings-flat-header">
        <span class="material-symbols-rounded">database</span> Storage &amp; Offline
      </div>
      <div class="settings-flat-group">
        ${!isAppInstalled() ? `
        <div class="settings-flat-row install-pwa-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">PWA Progressive App</div>
            <div class="settings-flat-desc">Install to home screen for offline playback</div>
          </div>
          <button class="btn btn-soft btn-sm" data-action="install-pwa" type="button" style="border-radius:9999px;">
            <span class="material-symbols-rounded">download</span> Install
          </button>
        </div>
        ` : ''}

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Clear Cached Data</div>
            <div class="settings-flat-desc">Flush temporary image/audio cache (preserves playlists)</div>
          </div>
          <button class="btn btn-soft btn-sm" data-action="clear-cache" type="button" style="border-radius:9999px; color:var(--danger);">
            <span class="material-symbols-rounded">delete</span> Clear
          </button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Export / Import Library</div>
            <div class="settings-flat-desc">Export JSON backup or restore saved playlists</div>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-soft btn-sm" data-action="export-library" type="button" style="border-radius:9999px;">
              <span class="material-symbols-rounded">upload</span> Export
            </button>
            <button class="btn btn-soft btn-sm" data-action="import-library" type="button" style="border-radius:9999px;">
              <span class="material-symbols-rounded">download</span> Import
            </button>
          </div>
        </div>
      </div>

      <!-- 4. Privacy & About -->
      <div class="settings-flat-header">
        <span class="material-symbols-rounded">security</span> Privacy &amp; About
      </div>
      <div class="settings-flat-group">
        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Listening History</div>
            <div class="settings-flat-desc">${historyCount} tracks recorded locally</div>
          </div>
          <button class="btn btn-soft btn-sm" data-action="clear-history" type="button" style="border-radius:9999px; color:var(--danger);" ${historyCount === 0 ? 'disabled' : ''}>
            <span class="material-symbols-rounded">history</span> Wipe
          </button>
        </div>

        <div class="settings-flat-row">
          <div class="settings-flat-info">
            <div class="settings-flat-label">Pawtify Web Player</div>
            <div class="settings-flat-desc">v1.0.0 &bull; 100% Client-Side &bull; Zero Telemetry</div>
          </div>
          <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener noreferrer" class="btn btn-soft btn-sm" style="border-radius:9999px;">
            <span class="material-symbols-rounded">code</span> GitHub
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
          <span class="material-symbols-rounded">arrow_back</span>
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
