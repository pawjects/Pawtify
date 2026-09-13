import {
  isValidMusicContent,
  prioritizeMusic,
  mapServerSong,
} from './youtube.js';
import { state } from '../config/config.js';

export async function searchSongs(query, page = 0, limit = 10) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items
      .filter(isValidMusicContent)
      .sort(prioritizeMusic)
      .slice(0, limit)
      .map(mapServerSong)
      .filter((s) => s && s.id);
  } catch (e) {
    return [];
  }
}

export async function searchPlaylists(query, limit = 10) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=playlists`
    );
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x) => ({
      id: x.id,
      name: x.title || 'Unknown Playlist',
      uploaderName: typeof x.uploaderName === 'string' ? x.uploaderName : (Array.isArray(x.uploaderName) ? x.uploaderName.map(a => a.name || a).join(', ') : (x.uploaderName?.name || '')),
      imageUrl:
        x.thumbnail ||
        'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
      type: 'Playlist',
      isSystem: false,
    }));
  } catch (e) {
    return [];
  }
}

export async function searchArtists(query, page = 0, limit = 10) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=artists`
    );
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x) => ({
      id: x.id,
      name: (typeof x.uploaderName === 'string' ? x.uploaderName : (Array.isArray(x.uploaderName) ? x.uploaderName.map(a => a.name || a).join(', ') : x.uploaderName?.name)) || x.title || 'Unknown Artist',
      imageUrl:
        x.thumbnail ||
        '/assets/icon-512.png',
      type: 'Artist',
      bio: '',
    }));
  } catch (e) {
    return [];
  }
}

export async function getSongRecommendations(id, limit = 10) {
  if (!state.currentSong) return [];
  const query = state.currentSong.artist + ' ' + state.currentSong.title;
  return await searchSongs(query, 0, limit);
}

export async function getNextSong(currentSongId) {
  if (!currentSongId) {
    const pool = state.trendingSongs.length
      ? state.trendingSongs
      : state.indieBandsSongs.length
        ? state.indieBandsSongs
        : state.acousticSongs;
    if (!pool.length) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const suggestions = await getSongRecommendations(currentSongId, 14);
  const next = suggestions.find(
    (song) => !state.recentlyPlayed.includes(song.id)
  );
  return next || suggestions[0] || null;
}
