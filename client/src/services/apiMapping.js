import {
  isValidMusicContent,
  prioritizeMusic,
  mapServerSong,
} from './youtube.js';
import { state } from '../config/config.js';

export async function searchSongs(query, page = 0, limit = 15, signal = null) {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal });
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items
      .filter(isValidMusicContent)
      .sort(prioritizeMusic)
      .slice(0, limit)
      .map(mapServerSong)
      .filter((s) => s && s.id);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return [];
  }
}

export async function searchPlaylists(query, limit = 12, signal = null) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=playlists`,
      { signal }
    );
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x) => {
      let author = 'Various Artists';
      if (typeof x.uploaderName === 'string') author = x.uploaderName;
      else if (Array.isArray(x.uploaderName)) author = x.uploaderName.map(a => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ');
      else if (x.uploaderName && typeof x.uploaderName === 'object') author = x.uploaderName.name || 'Various Artists';
      author = (author || 'Various Artists').trim();
      if (author === 'undefined' || author === 'null' || author.startsWith('[object')) author = 'Various Artists';

      const title = (x.title || 'Unknown Playlist').trim();
      const cleanTitle = (title && title !== 'undefined' && title !== 'null' && !title.startsWith('[object')) ? title : 'Unknown Playlist';

      return {
        id: String(x.id),
        name: cleanTitle,
        uploaderName: author,
        imageUrl:
          x.thumbnail ||
          'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
        type: 'Playlist',
        isSystem: false,
      };
    }).filter(p => p.id);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return [];
  }
}

export async function searchAlbums(query, limit = 12, signal = null) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=albums`,
      { signal }
    );
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x) => {
      let artistName = 'Unknown Artist';
      if (typeof x.uploaderName === 'string') artistName = x.uploaderName;
      else if (Array.isArray(x.uploaderName)) artistName = x.uploaderName.map(a => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ');
      else if (x.uploaderName && typeof x.uploaderName === 'object') artistName = x.uploaderName.name || 'Unknown Artist';
      artistName = (artistName || 'Unknown Artist').trim();
      if (artistName === 'undefined' || artistName === 'null' || artistName.startsWith('[object')) artistName = 'Unknown Artist';

      const title = (x.title || 'Unknown Album').trim();
      const cleanTitle = (title && title !== 'undefined' && title !== 'null' && !title.startsWith('[object')) ? title : 'Unknown Album';

      return {
        id: String(x.id || x.albumId),
        albumId: String(x.albumId || x.id),
        playlistId: x.playlistId || '',
        name: cleanTitle,
        artist: artistName,
        imageUrl: x.thumbnail || '/assets/pawtify.png',
        year: x.year ? String(x.year) : '',
        type: 'Album',
      };
    }).filter(a => a.id);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return [];
  }
}

