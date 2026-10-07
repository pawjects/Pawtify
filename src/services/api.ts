import { Song } from '../types';

export function mapServerSong(item: any): Song {
  const durationSec = Number(item.duration) || 0;
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  const durationString = item.durationString || `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const artistName =
    typeof item.uploaderName === 'string'
      ? item.uploaderName
      : Array.isArray(item.uploaderName)
      ? item.uploaderName.map((a: any) => a.name || a).join(', ')
      : item.uploaderName?.name || item.artist || 'Unknown Artist';

  const id = item.id || item.videoId;

  return {
    id: id,
    title: item.title || item.name || 'Unknown Track',
    artist: artistName,
    coverUrl:
      item.thumbnail ||
      (item.thumbnails && item.thumbnails.length > 0
        ? item.thumbnails[item.thumbnails.length - 1].url
        : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`),
    duration: durationString,
    durationSec: durationSec,
  };
}

export function isValidMusicContent(item: any): boolean {
  if (!item || (!item.id && !item.videoId)) return false;
  return true;
}

export async function searchSongs(query: string, limit = 15): Promise<Song[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) {
      console.warn(`searchSongs failed with status: ${res.status}`);
      return [];
    }
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items
      .filter(isValidMusicContent)
      .slice(0, limit)
      .map(mapServerSong)
      .filter((s: Song) => s && s.id);
  } catch (err) {
    console.error('searchSongs error:', err);
    return [];
  }
}

export async function searchPlaylists(query: string, limit = 10) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=playlists`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x: any) => ({
      id: x.id,
      name: x.title || x.name || 'Unknown Playlist',
      uploaderName:
        typeof x.uploaderName === 'string'
          ? x.uploaderName
          : Array.isArray(x.uploaderName)
          ? x.uploaderName.map((a: any) => a.name || a).join(', ')
          : x.uploaderName?.name || '',
      imageUrl:
        x.thumbnail ||
        'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
      type: 'Playlist',
    }));
  } catch (err) {
    console.error('searchPlaylists error:', err);
    return [];
  }
}

export async function searchArtists(query: string, limit = 10) {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=artists`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.slice(0, limit).map((x: any) => ({
      id: x.id,
      name:
        (typeof x.uploaderName === 'string'
          ? x.uploaderName
          : Array.isArray(x.uploaderName)
          ? x.uploaderName.map((a: any) => a.name || a).join(', ')
          : x.uploaderName?.name) ||
        x.title ||
        x.name ||
        'Unknown Artist',
      imageUrl: x.thumbnail || '/assets/pawtify.png',
      type: 'Artist',
    }));
  } catch (err) {
    console.error('searchArtists error:', err);
    return [];
  }
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(query)}&type=suggestions`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function fetchPlaylistVideos(playlistId: string): Promise<Song[]> {
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(playlistId)}&type=playlist_videos`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !data.items) return [];
    return data.items.map(mapServerSong).filter((s: Song) => s && s.id);
  } catch (err) {
    console.error('fetchPlaylistVideos error:', err);
    return [];
  }
}

export async function fetchSongById(songId: string): Promise<Song | null> {
  if (!songId) return null;
  try {
    const res = await fetch(
      `/api/search?q=${encodeURIComponent(songId)}&type=song`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.item) {
        return mapServerSong(data.item);
      }
      if (data.items && data.items.length > 0) {
        return mapServerSong(data.items[0]);
      }
    }
  } catch (err) {
    console.error('fetchSongById error:', err);
  }
  return {
    id: songId,
    title: 'Shared Song',
    artist: 'YouTube Music',
    coverUrl: `https://i.ytimg.com/vi/${songId}/hqdefault.jpg`,
    duration: '0:00',
    durationSec: 0,
  };
}

export async function getSongRecommendations(
  currentSong: Song,
  limit = 10
): Promise<Song[]> {
  if (!currentSong) return [];
  const query = `${currentSong.artist} ${currentSong.title}`;
  return await searchSongs(query, limit);
}
