import { Song, Playlist, SearchItem, FeedCategory } from '../types';
import { idbSet } from './idb';

export const DEFAULT_COVER =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='300' height='300' fill='%23141a16'/%3E%3Ccircle cx='150' cy='150' r='60' fill='%231db954' opacity='0.18'/%3E%3Cpath d='M130 110v80l60-40z' fill='%231db954'/%3E%3C/svg%3E";

export const LOGO_URL = '/assets/pawtify.png';

export const STORAGE = {
  THEME: 'pawtify-theme',
  REPEAT: 'pawtify-repeat',
  SHUFFLE: 'pawtify-shuffle',
  FAVORITES: 'pawtify-favorites',
  PLAYLISTS: 'pawtify-playlists',
  QUEUE: 'pawtify-queue',
  CURRENT_SONG: 'pawtify-current-song',
  CURRENT_TIME: 'pawtify-current-time',
  VOLUME: 'pawtify-volume',
  RECENT_SEARCHES: 'pawtify-recent-searches',
  SEARCH_QUERY: 'pawtify-search-query',
  RECENT_PLAYED: 'pawtify-recently-played',
  USER_NAME: 'pawtify-user-name',
};

export const DISCOVERY_CATEGORIES = [
  { title: 'Late Night Indie', query: 'Indian indie late night vibes The Local Train official' },
  { title: 'Acoustic Love', query: 'Anuv Jain acoustic romantic indie songs official' },
  { title: 'Soothing Hindi', query: 'Prateek Kuhad soothing Hindi mellow official' },
  { title: 'Global Classics', query: 'Coldplay greatest hits official' },
  { title: 'Dreamy Pop', query: 'Mitraz dreamy lo-fi pop aesthetic official' },
  { title: 'Lo-Fi Chill', query: 'Hindi lo-fi chill romantic aesthetic vibes official' },
  { title: 'Aesthetic Indie', query: 'Indian aesthetic indie pop love songs official' },
  { title: 'Late Night Drives', query: 'Hindi indie late night drive soothing official' },
];

export const INITIAL_FEED_CATEGORIES: FeedCategory[] = [
  {
    id: 'cat-0',
    title: 'Late Night Indie',
    songs: [
      {
        id: 'opwZ_PJ-F_E',
        title: 'Choo Lo',
        artist: 'The Local Train',
        coverUrl: 'https://i.ytimg.com/vi/opwZ_PJ-F_E/hqdefault.jpg',
        duration: '3:54',
        durationSec: 234,
      },
      {
        id: '79Yc9gN3TPM',
        title: 'Aaoge Tum Kabhi',
        artist: 'The Local Train',
        coverUrl: 'https://i.ytimg.com/vi/79Yc9gN3TPM/hqdefault.jpg',
        duration: '5:14',
        durationSec: 314,
      },
      {
        id: 'GHTg-EzUr4M',
        title: 'Aaftaab',
        artist: 'The Local Train',
        coverUrl: 'https://i.ytimg.com/vi/GHTg-EzUr4M/hqdefault.jpg',
        duration: '3:54',
        durationSec: 234,
      },
      {
        id: 'Ereptv8qhhA',
        title: 'Khudi',
        artist: 'The Local Train',
        coverUrl: 'https://i.ytimg.com/vi/Ereptv8qhhA/hqdefault.jpg',
        duration: '4:58',
        durationSec: 298,
      },
    ],
  },
  {
    id: 'cat-1',
    title: 'Acoustic Love',
    songs: [
      {
        id: 'dZ0fwJojhrs',
        title: 'Baarishein',
        artist: 'Anuv Jain',
        coverUrl: 'https://i.ytimg.com/vi/dZ0fwJojhrs/hqdefault.jpg',
        duration: '3:27',
        durationSec: 207,
      },
      {
        id: 'vA8OxdaZ4v4',
        title: 'Alag Aasmaan',
        artist: 'Anuv Jain',
        coverUrl: 'https://i.ytimg.com/vi/vA8OxdaZ4v4/hqdefault.jpg',
        duration: '3:32',
        durationSec: 212,
      },
      {
        id: 'PJWemSzEkXs',
        title: 'Gul',
        artist: 'Anuv Jain',
        coverUrl: 'https://i.ytimg.com/vi/PJWemSzEkXs/hqdefault.jpg',
        duration: '3:37',
        durationSec: 217,
      },
      {
        id: 'gvyUuxdRdR4',
        title: 'Husn',
        artist: 'Anuv Jain',
        coverUrl: 'https://i.ytimg.com/vi/gvyUuxdRdR4/hqdefault.jpg',
        duration: '3:38',
        durationSec: 218,
      },
    ],
  },
  {
    id: 'cat-2',
    title: 'Soothing Hindi',
    songs: [
      {
        id: '6FewJvQDTmA',
        title: 'Co2',
        artist: 'Prateek Kuhad',
        coverUrl: 'https://i.ytimg.com/vi/6FewJvQDTmA/hqdefault.jpg',
        duration: '2:41',
        durationSec: 161,
      },
      {
        id: 'Tpe_6qD7y84',
        title: 'Kasoor',
        artist: 'Prateek Kuhad',
        coverUrl: 'https://i.ytimg.com/vi/Tpe_6qD7y84/hqdefault.jpg',
        duration: '3:16',
        durationSec: 196,
      },
      {
        id: 'Il7nvrmrCpI',
        title: 'cold/mess',
        artist: 'Prateek Kuhad',
        coverUrl: 'https://i.ytimg.com/vi/Il7nvrmrCpI/hqdefault.jpg',
        duration: '4:43',
        durationSec: 283,
      },
    ],
  },
  {
    id: 'cat-3',
    title: 'Global Classics',
    songs: [
      {
        id: 'ALsvdSA9tOU',
        title: 'Viva La Vida',
        artist: 'Coldplay',
        coverUrl: 'https://i.ytimg.com/vi/ALsvdSA9tOU/hqdefault.jpg',
        duration: '4:03',
        durationSec: 243,
      },
      {
        id: '9qnqYL0eNNI',
        title: 'Yellow',
        artist: 'Coldplay',
        coverUrl: 'https://i.ytimg.com/vi/9qnqYL0eNNI/hqdefault.jpg',
        duration: '4:27',
        durationSec: 267,
      },
      {
        id: 'KWuyx6yZ21U',
        title: 'A Sky Full of Stars',
        artist: 'Coldplay',
        coverUrl: 'https://i.ytimg.com/vi/KWuyx6yZ21U/hqdefault.jpg',
        duration: '4:14',
        durationSec: 254,
      },
      {
        id: '5NV6Rdv1a3w',
        title: 'Get Lucky',
        artist: 'Daft Punk',
        coverUrl: 'https://i.ytimg.com/vi/5NV6Rdv1a3w/hqdefault.jpg',
        duration: '4:08',
        durationSec: 248,
      },
    ],
  },
];

