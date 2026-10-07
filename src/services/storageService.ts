import { Song, Playlist, RecentSearchItem } from '@/types/music';

export const STORAGE_KEYS = {
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
  WELCOME_SEEN: 'pawtify-welcome-seen',
} as const;

export function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
  // Also asynchronously persist to IndexedDB
  idbSet(key, value).catch(() => {});
}

// IndexedDB Helper Functions
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open('PawtifyDB', 1);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readonly');
      const store = tx.objectStore('store');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore error
  }
}

export function dedupeSongs(songs: Song[]): Song[] {
  if (!Array.isArray(songs)) return [];
  const seenId = new Set<string>();
  const seenKey = new Set<string>();
  return songs.filter((song) => {
    if (!song || !song.id || seenId.has(song.id)) return false;
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

export function normalizePlaylists(playlists: Playlist[] | unknown): Playlist[] {
  if (!Array.isArray(playlists) || playlists.length === 0) {
    return [{ id: 'default', name: 'My Playlist', songs: [] }];
  }
  return playlists
    .map((playlist, index) => {
      const p = playlist as Partial<Playlist>;
      return {
        id: String(p.id || `playlist-${index}`),
        name: String(p.name || `Playlist ${index + 1}`),
        songs: dedupeSongs(Array.isArray(p.songs) ? p.songs : []),
        coverUrl: p.coverUrl,
        isSystem: p.isSystem,
      };
    })
    .filter((playlist) => playlist.name.trim().length > 0);
}

export function normalizeRecentSearches(items: RecentSearchItem[] | unknown): RecentSearchItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => {
      const e = entry as Partial<RecentSearchItem>;
      if (e.type) return e as RecentSearchItem;
      return {
        type: 'query' as const,
        query: String(e.query || '').trim(),
        timestamp: Number(e.timestamp) || Date.now(),
      };
    })
    .filter((entry) => (entry.type === 'query' ? Boolean(entry.query && entry.query.length > 0) : Boolean(entry.id)))
    .slice(0, 15);
}
