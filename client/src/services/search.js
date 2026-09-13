import { state, globals } from '../config/config.js';
import { searchSongs, searchArtists, searchPlaylists } from './apiMapping.js';
import { rememberSongs } from '../core/details.js';
import { renderCurrentRoute } from '../components/master.js';

export async function runSearch(query) {
  const q = (query || '').trim();
  if (!q) return;
  const token = ++globals.searchRequestToken;

  try {
    const [songs, artists, playlists] = await Promise.all([
      searchSongs(q, 0, 15),
      searchArtists(q, 0, 10),
      searchPlaylists(q, 10),
    ]);
    if (token !== globals.searchRequestToken) return;

    state.searchResults = { songs, artists, playlists };
    state.searchLoading = false;
    rememberSongs(songs);

    if (state.route.name === 'search') renderCurrentRoute();
  } catch (error) {
    if (token !== globals.searchRequestToken) return;
    state.searchLoading = false;
    if (state.route.name === 'search') renderCurrentRoute();
  }
}
