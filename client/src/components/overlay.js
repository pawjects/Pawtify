import { state, LOGO_URL } from '../config/config.js';
import { overlayRoot } from '../config/dom.js';
import { escapeHTML } from '../utils/utils.js';
import { getSongById } from '../core/details.js';

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
    overlayRoot.innerHTML = `
       <section class="overlay" data-action="dismiss-overlay">
         <article class="modal">
           <header class="modal-head">
             <h2 class="modal-title">Song Details</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body">
             <div style="display:flex; gap:16px; align-items:center;">
               <img src="${escapeHTML(song.coverUrl)}" style="width:80px; height:80px; border-radius:var(--radius-sm); object-fit:cover;" alt="" />
               <div>
                 <h3 style="font-size:1.25rem; font-weight:700;">${escapeHTML(song.title)}</h3>
                 <p style="color:var(--muted); margin-top:4px;">${escapeHTML(song.artist)}</p>
               </div>
             </div>
             <div class="meta-list">
               <p class="meta-item"><b>Quality:</b> HQ Audio Stream</p>
               <p class="meta-item"><b>Duration:</b> ${escapeHTML(song.duration || '0:00')}</p>
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
               <i class="fa-solid fa-xmark"></i>
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
               <i class="fa-solid fa-xmark"></i>
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

  if (state.modal.type === 'welcome' || state.modal.type === 'editName') {
    const isEdit = state.modal.type === 'editName';
    overlayRoot.innerHTML = `
       <section class="overlay welcome-overlay" data-action="dismiss-overlay">
         <article class="modal welcome-modal personalized-welcome-card" style="max-width: 400px; padding: 28px 24px; border-radius: var(--radius-xl); background: var(--liquid-surface); backdrop-filter: var(--liquid-blur); border: 1px solid var(--liquid-border); box-shadow: var(--liquid-shadow);">
           <div class="welcome-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
             <div class="welcome-icon" style="width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, rgba(29, 185, 84, 0.2) 0%, rgba(29, 185, 84, 0.05) 100%); display: flex; align-items: center; justify-content: center; color: var(--green); font-size: 1.25rem;">
               <i class="fa-solid fa-sparkles"></i>
             </div>
             <button class="icon-btn small welcome-close-btn" data-action="close-modal" type="button" aria-label="Close" style="width: 32px; height: 32px; border-radius: 50%;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </div>
           <form id="save-name-form" class="welcome-content" style="display: flex; flex-direction: column; gap: 16px;">
             <div>
               <h2 class="welcome-title" style="font-size: 1.35rem; font-weight: 700; margin-bottom: 8px; color: var(--text);">What can I call you?</h2>
               <p class="welcome-desc" style="font-size: 0.875rem; color: var(--muted); line-height: 1.5; margin: 0;">
                 Personalize your listening experience. Stored private and local to your device.
               </p>
             </div>
             <div class="welcome-input-group" style="margin-top: 4px;">
               <input 
                 type="text" 
                 id="welcome-user-name" 
                 name="userName" 
                 class="text-input" 
                 placeholder="Your name or nickname" 
                 value="${escapeHTML(state.userName || '')}" 
                 maxlength="28" 
                 autocomplete="name" 
                 required
                 autofocus
                 style="width: 100%; padding: 12px 16px; font-size: 1rem; border-radius: var(--radius-md); background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.15); color: var(--text); outline: none;" 
               />
             </div>
             <div class="welcome-actions-row" style="display: flex; gap: 10px; margin-top: 8px;">
               <button class="btn btn-primary welcome-action" type="submit" style="flex: 1; padding: 12px 20px; font-size: 0.95rem; font-weight: 600;">
                 ${isEdit ? 'Save Name' : 'Continue'}
               </button>
               ${isEdit && state.userName ? `
                 <button class="btn btn-soft" data-action="reset-user-name" type="button" style="padding: 12px 16px; font-size: 0.875rem; color: var(--danger, #f43f5e);" title="Clear saved name">
                   Reset
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
             <h2 class="modal-title"><i class="fa-solid fa-paw" style="margin-right:8px; color:var(--green);"></i>About Pawtify</h2>
             <button class="icon-btn" data-action="close-modal" type="button" aria-label="Close" style="width:32px; height:32px; border-radius:999px;">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </header>
           <div class="modal-body">
             <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
               <img src="${LOGO_URL}" style="width:64px; height:64px; border-radius:var(--radius-md); object-fit:cover; box-shadow:0 8px 24px rgba(0,0,0,0.4);" alt="Pawtify" />
               <div>
                 <h3 style="font-size:1.1rem; font-weight:700; font-family:var(--font-display);">Pawtify</h3>
                 <p style="color:var(--muted); font-size:0.8125rem; margin-top:4px;">A Spotify-style music experience, powered by YouTube Engine.</p>
               </div>
             </div>
             <div class="meta-list">
               <p class="meta-item"><i class="fa-brands fa-github" style="margin-right:8px; color:var(--green);"></i><b>GitHub:</b> <a href="https://github.com/pawjects/Pawtify" target="_blank" rel="noopener" style="color:var(--green); text-decoration:underline;">github.com/pawjects/Pawtify</a></p>
               <p class="meta-item"><i class="fa-solid fa-code" style="margin-right:8px; color:var(--green);"></i><b>Developer:</b> Pawjects ORG</p>
               <p class="meta-item"><i class="fa-solid fa-heart" style="margin-right:8px; color:var(--danger);"></i><b>Made with love</b> for music lovers everywhere.</p>
             </div>
           </div>
         </article>
       </section>
     `;
  }
}
