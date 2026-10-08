import { state, showToast, STORAGE, songCatalog } from '../config/config.js';
import { renderOverlay } from '../components/overlay.js';
import { togglePlay, play } from '../components/player.js';
import { saveJSON } from '../utils/utils.js';

export async function openSongDetails() {
  if (!state.currentSong) return;
  state.modal = { type: 'songDetails' };
  renderOverlay();
}

export async function shareSpecificSong(songId) {
  const song = getSongById(songId) || (state.currentSong?.id === songId ? state.currentSong : null);
  if (!song) return;
  const shareText = `${song.title} by ${song.artist} on Pawtify`;
  const shareUrl = `${window.location.origin}/#/song/${encodeURIComponent(song.id)}`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: song.title,
        text: shareText,
        url: shareUrl,
      });
      return;
    }
  } catch (error) {
    console.warn('Native share failed:', error);
  }
  try {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    showToast('Song link copied to clipboard.');
  } catch (err) {
    showToast('Failed to copy link.');
  }
}

export async function sharePlaylist(playlistId) {
  let playlist = state.playlists.find((p) => p.id === playlistId);
  if (!playlist && state.ytPlaylists?.[playlistId]) {
    playlist = state.ytPlaylists[playlistId];
  }
  if (playlistId === 'history') {
    playlist = { name: 'Listening History', id: 'history' };
  }
  if (!playlist) return;
  const shareText = `Listen to ${playlist.name} on Pawtify`;
  const shareUrl = `${window.location.origin}/#/playlist/${encodeURIComponent(playlist.id)}`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: playlist.name,
        text: shareText,
        url: shareUrl,
      });
      return;
    }
  } catch (error) {
    console.warn('Native share failed:', error);
  }
  try {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    showToast('Playlist link copied to clipboard.');
  } catch (err) {
    showToast('Failed to copy link.');
  }
}

export async function shareCurrentSong() {
  if (!state.currentSong) return;
  const song = state.currentSong;
  const shareText = `${song.title} by ${song.artist} on Pawtify`;
  const shareUrl = `${window.location.origin}/#/song/${encodeURIComponent(song.id)}`;
  try {
    if (navigator.share) {
      await navigator.share({
        title: song.title,
        text: shareText,
        url: shareUrl,
      });
      return;
    }
  } catch (error) {
    console.warn('Native share failed:', error);
  }
  try {
    await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    showToast('Song link copied to clipboard.');
  } catch (err) {
    showToast('Failed to copy link.');
  }
}

export async function playSongById(songId, source, playlistId) {
  let song = getSongById(songId);
  if (!song && playlistId && state.ytPlaylists?.[playlistId]?.songs) {
    song = state.ytPlaylists[playlistId].songs.find((s) => s.id === songId);
    if (song) rememberSongs([song]);
  }
  if (!song && state.searchResults?.songs) {
    song = state.searchResults.songs.find((s) => s.id === songId);
    if (song) rememberSongs([song]);
  }
  if (!song) return;

  if (source === 'search' && state.searchQuery.trim()) {
    saveRecentItem('track', {
      id: song.id,
      title: song.title,
      subtitle: song.artist,
      imageUrl: song.coverUrl,
    });
  }

  if (state.currentSong?.id === song.id) {
    await togglePlay();
    return;
  }
  const queue = resolveQueueBySource(source, playlistId, song);
  await play(song, queue, true);
}

export function resolveQueueBySource(source, playlistId, fallbackSong) {
  if (source && source.startsWith('feed-')) {
    const cat = state.feedCategories?.find((c) => c.id === source);
    if (cat && cat.songs) return cat.songs;
  }
  if (source === 'search') return state.searchResults.songs?.length ? state.searchResults.songs : [fallbackSong];
  if (source === 'favorites') return state.favorites;
  if (source === 'recommended') return state.recommendedSongs;
  if (source === 'trending') return state.trendingSongs;
  if (source === 'bands') return state.indieBandsSongs;
  if (source === 'acoustic') return state.acousticSongs;
  if (source === 'melodic') return state.melodicIndieSongs;
  if (source === 'lofi' || source === 'english') return state.lofiSongs;
  if (source === 'classical') return state.classicalSongs;
  if (source === 'anuv' || source === 'prateek' || source === 'indie')
    return state.trendingSongs;
  if (source === 'queue') return state.queue;
  if (source === 'recent') {
    let allAddedSongs = [...state.favorites];
    state.playlists.forEach((p) => {
      if (p.songs) allAddedSongs = allAddedSongs.concat(p.songs);
    });
    allAddedSongs = allAddedSongs.filter((s) => s.addedAt);
    allAddedSongs.sort((a, b) => b.addedAt - a.addedAt);
    const uniqueAddedSongs = [];
    const seenIds = new Set();
    allAddedSongs.forEach((s) => {
      if (!seenIds.has(s.id)) {
        seenIds.add(s.id);
        uniqueAddedSongs.push(s);
      }
    });
    return uniqueAddedSongs.slice(0, 50);
  }
  if (source === 'artist')
    return state.artistProfile?.songs?.length
      ? state.artistProfile.songs
      : [fallbackSong];
  if (source === 'playlist' && playlistId) {
    if (playlistId === 'liked' || playlistId === 'favorites') return state.favorites?.length ? state.favorites : [fallbackSong];
    if (playlistId === 'history') {
      const historySongs = (state.recentlyPlayed || []).map((id) => getSongById(id)).filter(Boolean);
      return historySongs.length ? historySongs : [fallbackSong];
    }
    const local = state.playlists.find((playlist) => playlist.id === playlistId);
    if (local?.songs?.length) return local.songs;
    const remote = state.ytPlaylists?.[playlistId];
    if (remote?.songs?.length) return remote.songs;
    return [fallbackSong];
  }
  return state.queue.length ? state.queue : [fallbackSong];
}

