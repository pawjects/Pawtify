import { DISCOVERY_CATEGORIES, state, STORAGE } from '../config/config.js';
import { getSongById, dedupeSongs, rememberSongs } from '../core/details.js';
import { renderCurrentRoute } from '../components/master.js';
import {
  isValidMusicContent,
  prioritizeMusic,
  mapServerSong,
} from './youtube.js';
import { saveJSON } from '../utils/utils.js';
import { getSongRecommendations } from './apiMapping.js';

export function getDiscoveryCategories() {
  const categories = [...DISCOVERY_CATEGORIES];
  const custom = [];

  const topArtists = new Set();
  const topSearches = state.recentSearches || [];
  if (state.recentlyPlayed && state.recentlyPlayed.length) {
    const historySongs = state.recentlyPlayed.map(getSongById).filter(Boolean);
    historySongs.forEach((s) => topArtists.add(s.artist));
  }
  if (state.favorites && state.favorites.length) {
    state.favorites.forEach((s) => topArtists.add(s.artist));
  }
  const artistsList = Array.from(topArtists);
  if (artistsList.length > 0) {
    const randomArtist =
      artistsList[Math.floor(Math.random() * artistsList.length)];
    custom.push({
      title: `Because you listened to ${randomArtist}`,
      query: `${randomArtist} official release`,
    });
  }
  if (artistsList.length > 1) {
    let randomArtist2 =
      artistsList[Math.floor(Math.random() * artistsList.length)];
    while (
      randomArtist2 ===
        custom[0].title.replace('Because you listened to ', '') &&
      artistsList.length > 1
    ) {
      randomArtist2 =
        artistsList[Math.floor(Math.random() * artistsList.length)];
    }
    custom.push({
      title: `More like ${randomArtist2}`,
      query: `${randomArtist2} playlist`,
    });
  }
  if (topSearches.length > 0) {
    const randomSearch =
      topSearches[Math.floor(Math.random() * topSearches.length)];
    custom.push({
      title: `Inspired by "${randomSearch}"`,
      query: `${randomSearch} music`,
    });
  }

  // Shuffle custom and base categories separately
  const selectedCustom = custom.sort(() => 0.5 - Math.random()).slice(0, 2);
  const selectedBase = categories
    .sort(() => 0.5 - Math.random())
    .slice(0, 6 - selectedCustom.length);
  return [...selectedCustom, ...selectedBase].sort(() => 0.5 - Math.random());
}

export async function loadTrendingSongs(forceRefresh = false) {
  try {
    if (state.isLoading === false) state.isLoading = true;
    if (forceRefresh) {
      renderCurrentRoute(); // show loader
    }

    const parseSafe = (res) => {
      if (!res || !res.items) return [];
      return res.items
        .filter(isValidMusicContent)
        .sort(prioritizeMusic)
        .map(mapServerSong)
        .filter((s) => s && s.id);
    };

    const selectedCategories = getDiscoveryCategories();

    const results = await Promise.allSettled(
      selectedCategories.map((cat) =>
        fetch(`/api/search?q=${encodeURIComponent(cat.query)}`)
      )
    );

    const feed = await Promise.all(
      results.map(async (res, idx) => {
        try {
          if (res.status === 'fulfilled') {
            const data = await res.value.json();
            const songs = parseSafe(data);
            return {
              title: selectedCategories[idx].title,
              id: `feed-${idx}`,
              songs: dedupeSongs(songs),
            };
          }
        } catch (e) {
          console.warn('Failed to parse feed category JSON', e);
        }
        return {
          title: selectedCategories[idx].title,
          id: `feed-${idx}`,
          songs: [],
        };
      })
    );

    state.feedCategories = feed.filter((cat) => cat.songs.length > 0);

    const all = dedupeSongs(state.feedCategories.flatMap((c) => c.songs));
    rememberSongs(all);
    // update pool for loadRecommendations
    state.trendingSongs = all; // fallback for loadRecommendations
    if (!state.currentSong && all.length && !state.queue.length) {
      state.queue = dedupeSongs(all);
      saveJSON(STORAGE.QUEUE, state.queue);
    }
  } catch (error) {
    console.error('Error loading feed:', error);
  } finally {
    state.isLoading = false;
    renderCurrentRoute();
  }
}

export async function loadRecommendations() {
  if (!state.currentSong?.id) {
    state.recommendedSongs = [];
    return;
  }
  try {
    state.recommendedSongs = await getSongRecommendations(
      state.currentSong.id,
      12
    );
    rememberSongs(state.recommendedSongs);
  } catch (error) {
    state.recommendedSongs = [];
  }
}

export async function fetchSongById(songId) {
  if (!songId) return null;
  const cached = getSongById(songId);
  if (cached) return cached;

  try {
    const res = await fetch(
      `/api/search?type=song&q=${encodeURIComponent(songId)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.item) {
        const song = mapServerSong(data.item);
        if (song) {
          rememberSongs([song]);
          return song;
        }
      }
    }
  } catch (e) {
    console.warn('Server song lookup error:', e);
  }

  // Fallback: YouTube oEmbed
  try {
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(songId)}&format=json`
    );
    if (oembedRes.ok) {
      const oembed = await oembedRes.json();
      const song = {
        id: songId,
        title: oembed.title || 'YouTube Music Track',
        artist: oembed.author_name || 'YouTube Music',
        album: 'Single',
        coverUrl:
          oembed.thumbnail_url ||
          `https://i.ytimg.com/vi/${songId}/hqdefault.jpg`,
        audioUrl: songId,
        durationSec: 0,
        duration: '',
        releaseDate: '',
        genre: 'Music',
      };
      rememberSongs([song]);
      return song;
    }
  } catch (e) {
    console.warn('oEmbed fallback error:', e);
  }

  // Default fallback object for a valid songId
  const fallback = {
    id: songId,
    title: 'Track ' + songId,
    artist: 'Pawtify Stream',
    album: 'Single',
    coverUrl: `https://i.ytimg.com/vi/${songId}/hqdefault.jpg`,
    audioUrl: songId,
    durationSec: 0,
    duration: '',
    releaseDate: '',
    genre: 'Music',
  };
  rememberSongs([fallback]);
  return fallback;
}
