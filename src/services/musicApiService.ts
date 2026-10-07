import { Song, Playlist, Artist, DiscoveryCategory, FeedCategory } from '@/types/music';
import { ApiSongItem, ApiPlaylistItem, ApiArtistItem } from '@/types/api';
import { dedupeSongs } from './storageService';

export const DISCOVERY_CATEGORIES: DiscoveryCategory[] = [
  { title: 'Late Night Indie', query: 'Indian indie late night vibes The Local Train official' },
  { title: 'Acoustic Love', query: 'Anuv Jain acoustic romantic indie songs official' },
  { title: 'Soothing Hindi', query: 'Prateek Kuhad soothing Hindi mellow official' },
  { title: 'Melancholic Moods', query: 'Indian indie sad melancholic songs official' },
  { title: 'Dreamy Pop', query: 'Mitraz dreamy lo-fi pop aesthetic official' },
  { title: 'Lo-Fi Chill', query: 'Hindi lo-fi chill romantic aesthetic vibes official' },
  { title: 'Aesthetic Indie', query: 'Indian aesthetic indie pop love songs official' },
  { title: 'Late Night Drives', query: 'Hindi indie late night drive soothing official' },
  { title: 'Midnight Acoustic', query: 'Acoustic indie Hindi midnight calm official' },
  { title: 'Indie Rock Vibes', query: 'The Local Train Indian indie rock official' },
];

export function isValidMusicContent(item: ApiSongItem): boolean {
  if (!item || !item.id) return false;
  if (item.resultType !== 'song') return false;
  const title = (item.title || '').toLowerCase();
  if (
    title.includes('karaoke') ||
    title.includes('tribute version') ||
    title.includes('instrumental version')
  ) {
    return false;
  }
  return true;
}

export function prioritizeMusic(a: ApiSongItem, b: ApiSongItem): number {
  const aLong = (a.duration || 0) > 2700;
  const bLong = (b.duration || 0) > 2700;
  if (!aLong && bLong) return -1;
  if (aLong && !bLong) return 1;
  return 0;
}

export function mapServerSong(item: ApiSongItem): Song {
  return {
    id: item.id,
    title: item.title || 'Unknown Song',
    artist: item.uploaderName || 'Unknown Artist',
    album: 'Single',
    coverUrl: item.thumbnail || `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`,
    audioUrl: item.id,
    durationSec: item.duration || 0,
    duration: item.durationString || '0:00',
    releaseDate: '',
    genre: 'Streaming',
  };
}

export async function searchSongs(query: string, page = 0, limit = 15): Promise<Song[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) return [];
    const items = data.items as ApiSongItem[];
    return items
      .filter(isValidMusicContent)
      .sort(prioritizeMusic)
      .slice(0, limit)
      .map(mapServerSong)
      .filter((s) => Boolean(s && s.id));
  } catch (err) {
    console.error('searchSongs error:', err);
    return [];
  }
}

export async function searchPlaylists(query: string, limit = 10): Promise<Playlist[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=playlists`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) return [];
    const items = data.items as ApiPlaylistItem[];
    return items.slice(0, limit).map((x) => ({
      id: x.id,
      name: x.title || 'Unknown Playlist',
      uploaderName: x.uploaderName || 'Various Artists',
      coverUrl: x.thumbnail || 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=300&h=300',
      songs: [],
      isSystem: false,
    }));
  } catch {
    return [];
  }
}

export async function searchArtists(query: string, page = 0, limit = 10): Promise<Artist[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=artists`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) return [];
    const items = data.items as ApiArtistItem[];
    return items.slice(0, limit).map((x) => ({
      id: x.id,
      name: x.title || 'Unknown Artist',
      imageUrl: x.thumbnail || '/assets/pawtify.png',
      type: 'Artist',
      bio: '',
    }));
  } catch {
    return [];
  }
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=suggestions`);
    const data = await res.json();
    return Array.isArray(data.items) ? data.items.map(String) : [];
  } catch {
    return [];
  }
}

export async function fetchPlaylistVideos(playlistId: string): Promise<Song[]> {
  try {
    const res = await fetch(`/api/search?type=playlist_videos&q=${encodeURIComponent(playlistId)}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) return [];
    const items = data.items as ApiSongItem[];
    return items.map(mapServerSong);
  } catch {
    return [];
  }
}

