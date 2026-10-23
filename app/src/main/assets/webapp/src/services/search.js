import { state, globals } from '../config/config.js';
import { searchAll } from './apiMapping.js';
import { rememberSongs } from '../core/details.js';
import { updateSearchPageUI } from '../components/components.js';

const searchCache = new Map();
const CACHE_MAX_SIZE = 50;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let activeAbortController = null;

export async function runSearch(query) {
  const q = (query || '').trim();
  if (!q) {
    state.searchLoading = false;
    state.searchResults = { songs: [], artists: [], playlists: [], albums: [] };
    if (state.route.name === 'search') updateSearchPageUI();
    return;
  }

  const cacheKey = q.toLowerCase();
  const cached = searchCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    state.searchResults = cached.data;
    state.searchLoading = false;
    rememberSongs(cached.data.songs || []);
    if (state.route.name === 'search') updateSearchPageUI();
    return;
  }

  // Cancel prior in-flight request
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }

  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;
  const token = ++globals.searchRequestToken;

  state.searchLoading = true;
  if (state.route.name === 'search') {
    updateSearchPageUI();
  }

  try {
    const results = await searchAll(q, signal);
    if (token !== globals.searchRequestToken) return;

    state.searchResults = {
      songs: results.songs || [],
      artists: results.artists || [],
      playlists: results.playlists || [],
      albums: results.albums || [],
    };
    state.searchLoading = false;
    rememberSongs(results.songs || []);

    // Cache the successful result
    if (searchCache.size >= CACHE_MAX_SIZE) {
      const firstKey = searchCache.keys().next().value;
      searchCache.delete(firstKey);
    }
    searchCache.set(cacheKey, { data: state.searchResults, timestamp: now });

    if (state.route.name === 'search') updateSearchPageUI();
  } catch (error) {
    if (error.name === 'AbortError') return;
    if (token !== globals.searchRequestToken) return;
    state.searchLoading = false;
    if (state.route.name === 'search') updateSearchPageUI();
  } finally {
    if (token === globals.searchRequestToken) {
      activeAbortController = null;
    }
  }
}