export async function searchArtists(query, page = 0, limit = 10, signal = null) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=artists`,
      { signal }
    );
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x) => {
      let aName = 'Unknown Artist';
      if (typeof x.uploaderName === 'string') aName = x.uploaderName;
      else if (Array.isArray(x.uploaderName)) aName = x.uploaderName.map(a => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ');
      else if (x.uploaderName && typeof x.uploaderName === 'object') aName = x.uploaderName.name || '';
      else if (x.title) aName = x.title;
      aName = (aName || 'Unknown Artist').trim();
      if (aName === 'undefined' || aName === 'null' || aName.startsWith('[object')) aName = 'Unknown Artist';

      return {
        id: String(x.id),
        name: aName,
        imageUrl: x.thumbnail || '/assets/pawtify.png',
        type: 'Artist',
        bio: '',
      };
    }).filter(a => a.id);
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return [];
  }
}

export async function searchAll(query, signal = null) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=all`,
      { signal }
    );
    const data = await res.json();
    if (!data) return { songs: [], artists: [], playlists: [], albums: [] };

    const songs = (data.songs || [])
      .filter(isValidMusicContent)
      .sort(prioritizeMusic)
      .slice(0, 20)
      .map(mapServerSong)
      .filter((s) => s && s.id);

    const artists = (data.artists || []).slice(0, 10).map((x) => {
      let aName = (x.title || x.uploaderName || 'Unknown Artist').trim();
      if (aName === 'undefined' || aName === 'null' || aName.startsWith('[object')) aName = 'Unknown Artist';
      return {
        id: String(x.id),
        name: aName,
        imageUrl: x.thumbnail || '/assets/pawtify.png',
        type: 'Artist',
      };
    }).filter(a => a.id);

    const playlists = (data.playlists || []).slice(0, 12).map((x) => {
      let author = 'Various Artists';
      if (typeof x.uploaderName === 'string') author = x.uploaderName;
      else if (Array.isArray(x.uploaderName)) author = x.uploaderName.map(a => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ');
      else if (x.uploaderName && typeof x.uploaderName === 'object') author = x.uploaderName.name || 'Various Artists';
      author = (author || 'Various Artists').trim();
      if (author === 'undefined' || author === 'null' || author.startsWith('[object')) author = 'Various Artists';

      const title = (x.title || 'Unknown Playlist').trim();
      const cleanTitle = (title && title !== 'undefined' && title !== 'null' && !title.startsWith('[object')) ? title : 'Unknown Playlist';

      return {
        id: String(x.id),
        name: cleanTitle,
        uploaderName: author,
        imageUrl:
          x.thumbnail ||
          'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
        type: 'Playlist',
      };
    }).filter(p => p.id);

    const albums = (data.albums || []).slice(0, 12).map((x) => {
      let artistName = 'Unknown Artist';
      if (typeof x.uploaderName === 'string') artistName = x.uploaderName;
      else if (Array.isArray(x.uploaderName)) artistName = x.uploaderName.map(a => (typeof a === 'string' ? a : a?.name || '')).filter(Boolean).join(', ');
      else if (x.uploaderName && typeof x.uploaderName === 'object') artistName = x.uploaderName.name || 'Unknown Artist';
      artistName = (artistName || 'Unknown Artist').trim();
      if (artistName === 'undefined' || artistName === 'null' || artistName.startsWith('[object')) artistName = 'Unknown Artist';

      const title = (x.title || 'Unknown Album').trim();
      const cleanTitle = (title && title !== 'undefined' && title !== 'null' && !title.startsWith('[object')) ? title : 'Unknown Album';

      return {
        id: String(x.id || x.albumId),
        albumId: String(x.albumId || x.id),
        playlistId: x.playlistId || '',
        name: cleanTitle,
        artist: artistName,
        imageUrl: x.thumbnail || '/assets/pawtify.png',
        year: x.year ? String(x.year) : '',
        type: 'Album',
      };
    }).filter(a => a.id);

    return { songs, artists, playlists, albums };
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return { songs: [], artists: [], playlists: [], albums: [] };
  }
}

export async function fetchPlaylistDetails(playlistId, signal = null) {
  try {
    const res = await fetch(
      `/api/search?type=playlist_details&q=${encodeURIComponent(playlistId)}`,
      { signal }
    );
    const data = await res.json();
    if (!data) return null;

    const songs = (data.items || []).map(mapServerSong).filter((s) => s && s.id);
    const meta = data.playlist || {};

    let authorName = 'Various Artists';
    if (typeof meta.artist === 'string' && meta.artist.trim()) {
      authorName = meta.artist.trim();
    } else if (meta.artist && typeof meta.artist === 'object' && meta.artist.name && meta.artist.name.trim()) {
      authorName = meta.artist.name.trim();
    } else if (songs.length > 0 && songs[0].artist && songs[0].artist !== 'Unknown Artist') {
      authorName = songs[0].artist;
    }

    let playlistName = meta.name ? String(meta.name).trim() : '';
    if (!playlistName || playlistName === 'undefined' || playlistName === 'null' || playlistName.startsWith('[object')) {
      playlistName = meta.isAlbum ? 'Album' : 'Playlist';
    }

    return {
      playlist: {
        id: playlistId,
        name: playlistName,
        uploaderName: authorName,
        artist: authorName,
        coverUrl: meta.thumbnail || (songs.length ? songs[0].coverUrl : ''),
        songCount: meta.songCount || songs.length,
        isAlbum: !!meta.isAlbum,
      },
      songs,
    };
  } catch (e) {
    if (e.name === 'AbortError') throw e;
    return null;
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

export async function fetchSearchSuggestions(query, signal = null) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=suggestions`,
      { signal }
    );
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    return [];
  }
}
