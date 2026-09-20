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

  if (state.modal.type === 'welcome') {
    overlayRoot.innerHTML = `
       <section class="overlay welcome-overlay" data-action="dismiss-overlay">
         <article class="modal welcome-modal">
           <div class="welcome-header">
             <div class="welcome-icon">
               <i class="fa-solid fa-music"></i>
             </div>
             <button class="icon-btn small welcome-close-btn" data-action="close-modal" type="button" aria-label="Close">
               <i class="fa-solid fa-xmark"></i>
             </button>
           </div>
           <div class="welcome-content">
             <h2 class="welcome-title">Welcome to Pawtify</h2>
             <p class="welcome-desc">Stream millions of songs, curate your library, and enjoy distraction-free listening.</p>
             <button class="btn btn-primary welcome-action" data-action="close-modal" type="button">
               Start Listening
             </button>
           </div>
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