export function restoreCurrentSongIndex() {
  if (!state.currentSong) {
    state.currentSongIndex = 0;
    return;
  }
  const found = state.queue.findIndex(
    (song) => song.id === state.currentSong.id
  );
  state.currentSongIndex = found >= 0 ? found : 0;
}

export function persistPlayer() {
  saveJSON(STORAGE.CURRENT_SONG, state.currentSong);
  saveJSON(STORAGE.QUEUE, state.queue);
  saveJSON(STORAGE.CURRENT_TIME, state.progress);
  saveJSON(STORAGE.RECENT_PLAYED, state.recentlyPlayed);
  saveJSON(STORAGE.ACTIVITY, state.listeningActivity);
}

export function recordListeningActivity(song, source = 'stream') {
  if (!song || !song.id) return;
  rememberSongs([song]);
  const now = Date.now();
  state.listeningActivity = Array.isArray(state.listeningActivity)
    ? state.listeningActivity
    : [];

  // Deduplicate if the exact same song was recorded within the last 15 seconds
  const last = state.listeningActivity[0];
  if (
    last &&
    String(last.songId) === String(song.id) &&
    now - Number(last.timestamp || 0) < 15000
  ) {
    return;
  }

  const activityItem = {
    id: `act_${song.id}_${now}`,
    songId: song.id,
    title: song.title || 'Unknown Song',
    artist: song.artist || 'Unknown Artist',
    album: song.album && song.album !== 'Unknown' ? song.album : 'Single',
    coverUrl: song.coverUrl || '/assets/pawtify.png',
    duration: song.duration || '0:00',
    timestamp: now,
    context: source || 'stream',
  };

  state.listeningActivity = [activityItem, ...state.listeningActivity].slice(
    0,
    100
  );
  saveJSON(STORAGE.ACTIVITY, state.listeningActivity);
}

export function getListeningActivityList() {
  state.listeningActivity = Array.isArray(state.listeningActivity)
    ? state.listeningActivity
    : [];

  // Bootstrap initial listening history entries if user has recentlyPlayed songs but empty activity feed
  if (state.listeningActivity.length === 0) {
    const candidateSongs = [
      ...(state.recentlyPlayed || [])
        .map((id) => getSongById(id))
        .filter(Boolean),
      ...(state.favorites || []).slice(0, 8),
      ...(state.trendingSongs || []).slice(0, 6),
      ...(state.recommendedSongs || []).slice(0, 6),
    ];
    const unique = dedupeSongs(candidateSongs);
    if (unique.length > 0) {
      const now = Date.now();
      const offsets = [
        4 * 60 * 1000,
        22 * 60 * 1000,
        65 * 60 * 1000,
        3 * 3600 * 1000,
        7 * 3600 * 1000,
        18 * 3600 * 1000,
        26 * 3600 * 1000,
        48 * 3600 * 1000,
      ];
      state.listeningActivity = unique.slice(0, 10).map((s, idx) => ({
        id: `act_${s.id}_${now - (offsets[idx] || (idx + 1) * 3600000)}`,
        songId: s.id,
        title: s.title || 'Unknown Song',
        artist: s.artist || 'Unknown Artist',
        album: s.album && s.album !== 'Unknown' ? s.album : 'Single',
        coverUrl: s.coverUrl || '/assets/pawtify.png',
        duration: s.duration || '0:00',
        timestamp: now - (offsets[idx] || (idx + 1) * 3600000),
        context: idx % 2 === 0 ? 'stream' : (s.album && s.album !== 'Single' ? s.album : 'Daily Mix'),
      }));
      saveJSON(STORAGE.ACTIVITY, state.listeningActivity);
    }
  }

  // Ensure all activity songs are cached in the catalog so clicking play immediately works
  if (state.listeningActivity.length > 0) {
    const actSongs = state.listeningActivity.map((act) => ({
      id: act.songId,
      title: act.title,
      artist: act.artist,
      album: act.album,
      coverUrl: act.coverUrl,
      duration: act.duration || '0:00',
      durationSec: 0,
    }));
    rememberSongs(actSongs);
  }

  return state.listeningActivity;
}

