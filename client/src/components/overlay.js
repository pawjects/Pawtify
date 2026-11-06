import { state, LOGO_URL } from '../config/config.js';
import { overlayRoot } from '../config/dom.js';
import { escapeHTML, formatTime, getOptimizedArtwork } from '../utils/utils.js';
import { getSongById } from '../core/details.js';
import { getExactAudioQuality } from '../services/youtube.js';

export function renderOverlay() {
  if (!overlayRoot) return;
  if (!state.modal) {
    overlayRoot.innerHTML = '';
    return;
  }

  if (state.modal.type === 'songDetails') {
    const song = state.currentSong;
    if (!song) {
      overlayRoot.innerHTML = '';
      return;
    }
    const audioQuality = getExactAudioQuality() || '256kbps AAC (Opus)';
    const uploadDate = song.uploadedAt || song.uploadDate || song.publishedText || 'Official Release';
    const videoId = song.id || 'N/A';
    const duration = song.duration || (state.duration ? formatTime(state.duration) : '0:00');

    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal modal-source-details">
           <header class="modal-head">
             <div style="display:flex; align-items:center; gap:8px;">
               <span class="material-symbols-rounded" style="color:var(--green, #1db954); font-size:1.3rem;">tune</span>
               <h2 class="modal-title">Track Details & Source</h2>
             </div>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <span class="material-symbols-rounded">close</span>
             </button>
           </header>
           <div class="modal-body" style="display:flex; flex-direction:column; gap:16px;">
             <div class="source-track-banner" style="display:flex; gap:14px; align-items:center; background:rgba(255,255,255,0.04); padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,0.06);">
               <img src="${escapeHTML(getOptimizedArtwork(song.coverUrl, 160))}" style="width:64px; height:64px; border-radius:8px; object-fit:cover; flex-shrink:0;" alt="" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
               <div style="min-width:0; flex:1;">
                 <h3 style="font-size:1.05rem; font-weight:700; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:0 0 4px;">${escapeHTML(song.title)}</h3>
                 <p style="color:var(--muted); font-size:0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin:0;">${escapeHTML(song.artist || song.uploaderName || 'Unknown')}</p>
               </div>
             </div>

             <div class="source-metadata-table" style="background:#121212; border-radius:12px; padding:12px 14px; border:1px solid rgba(255,255,255,0.08); display:flex; flex-direction:column; gap:10px;">
               <div class="source-meta-row" style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                 <span style="color:var(--muted);">Track Name</span>
                 <span style="color:#fff; font-weight:600; text-align:right; max-width:65%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(song.title)}</span>
               </div>
               <div class="source-meta-row" style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                 <span style="color:var(--muted);">Artist / Channel</span>
                 <span style="color:#fff; font-weight:600; text-align:right; max-width:65%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${escapeHTML(song.artist || song.uploaderName || 'Unknown')}</span>
               </div>
               <div class="source-meta-row" style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                 <span style="color:var(--muted);">Duration</span>
                 <span style="color:#fff; font-weight:600;">${escapeHTML(duration)}</span>
               </div>
               <div class="source-meta-row" style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                 <span style="color:var(--muted);">Upload Date</span>
                 <span style="color:#fff; font-weight:600;">${escapeHTML(uploadDate)}</span>
               </div>
               <div class="source-meta-row" style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                 <span style="color:var(--muted);">Video ID</span>
                 <div style="display:flex; align-items:center; gap:6px;">
                   <span class="mono" style="color:var(--green, #1db954); font-family:monospace; font-weight:600;">${escapeHTML(videoId)}</span>
                   <button class="source-copy-btn" data-action="copy-video-id" data-id="${escapeHTML(videoId)}" type="button" aria-label="Copy Video ID" title="Copy ID" style="background:none; border:none; color:var(--muted); cursor:pointer; padding:2px; display:inline-flex; align-items:center;">
                     <span class="material-symbols-rounded" style="font-size:1rem;">content_copy</span>
                   </button>
                 </div>
               </div>
               <div class="source-meta-row" style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                 <span style="color:var(--muted);">Audio Quality</span>
                 <span style="color:var(--green, #1db954); font-weight:600;">${escapeHTML(audioQuality)}</span>
               </div>
               <div class="source-meta-row" style="display:flex; justify-content:space-between; align-items:center; font-size:0.875rem;">
                 <span style="color:var(--muted);">Stream Source</span>
                 <span style="color:#fff; font-weight:500;">YouTube Music Direct</span>
               </div>
             </div>

             <div style="display:flex; gap:10px; margin-top:4px;">
               <button class="btn btn-primary" data-action="download-song" type="button" style="flex:1;">
                 <span class="material-symbols-rounded">download</span> Download
               </button>
               <button class="btn btn-soft" data-action="share-song" type="button" style="flex:1;">
                 <span class="material-symbols-rounded">share</span> Share
               </button>
             </div>
           </div>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'playlistPicker') {
    const song = getSongById(state.modal.songId);
    if (!song) {
      overlayRoot.innerHTML = '';
      return;
    }
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Add to Playlist</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <span class="material-symbols-rounded">close</span>
             </button>
           </header>
           <div class="modal-body">
             <p style="color:var(--muted); font-size:0.875rem;">${escapeHTML(song.title)} \u2022 ${escapeHTML(song.artist)}</p>
             <div style="display:flex; flex-direction:column; gap:8px;">
               ${state.playlists
                 .map((playlist) => {
                   const exists = playlist.songs.some(
                     (item) => item.id === song.id
                   );
                   return `
                   <button class="btn btn-soft" style="justify-content:space-between;" data-action="playlist-toggle-song" data-song-id="${escapeHTML(song.id)}" data-playlist-id="${escapeHTML(playlist.id)}" type="button">
                     <span>${escapeHTML(playlist.name)}</span>
                     <span style="color:var(--muted); font-size:0.8125rem;">${exists ? 'Remove' : 'Add'}</span>
                   </button>
                 `;
                 })
                 .join('')}
             </div>
             <button class="btn btn-primary" data-action="open-create-playlist" type="button">Create New Playlist</button>
           </div>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'createPlaylist') {
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Create Playlist</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <span class="material-symbols-rounded">close</span>
             </button>
           </header>
           <form id="create-playlist-form" class="modal-body">
             <div class="form-row">
               <label class="form-label" for="playlist-name">Playlist Name</label>
               <input class="text-input" id="playlist-name" name="playlistName" required placeholder="My Awesome Playlist" maxlength="40" />
             </div>
             <button class="btn btn-primary" type="submit">Create Playlist</button>
           </form>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'confirm') {
    const { title, message, confirmText, isDanger, onConfirmAction } = state.modal;
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal" style="max-width: 420px; padding: 20px;">
           <header class="modal-head" style="margin-bottom: 12px;">
             <h2 class="modal-title" style="font-size: 1.15rem; font-weight: 700;">${escapeHTML(title || 'Confirm')}</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <span class="material-symbols-rounded">close</span>
             </button>
           </header>
           <div class="modal-body" style="display:flex; flex-direction:column; gap:16px; padding:0;">
             <p style="color:var(--muted); font-size:0.875rem; line-height:1.5; margin:0;">
               ${escapeHTML(message || 'Are you sure you want to proceed?')}
             </p>
             <div style="display:flex; gap:10px; justify-content:flex-end; margin-top:8px;">
               <button class="btn btn-soft" data-action="close-modal" type="button" style="padding:7px 16px; font-size:0.875rem;">
                 Cancel
               </button>
               <button class="btn ${isDanger ? 'btn-danger you-btn-danger' : 'btn-primary'}" data-action="${escapeHTML(onConfirmAction)}" type="button" style="padding:7px 18px; font-size:0.875rem;">
                 ${escapeHTML(confirmText || 'Confirm')}
               </button>
             </div>
           </div>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'welcome' || state.modal.type === 'editName') {
    const isEdit = state.modal.type === 'editName';
    overlayRoot.innerHTML = `
       <section class="overlay welcome-overlay" data-action="dismiss-overlay">
         <article class="modal welcome-modal personalized-welcome-card" style="max-width: 440px;">
           <header class="modal-head" style="align-items: flex-start; padding-bottom: 12px; border-bottom: 1px solid var(--border-subtle);">
             <div style="display: flex; align-items: center; gap: 14px;">
               <img src="/assets/pawtify.png" alt="Pawtify" draggable="false" style="width: 44px; height: 44px; border-radius: 10px; object-fit: cover; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.4);" />
               <div>
                 <h2 class="modal-title" style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text);">${isEdit ? 'Edit Display Name' : 'Welcome to Pawtify'}</h2>
                 <span style="font-size: 0.8125rem; color: var(--green); font-weight: 600; display: inline-flex; align-items: center; gap: 5px; margin-top: 2px;">
                   <span class="material-symbols-rounded" style="font-size: 0.75rem;">auto_awesome</span> Ad-Free &bull; Privacy-First &bull; AMOLED
                 </span>
               </div>
             </div>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <span class="material-symbols-rounded">close</span>
             </button>
           </header>
           <form id="save-name-form" class="modal-body" style="display: flex; flex-direction: column; gap: 16px; padding-top: 14px;">
             ${!isEdit ? `
               <div style="background: var(--surface-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px 16px; display: flex; flex-direction: column; gap: 6px;">
                 <p style="font-size: 0.875rem; font-weight: 600; color: var(--text); margin: 0;">
                   Your distraction-free music streaming companion.
                 </p>
                 <p style="font-size: 0.8125rem; color: var(--text-sub); line-height: 1.5; margin: 0;">
                   Stream millions of tracks with high-fidelity audio, build custom playlists, and manage your playback queue—all without tracking, accounts, or telemetry.
                 </p>
               </div>
             ` : ''}
             <div>
               <label class="form-label" for="welcome-user-name" style="font-size: 0.9375rem; font-weight: 600; margin-bottom: 4px; display: block; color: var(--text);">
                 What should we call you?
               </label>
               <p style="font-size: 0.8125rem; color: var(--muted); margin: 0; line-height: 1.4;">
                 Used to personalize your home feed greetings and playlists. Stored exclusively on your device.
               </p>
             </div>
             <div>
               <input 
                 type="text" 
                 id="welcome-user-name" 
                 name="userName" 
                 class="text-input" 
                 placeholder="e.g. Alex" 
                 value="${escapeHTML(state.userName || '')}" 
                 maxlength="28" 
                 autocomplete="name" 
                 required
                 autofocus
                 style="width: 100%;" 
               />
             </div>
             <div style="display: flex; gap: 10px; margin-top: 4px;">
               <button class="btn btn-primary" type="submit" style="flex: 1;">
                 ${isEdit ? 'Save Changes' : 'Start Listening'}
               </button>
               ${isEdit && state.userName ? `
                 <button class="btn btn-soft" data-action="reset-user-name" type="button" style="color: var(--danger, #f43f5e);" title="Clear saved name">
                   Reset
                 </button>
               ` : !isEdit ? `
                 <button class="btn btn-soft" data-action="close-modal" type="button" style="font-size: 0.875rem;">
                   Skip
                 </button>
               ` : ''}
             </div>
           </form>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'appInfo') {
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title"><span class="material-symbols-rounded" style="margin-right:8px; color:var(--green);">pets</span>About Pawtify</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <span class="material-symbols-rounded">close</span>
             </button>
           </header>
           <div class="modal-body">
             <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
               <img src="${LOGO_URL}" style="width:64px; height:64px; border-radius:var(--radius-md); object-fit:cover; box-shadow:0 8px 24px rgba(0,0,0,0.4);" alt="Pawtify" draggable="false" />
               <div>
                 <h3 style="font-size:1.1rem; font-weight:700; font-family:var(--font-display);">Pawtify</h3>
                 <p style="color:var(--muted); font-size:0.8125rem; margin-top:4px;">A Spotify-style music experience, powered by YouTube Engine.</p>
               </div>
             </div>
             <div class="meta-list">
               <p class="meta-item"><span class="material-symbols-rounded" style="margin-right:8px; color:var(--green);">code</span><b>GitHub:</b> <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener" style="color:var(--green); text-decoration:underline;">github.com/pawjects/Pawtify</a></p>
               <p class="meta-item"><span class="material-symbols-rounded" style="margin-right:8px; color:var(--green);">code</span><b>Developer:</b> Pawjects ORG</p>
               <p class="meta-item"><span class="material-symbols-rounded" style="margin-right:8px; color:var(--danger);">favorite</span><b>Made with love</b> for music lovers everywhere.</p>
             </div>
           </div>
         </article>
       </section>
     `;
    return;
  }

  if (state.modal.type === 'settings') {
    const currentTab = state.modal.tab || 'all';
    const isStandalone =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(display-mode: standalone)').matches;
    const canInstall = typeof window !== 'undefined' && !!window.deferredPrompt;
    const historyCount = state.recentlyPlayed ? state.recentlyPlayed.length : 0;
    const queueCount = state.queue ? state.queue.length : 0;

    overlayRoot.innerHTML = `
      <section class="overlay" data-action="dismiss-overlay">
        <article class="modal you-settings-modal" style="max-width: 580px; width: 100%; max-height: 88vh; display: flex; flex-direction: column; overflow: hidden; padding: 0;">
          <header class="modal-head" style="padding: 16px 20px; border-bottom: 1px solid var(--md-sys-color-outline-variant); flex-shrink: 0;">
            <div style="display:flex; align-items:center; gap:10px;">
              <div style="width:34px; height:34px; border-radius:var(--md-shape-sm); background:var(--md-sys-color-primary-container); display:grid; place-items:center; color:var(--green);"><span class="material-symbols-rounded">settings</span></div>
              <div>
                <h2 class="modal-title" style="font-size:1.15rem; margin:0;">Settings</h2>
                <span style="font-size:0.75rem; color:var(--muted);">Preferences &bull; Local Storage &bull; Pawtify</span>
              </div>
            </div>
            <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
              <span class="material-symbols-rounded">close</span>
            </button>
          </header>

          <!-- Settings Tab Chips -->
          <div class="you-settings-tabs-strip">
            <button class="you-settings-tab-btn ${currentTab === 'all' ? 'active' : ''}" data-action="set-settings-tab" data-tab="all" type="button">All</button>
            <button class="you-settings-tab-btn ${currentTab === 'appearance' ? 'active' : ''}" data-action="set-settings-tab" data-tab="appearance" type="button"><span class="material-symbols-rounded">palette</span> Appearance</button>
            <button class="you-settings-tab-btn ${currentTab === 'playback' ? 'active' : ''}" data-action="set-settings-tab" data-tab="playback" type="button"><span class="material-symbols-rounded">music_note</span> Playback</button>
            <button class="you-settings-tab-btn ${currentTab === 'app' ? 'active' : ''}" data-action="set-settings-tab" data-tab="app" type="button"><span class="material-symbols-rounded">smartphone</span> App</button>
            <button class="you-settings-tab-btn ${currentTab === 'privacy' ? 'active' : ''}" data-action="set-settings-tab" data-tab="privacy" type="button"><span class="material-symbols-rounded">security</span> Privacy</button>
          </div>

          <div class="modal-body you-settings-scroll-body" style="padding: 16px 20px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 18px;">
            <!-- Category: Appearance -->
            ${
              currentTab === 'all' || currentTab === 'appearance'
                ? `
              <div class="you-settings-group">
                <div class="you-settings-group-title"><span class="material-symbols-rounded">palette</span> Appearance</div>
                <div class="you-settings-box">
                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Theme Mode</div>
                      <div class="you-setting-desc">AMOLED pitch-black (#000000) locked for optimal OLED efficiency & battery life.</div>
                    </div>
                    <div class="settings-badge-locked">
                      <span class="material-symbols-rounded" style="color:var(--green); font-size:1rem; margin-right:4px;">dark_mode</span>
                      <span>AMOLED Black</span>
                    </div>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Floating Video Player</div>
                      <div class="you-setting-desc">Show video feed window while music is streaming.</div>
                    </div>
                    <button class="md3-switch ${state.videoVisible ? 'active' : ''}" data-action="toggle-video" type="button" role="switch" aria-checked="${state.videoVisible ? 'true' : 'false'}" aria-label="Toggle Video Player">
                      <span class="md3-switch-thumb"></span>
                    </button>
                  </div>
                </div>
              </div>
            `
                : ''
            }

            <!-- Category: Playback -->
            ${
              currentTab === 'all' || currentTab === 'playback'
                ? `
              <div class="you-settings-group">
                <div class="you-settings-group-title"><span class="material-symbols-rounded">music_note</span> Playback</div>
                <div class="you-settings-box">
                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Continuous Streaming (Autoplay)</div>
                      <div class="you-setting-desc">Automatically play next queued track when song finishes.</div>
                    </div>
                    <button class="md3-switch ${state.autoplay !== false ? 'active' : ''}" data-action="toggle-autoplay" type="button" role="switch" aria-checked="${state.autoplay !== false ? 'true' : 'false'}" aria-label="Toggle Autoplay">
                      <span class="md3-switch-thumb"></span>
                    </button>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Audio Quality</div>
                      <div class="you-setting-desc">High-bitrate Opus 160kbps stream via native YouTube Engine.</div>
                    </div>
                    <span class="player-quality-badge" id="settings-quality-label" style="font-size:0.75rem; padding:4px 10px;">${escapeHTML(getExactAudioQuality())}</span>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Repeat Mode</div>
                      <div class="you-setting-desc">Current loop setting.</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                      <button class="btn btn-soft you-setting-btn ${state.repeatMode === 'none' ? 'active' : ''}" data-action="set-repeat" data-mode="none" type="button">Off</button>
                      <button class="btn btn-soft you-setting-btn ${state.repeatMode === 'all' ? 'active' : ''}" data-action="set-repeat" data-mode="all" type="button">All</button>
                      <button class="btn btn-soft you-setting-btn ${state.repeatMode === 'one' ? 'active' : ''}" data-action="set-repeat" data-mode="one" type="button">1 Track</button>
                    </div>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Shuffle Mode</div>
                      <div class="you-setting-desc">Randomize track playback order.</div>
                    </div>
                    <button class="md3-switch ${state.shuffleMode ? 'active' : ''}" data-action="toggle-shuffle" type="button" role="switch" aria-checked="${state.shuffleMode ? 'true' : 'false'}" aria-label="Toggle Shuffle">
                      <span class="md3-switch-thumb"></span>
                    </button>
                  </div>
                </div>
              </div>
            `
                : ''
            }

            <!-- Category: App & Installation -->
            ${
              currentTab === 'all' || currentTab === 'app'
                ? `
              <div class="you-settings-group">
                <div class="you-settings-group-title"><span class="material-symbols-rounded">smartphone</span> App &amp; Storage</div>
                <div class="you-settings-box">
                  ${
                    !isStandalone
                      ? `
                    <div class="you-setting-row install-pwa-row">
                      <div class="you-setting-info">
                        <div class="you-setting-label">PWA Installation</div>
                        <div class="you-setting-desc">Install to home screen for an offline fullscreen experience.</div>
                      </div>
                      <button class="btn btn-primary you-setting-btn" data-action="install-pwa" type="button">
                        <span class="material-symbols-rounded">download</span> Install App
                      </button>
                    </div>
                    <div class="you-setting-divider"></div>
                  `
                      : ''
                  }

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Offline Cache &amp; Storage</div>
                      <div class="you-setting-desc">IndexedDB stores your local playlists, history, and search index.</div>
                    </div>
                    <button class="btn btn-soft you-setting-btn" data-action="clear-cache" type="button">
                      <span class="material-symbols-rounded">cleaning_services</span> Clear Cache
                    </button>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">About Pawtify</div>
                      <div class="you-setting-desc">Version 1.0.0 &bull; Open-source &bull; MIT License &bull; PawDevs</div>
                    </div>
                    <button class="btn btn-soft you-setting-btn" data-action="open-app-info" type="button">
                      <span class="material-symbols-rounded">info</span> Details
                    </button>
                  </div>
                </div>
              </div>
            `
                : ''
            }

            <!-- Category: Privacy & Data -->
            ${
              currentTab === 'all' || currentTab === 'privacy'
                ? `
              <div class="you-settings-group">
                <div class="you-settings-group-title"><span class="material-symbols-rounded">security</span> Privacy &amp; Data</div>
                <div class="you-settings-box">
                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Listening History</div>
                      <div class="you-setting-desc">${historyCount} track${historyCount === 1 ? '' : 's'} recorded locally on this device.</div>
                    </div>
                    <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="clear-history" type="button" ${historyCount === 0 ? 'disabled style="opacity:0.5;"' : ''}>
                      <span class="material-symbols-rounded">delete</span> Clear History
                    </button>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Search History Cache</div>
                      <div class="you-setting-desc">Recently searched queries and cached search items.</div>
                    </div>
                    <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="clear-search-history" type="button">
                      <span class="material-symbols-rounded">delete</span> Clear Search
                    </button>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Play Queue</div>
                      <div class="you-setting-desc">${queueCount} track${queueCount === 1 ? '' : 's'} in queue.</div>
                    </div>
                    <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="clear-queue" type="button" ${queueCount === 0 ? 'disabled style="opacity:0.5;"' : ''}>
                      <span class="material-symbols-rounded">delete</span> Clear Queue
                    </button>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row">
                    <div class="you-setting-info">
                      <div class="you-setting-label">Library Backup (JSON)</div>
                      <div class="you-setting-desc">Export or import playlists and favorites to keep them safe.</div>
                    </div>
                    <div style="display:flex; gap:8px;">
                      <button class="btn btn-soft you-setting-btn" data-action="export-library" type="button">
                        <span class="material-symbols-rounded">upload</span> Export
                      </button>
                      <button class="btn btn-soft you-setting-btn" data-action="import-library" type="button">
                        <span class="material-symbols-rounded">download</span> Import
                      </button>
                    </div>
                  </div>

                  <div class="you-setting-divider"></div>

                  <div class="you-setting-row" style="background:rgba(239, 68, 68, 0.06); padding:10px 12px; border-radius:var(--radius-sm); border:1px solid rgba(239, 68, 68, 0.2);">
                    <div class="you-setting-info">
                      <div class="you-setting-label" style="color:var(--danger);">Reset All Data</div>
                      <div class="you-setting-desc">Permanently wipe all locally stored playlists, favorites, and settings.</div>
                    </div>
                    <button class="btn btn-soft you-setting-btn you-btn-danger" data-action="reset-all-data" type="button">
                      Reset All
                    </button>
                  </div>
                </div>
              </div>
            `
                : ''
            }
          </div>
        </article>
      </section>
    `;
    return;
  }
}
