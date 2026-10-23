import { state } from '../config/config.js';
import { lyricsPanel } from '../config/dom.js';
import { escapeHTML } from '../utils/utils.js';

export function renderLyricsPanel() {
  if (!lyricsPanel) return;
  if (!state.lyricsPanel) {
    lyricsPanel.classList.remove('active');
    lyricsPanel.innerHTML = '';
    return;
  }
  lyricsPanel.classList.add('active');
  const song = state.currentSong;
  lyricsPanel.innerHTML = `
     <div class="lyrics-header">
       <h2><i class="fa-solid fa-microphone" style="margin-right:8px; color:var(--green);"></i>Lyrics</h2>
       <div class="lyrics-header-actions">
         <button class="queue-close-btn" data-action="close-lyrics" type="button" aria-label="Close">
           <i class="fa-solid fa-xmark"></i>
         </button>
       </div>
     </div>
     <div class="lyrics-body">
       <div class="empty-state" style="padding: 40px 20px; text-align: center;">
         <i class="fa-solid fa-microphone" style="font-size: 2.5rem; margin-bottom: 16px; color: var(--green);"></i>
         <h2 style="font-size: 1.4rem; margin-bottom: 8px;">${song ? escapeHTML(song.title) : 'Lyrics'}</h2>
         <p style="color: var(--muted); margin-bottom: 16px;">${song ? escapeHTML(song.artist || song.uploaderName || '') : ''}</p>
         <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 320px; margin: 0 auto; line-height: 1.5;">Live synchronized lyrics are currently not available for this stream.</p>
       </div>
     </div>
   `;
}