export function formatTime(value: number | string | undefined): string {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const remain = seconds % 60;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: any): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
  idbSet(key, value).catch(() => {});
}

export function dedupeSongs(songs: Song[]): Song[] {
  if (!Array.isArray(songs)) return [];
  const seenId = new Set<string>();
  const seenKey = new Set<string>();
  return songs.filter((song) => {
    if (!song?.id || seenId.has(song.id)) return false;
    seenId.add(song.id);
    const cleanTitle = (song.title || '')
      .toLowerCase()
      .replace(/\s*\(.*?\)\s*/g, '')
      .replace(/\s*\[.*?\]\s*/g, '')
      .replace(/\|.*$/g, '')
      .trim();
    const cleanArtist = (song.artist || '').toLowerCase().trim();
    const key = `${cleanTitle}|${cleanArtist}`;
    if (cleanTitle.length > 2 && seenKey.has(key)) return false;
    seenKey.add(key);
    return true;
  });
}

export function normalizePlaylists(playlists: any): Playlist[] {
  if (!Array.isArray(playlists) || playlists.length === 0) {
    return [{ id: 'default', name: 'My Playlist', songs: [] }];
  }
  return playlists
    .map((playlist: any, index: number) => ({
      id: String(playlist.id || `playlist-${index}`),
      name: String(playlist.name || `Playlist ${index + 1}`),
      songs: dedupeSongs(Array.isArray(playlist.songs) ? playlist.songs : []),
    }))
    .filter((playlist: Playlist) => playlist.name.trim().length > 0);
}

export function normalizeRecentSearches(items: any): SearchItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry: any) => {
      if (entry.type) return entry as SearchItem;
      return {
        type: 'query' as const,
        query: String(entry?.query || '').trim(),
        timestamp: Number(entry?.timestamp) || Date.now(),
      };
    })
    .filter((entry: SearchItem) =>
      entry.type === 'query' ? (entry.query || '').length > 0 : !!entry.id
    )
    .slice(0, 15);
}

export function isValidSongId(id: any): boolean {
  if (!id || typeof id !== 'string') return false;
  return /^[a-zA-Z0-9_-]{6,32}$/.test(id.trim());
}
