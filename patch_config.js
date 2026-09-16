const fs = require('fs');
const file = 'client/src/config/config.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "import { loadJSON, saveJSON } from '../utils/utils.js';",
  "import { loadJSON, saveJSON } from '../utils/utils.js';\nimport { idbGet } from '../utils/idb.js';"
);

const newInitApp = `export async function initApp() {
  try {
    // Restore from IndexedDB
    const idbPlaylists = await idbGet(STORAGE.PLAYLISTS);
    if (idbPlaylists) state.playlists = normalizePlaylists(idbPlaylists);

    const idbFavorites = await idbGet(STORAGE.FAVORITES);
    if (idbFavorites) state.favorites = dedupeSongs(idbFavorites);

    const idbQueue = await idbGet(STORAGE.QUEUE);
    if (idbQueue) state.queue = dedupeSongs(idbQueue);

    const idbRecent = await idbGet(STORAGE.RECENT_PLAYED);
    if (idbRecent) state.recentlyPlayed = idbRecent;

    const idbSong = await idbGet(STORAGE.CURRENT_SONG);
    if (idbSong !== undefined) state.currentSong = idbSong;
    
    const idbTime = await idbGet(STORAGE.CURRENT_TIME);
    if (idbTime !== undefined) state.progress = Number(idbTime) || 0;

    seedCatalog();
    restoreCurrentSongIndex();
    loadYTApi();

    if (state.currentSong) updateMediaSession(state.currentSong);

    bindGlobalEvents();

    if (!window.location.hash) {
      window.location.hash = '#/';
    }

    const firstVisit = loadJSON('pawtify-welcome-seen', false);
    if (!firstVisit) {
      state.modal = { type: 'welcome' };
      saveJSON('pawtify-welcome-seen', true);
    }

    renderCurrentRoute();

    loadTrendingSongs().then(() => {
      if (state.currentSong) {
        loadRecommendations();
      }
    });
  } catch (e) {
    console.error('Critical initialization error:', e);
    if (appMain) {
      appMain.innerHTML = \`<div class="empty-state"><h2>App Error</h2><p>Something went wrong loading Pawtify. Please refresh the page.</p></div>\`;
    }
  }
}`;

content = content.replace(/export function initApp\(\) \{[\s\S]*\}\s*$/, newInitApp);

fs.writeFileSync(file, content);