export async function fetchSongById(songId: string): Promise<Song | null> {
  if (!songId) return null;
  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(songId)}&type=song`);
    const data = await res.json();
    if (data.item) {
      return mapServerSong(data.item as ApiSongItem);
    }
    if (data.items && data.items.length > 0) {
      return mapServerSong(data.items[0] as ApiSongItem);
    }
    return null;
  } catch {
    return null;
  }
}

export async function getSongRecommendations(song: Song, limit = 12): Promise<Song[]> {
  if (!song) return [];
  const query = `${song.artist} ${song.title}`;
  return searchSongs(query, 0, limit);
}

export async function getNextSong(
  currentSong: Song | null,
  trendingSongs: Song[],
  recentlyPlayed: string[]
): Promise<Song | null> {
  if (!currentSong) {
    if (trendingSongs.length > 0) {
      return trendingSongs[Math.floor(Math.random() * trendingSongs.length)];
    }
    return null;
  }
  const suggestions = await getSongRecommendations(currentSong, 14);
  const next = suggestions.find((s) => !recentlyPlayed.includes(s.id));
  return next || suggestions[0] || null;
}

export function buildDiscoveryCategories(
  recentArtists: string[],
  recentSearches: string[]
): DiscoveryCategory[] {
  const custom: DiscoveryCategory[] = [];
  if (recentArtists.length > 0) {
    const randomArtist = recentArtists[Math.floor(Math.random() * recentArtists.length)];
    custom.push({
      title: `Because you listened to ${randomArtist}`,
      query: `${randomArtist} official release`,
    });
  }
  if (recentArtists.length > 1) {
    let randomArtist2 = recentArtists[Math.floor(Math.random() * recentArtists.length)];
    if (custom[0] && randomArtist2 === custom[0].title.replace('Because you listened to ', '')) {
      const alt = recentArtists.find((a) => a !== randomArtist2);
      if (alt) randomArtist2 = alt;
    }
    custom.push({
      title: `More like ${randomArtist2}`,
      query: `${randomArtist2} playlist`,
    });
  }
  if (recentSearches.length > 0) {
    const randomSearch = recentSearches[Math.floor(Math.random() * recentSearches.length)];
    custom.push({
      title: `Inspired by "${randomSearch}"`,
      query: `${randomSearch} music`,
    });
  }

  const selectedCustom = custom.sort(() => 0.5 - Math.random()).slice(0, 2);
  const selectedBase = [...DISCOVERY_CATEGORIES]
    .sort(() => 0.5 - Math.random())
    .slice(0, 6 - selectedCustom.length);

  return [...selectedCustom, ...selectedBase].sort(() => 0.5 - Math.random());
}

export async function fetchFeedCategories(
  recentArtists: string[],
  recentSearches: string[]
): Promise<FeedCategory[]> {
  const categories = buildDiscoveryCategories(recentArtists, recentSearches);
  const results = await Promise.allSettled(
    categories.map((cat) => fetch(`/api/search?q=${encodeURIComponent(cat.query)}`))
  );

  const feed: FeedCategory[] = [];
  for (let idx = 0; idx < results.length; idx++) {
    const res = results[idx];
    if (res.status === 'fulfilled') {
      try {
        const data = await res.value.json();
        if (data && Array.isArray(data.items)) {
          const items = data.items as ApiSongItem[];
          const songs = items
            .filter(isValidMusicContent)
            .sort(prioritizeMusic)
            .map(mapServerSong)
            .filter((s) => Boolean(s && s.id));
          if (songs.length > 0) {
            feed.push({
              title: categories[idx].title,
              id: `feed-${idx}`,
              songs: dedupeSongs(songs),
            });
          }
        }
      } catch (err) {
        console.warn('Feed category parse error:', err);
      }
    }
  }

  return feed;
}