export function addRecentlyPlayed(songId, songObj = null) {
  const without = state.recentlyPlayed.filter((id) => id !== songId);
  state.recentlyPlayed = [songId, ...without].slice(0, 50);
  saveJSON(STORAGE.RECENT_PLAYED, state.recentlyPlayed);

  const song = songObj || getSongById(songId);
  if (song) {
    recordListeningActivity(song);
  }
}

export function getSongById(id) {
  return id ? songCatalog.get(String(id)) || null : null;
}

export function seedCatalog() {
  rememberSongs(state.queue);
  rememberSongs(state.favorites);
  rememberSongs(
    state.playlists.flatMap((playlist) =>
      Array.isArray(playlist.songs) ? playlist.songs : []
    )
  );
  if (Array.isArray(state.listeningActivity)) {
    const activitySongs = state.listeningActivity.map((act) => ({
      id: act.songId,
      title: act.title,
      artist: act.artist,
      album: act.album,
      coverUrl: act.coverUrl,
      duration: act.duration || '0:00',
      durationSec: 0,
    }));
    rememberSongs(activitySongs);
  }
  const recentTracks = state.recentSearches
    .filter((i) => i.type === 'track')
    .map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.subtitle,
      coverUrl: t.imageUrl,
      duration: '0:00',
      durationSec: 0,
    }));
  rememberSongs(recentTracks);
  rememberSongs(state.trendingSongs);
  rememberSongs(state.indieBandsSongs);
  rememberSongs(state.acousticSongs);
  rememberSongs(state.melodicIndieSongs);
  rememberSongs(state.lofiSongs);
  rememberSongs(state.classicalSongs);
  rememberSongs(state.recommendedSongs);
  if (state.feedCategories)
    state.feedCategories.forEach((cat) => rememberSongs(cat.songs));
  if (state.currentSong) rememberSongs([state.currentSong]);
}

export function rememberSongs(songs) {
  if (!Array.isArray(songs)) return;
  songs.forEach((song) => {
    if (song?.id) songCatalog.set(String(song.id), song);
  });
}

export function dedupeSongs(songs) {
  if (!Array.isArray(songs)) return [];
  const seenId = new Set();
  const seenKey = new Set();
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

export function normalizePlaylists(playlists) {
  if (!Array.isArray(playlists) || playlists.length === 0)
    return [{ id: 'default', name: 'My Playlist', songs: [] }];
  return playlists
    .map((playlist, index) => ({
      id: String(playlist.id || `playlist-${index}`),
      name: String(playlist.name || `Playlist ${index + 1}`),
      songs: dedupeSongs(Array.isArray(playlist.songs) ? playlist.songs : []),
    }))
    .filter((playlist) => playlist.name.trim().length > 0);
}

export function saveRecentSearch(query) {
  const q = (query || '').trim();
  if (!q) return;
  const item = { type: 'query', query: q, timestamp: Date.now() };
  state.recentSearches = [
    item,
    ...state.recentSearches.filter((entry) =>
      entry.type === 'query'
        ? entry.query.toLowerCase() !== q.toLowerCase()
        : true
    ),
  ].slice(0, 15);
  saveJSON(STORAGE.RECENT_SEARCHES, state.recentSearches);
}

export function saveRecentItem(type, data) {
  const item = { type, timestamp: Date.now(), ...data };
  const isDuplicate = (entry) => {
    if (type === 'query')
      return (
        entry.type === 'query' &&
        entry.query.toLowerCase() === data.query.toLowerCase()
      );
    return entry.type === type && entry.id === data.id;
  };
  state.recentSearches = [
    item,
    ...state.recentSearches.filter((e) => !isDuplicate(e)),
  ].slice(0, 15);
  saveJSON(STORAGE.RECENT_SEARCHES, state.recentSearches);
}

export function normalizeRecentSearches(items) {
  if (!Array.isArray(items)) return [];
  return items
    .map((entry) => {
      if (entry.type) return entry;
      return {
        type: 'query',
        query: String(entry?.query || '').trim(),
        timestamp: Number(entry?.timestamp) || Date.now(),
      };
    })
    .filter((entry) =>
      entry.type === 'query' ? entry.query.length > 0 : !!entry.id
    )
    .slice(0, 15);
}
