'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  Song,
  Playlist,
  FeedCategory,
  ArtistProfile,
  SearchItem,
  RepeatMode,
  RouteInfo,
  ModalState,
} from '../types';
import {
  STORAGE,
  DISCOVERY_CATEGORIES,
  INITIAL_FEED_CATEGORIES,
  loadJSON,
  saveJSON,
  dedupeSongs,
  normalizePlaylists,
  normalizeRecentSearches,
  isValidSongId,
} from '../utils/helpers';
import { idbGet, idbSet } from '../utils/idb';
import { searchSongs, fetchSongById } from '../services/api';

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

interface PawtifyContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  isVideoMode: boolean;
  queue: Song[];
  currentSongIndex: number;
  history: Song[];
  favorites: Song[];
  playlists: Playlist[];
  route: RouteInfo;
  activeFilter: 'all' | 'songs' | 'artists' | 'playlists';
  searchQuery: string;
  recentSearches: SearchItem[];
  userName: string;
  theme: 'dark' | 'light' | 'amoled';
  fullscreenPlayer: boolean;
  queuePanel: boolean;
  lyricsPanel: boolean;
  artistProfile: ArtistProfile | null;
  modal: ModalState;
  toastMessage: string | null;

  feedCategories: FeedCategory[];
  feedLoading: boolean;
  refreshFeed: () => Promise<void>;

  navigate: (path: string) => void;
  playSong: (song: Song, contextList?: Song[], startIndex?: number) => void;
  togglePlayPause: () => void;
  pause: () => void;
  play: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  toggleVideo: () => void;
  toggleFavorite: (song: Song) => void;
  isFavorite: (songId: string) => boolean;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  createPlaylist: (name: string) => Playlist;
  deletePlaylist: (id: string) => void;
  renamePlaylist: (id: string, name: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  setRoute: (route: RouteInfo) => void;
  setSearchQuery: (q: string) => void;
  setActiveFilter: (filter: 'all' | 'songs' | 'artists' | 'playlists') => void;
  addRecentSearch: (item: SearchItem) => void;
  clearRecentSearches: () => void;
  setUserName: (name: string) => void;
  setTheme: (theme: 'dark' | 'light' | 'amoled') => void;
  setFullscreenPlayer: (open: boolean) => void;
  setQueuePanel: (open: boolean) => void;
  setLyricsPanel: (open: boolean) => void;
  openArtistProfile: (artistName: string, imageUrl?: string) => void;
  closeArtistProfile: () => void;
  setModal: (m: ModalState) => void;
  showToast: (msg: string) => void;
  getSongById: (id: string) => Song | undefined;
}

const PawtifyContext = createContext<PawtifyContextType | null>(null);

function parsePathToRoute(path: string): RouteInfo {
  const clean = path.replace(/^[#/]+/, '');
  const parts = clean.split('/').filter(Boolean);
  const view = parts[0] || 'home';

  if (view === 'playlist' && parts[1]) {
    return { name: 'playlist', playlistId: parts[1] };
  }
  if (view === 'song' && parts[1]) {
    return { name: 'song', songId: parts[1] };
  }
  if (['home', 'search', 'library', 'you'].includes(view)) {
    return { name: view as any };
  }
  return { name: 'home' };
}

export const PawtifyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Navigation / Route state (Sync, Instant, Single Source of Truth)
  const [route, setRoute] = useState<RouteInfo>({ name: 'home' });

  // State
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(80);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none');
  const [isShuffled, setIsShuffled] = useState<boolean>(false);
  const [isVideoMode, setIsVideoMode] = useState<boolean>(false);

  const [queue, setQueue] = useState<Song[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState<number>(0);

  const [history, setHistory] = useState<Song[]>([]);
  const [favorites, setFavorites] = useState<Song[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([
    { id: 'default', name: 'My Playlist', songs: [] },
  ]);

  const [activeFilter, setActiveFilter] = useState<
    'all' | 'songs' | 'artists' | 'playlists'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [recentSearches, setRecentSearches] = useState<SearchItem[]>([]);

  const [userName, setUserNameState] = useState<string>('Music Lover');
  const [theme, setThemeState] = useState<'dark' | 'light' | 'amoled'>('dark');

  const [fullscreenPlayer, setFullscreenPlayer] = useState<boolean>(false);
  const [queuePanel, setQueuePanel] = useState<boolean>(false);
  const [lyricsPanel, setLyricsPanel] = useState<boolean>(false);
  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [modal, setModal] = useState<ModalState>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Feed categories cache initialized with real instant music tracks
  const [feedCategories, setFeedCategories] = useState<FeedCategory[]>(INITIAL_FEED_CATEGORIES);
  const [feedLoading, setFeedLoading] = useState<boolean>(false);

  // Refs for audio engine
  const ytPlayerRef = useRef<any>(null);
  const isPlayerReadyRef = useRef<boolean>(false);
  const pendingSongIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentSongRef = useRef<Song | null>(currentSong);
  currentSongRef.current = currentSong;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;
  const queueRef = useRef<Song[]>(queue);
  queueRef.current = queue;
  const currentSongIndexRef = useRef<number>(currentSongIndex);
  currentSongIndexRef.current = currentSongIndex;
  const isShuffledRef = useRef<boolean>(isShuffled);
  isShuffledRef.current = isShuffled;
  const volumeRef = useRef<number>(volume);
  volumeRef.current = volume;
  const nextTrackRef = useRef<() => void>(() => {});
  const playSongRef = useRef<(song: Song, contextList?: Song[], startIndex?: number) => void>(() => {});

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }, []);

  // Synchronous and reliable navigation
  const navigate = useCallback((path: string) => {
    const nextRoute = parsePathToRoute(path);
    setRoute(nextRoute);

    try {
      const cleanPath = path.replace(/^[#/]+/, '');
      const targetHash = `#${cleanPath}`;
      if (window.location.hash !== targetHash) {
        window.history.pushState(null, '', targetHash);
      }
    } catch {}
  }, []);

  // Listen to browser hash changes / back button
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parsePathToRoute(window.location.hash);
      setRoute(parsed);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Sync body class for mobile mini-player padding
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (currentSong) {
        document.body.classList.add('has-active-track');
      } else {
        document.body.classList.remove('has-active-track');
      }
    }
  }, [currentSong]);

  // Load feed categories in parallel and cache them
  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const promises = DISCOVERY_CATEGORIES.slice(0, 4).map(async (cat, idx) => {
        try {
          const songs = await searchSongs(cat.query, 10);
          if (songs && songs.length > 0) {
            return {
              id: `cat-${idx}`,
              title: cat.title,
              songs: songs,
            };
          }
        } catch (e) {
          console.error(`Error loading category ${cat.title}:`, e);
        }
        return null;
      });

      const results = await Promise.all(promises);
      const valid = results.filter(
        (c): c is FeedCategory => c !== null && c.songs.length > 0
      );
      if (valid.length > 0) {
        setFeedCategories(valid);
      }
    } catch (err) {
      console.error('Error refreshing feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // Hydrate from localStorage & IndexedDB after initial client mount
  useEffect(() => {
    try {
      const savedName = loadJSON(STORAGE.USER_NAME, 'Music Lover');
      if (savedName) setUserNameState(savedName);

      const savedTheme = loadJSON<'dark' | 'light' | 'amoled'>(STORAGE.THEME, 'dark');
      if (savedTheme) setThemeState(savedTheme);

      const savedVol = loadJSON(STORAGE.VOLUME, 80);
      setVolumeState(savedVol);

      const savedRepeat = loadJSON<RepeatMode>(STORAGE.REPEAT, 'none');
      setRepeatMode(savedRepeat);

      const savedShuffle = loadJSON<boolean>(STORAGE.SHUFFLE, false);
      setIsShuffled(savedShuffle);

      const savedSong = loadJSON<Song | null>(STORAGE.CURRENT_SONG, null);
      if (savedSong && savedSong.id) setCurrentSong(savedSong);

      const savedQueue = loadJSON<Song[]>(STORAGE.QUEUE, []);
      if (Array.isArray(savedQueue) && savedQueue.length > 0) {
        setQueue(dedupeSongs(savedQueue));
      }

      const savedFavs = loadJSON<Song[]>(STORAGE.FAVORITES, []);
      if (Array.isArray(savedFavs) && savedFavs.length > 0) {
        setFavorites(dedupeSongs(savedFavs));
      }

      const savedPls = loadJSON<Playlist[]>(STORAGE.PLAYLISTS, []);
      if (Array.isArray(savedPls) && savedPls.length > 0) {
        setPlaylists(normalizePlaylists(savedPls));
      }

      const savedHist = loadJSON<Song[]>(STORAGE.RECENT_PLAYED, []);
      if (Array.isArray(savedHist) && savedHist.length > 0) {
        setHistory(dedupeSongs(savedHist));
      }

      const savedSearches = loadJSON<SearchItem[]>(STORAGE.RECENT_SEARCHES, []);
      if (Array.isArray(savedSearches) && savedSearches.length > 0) {
        setRecentSearches(normalizeRecentSearches(savedSearches));
      }

      if (window.location.hash) {
        setRoute(parsePathToRoute(window.location.hash));
      }
    } catch (e) {
      console.error('Error hydrating localStorage:', e);
    }

    async function hydrateIDB() {
      try {
        const idbFavs = await idbGet<Song[]>(STORAGE.FAVORITES);
        if (idbFavs && Array.isArray(idbFavs) && idbFavs.length > 0) {
          setFavorites(dedupeSongs(idbFavs));
        }
        const idbPlaylists = await idbGet<Playlist[]>(STORAGE.PLAYLISTS);
        if (idbPlaylists && Array.isArray(idbPlaylists) && idbPlaylists.length > 0) {
          setPlaylists(normalizePlaylists(idbPlaylists));
        }
        const idbHistory = await idbGet<Song[]>(STORAGE.RECENT_PLAYED);
        if (idbHistory && Array.isArray(idbHistory) && idbHistory.length > 0) {
          setHistory(dedupeSongs(idbHistory));
        }
        const idbQueue = await idbGet<Song[]>(STORAGE.QUEUE);
        if (idbQueue && Array.isArray(idbQueue) && idbQueue.length > 0) {
          setQueue(dedupeSongs(idbQueue));
        }
        const savedSong = await idbGet<Song>(STORAGE.CURRENT_SONG);
        if (savedSong && savedSong.id) {
          setCurrentSong(savedSong);
        }
      } catch (err) {
        console.error('IDB Hydration Error:', err);
      }
    }
    hydrateIDB();
  }, []);

  // Sync theme attribute
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  // Playback control functions
  const playSong = useCallback(
    (song: Song, contextList?: Song[], startIndex?: number) => {
      if (!song || !isValidSongId(song.id)) {
        showToast('Invalid song ID');
        return;
      }

      setCurrentSong(song);
      saveJSON(STORAGE.CURRENT_SONG, song);

      // Add to recent played history
      setHistory((prev) => {
        const filtered = prev.filter((s) => s.id !== song.id);
        const updated = [song, ...filtered].slice(0, 50);
        saveJSON(STORAGE.RECENT_PLAYED, updated);
        return updated;
      });

      // Update queue
      if (contextList && contextList.length > 0) {
        const cleanList = dedupeSongs(contextList);
        setQueue(cleanList);
        saveJSON(STORAGE.QUEUE, cleanList);
        const idx =
          startIndex !== undefined
            ? startIndex
            : cleanList.findIndex((s) => s.id === song.id);
        setCurrentSongIndex(idx >= 0 ? idx : 0);
      } else {
        setQueue((prev) => {
          const exists = prev.findIndex((s) => s.id === song.id);
          if (exists === -1) {
            const nextQ = [...prev, song];
            saveJSON(STORAGE.QUEUE, nextQ);
            setCurrentSongIndex(nextQ.length - 1);
            return nextQ;
          } else {
            setCurrentSongIndex(exists);
            return prev;
          }
        });
      }

      // Load into YT player
      if (ytPlayerRef.current && isPlayerReadyRef.current) {
        try {
          ytPlayerRef.current.loadVideoById(song.id);
          setIsPlaying(true);
        } catch {
          try {
            ytPlayerRef.current.cueVideoById(song.id);
            ytPlayerRef.current.playVideo();
            setIsPlaying(true);
          } catch {}
        }
      } else {
        // Player not ready yet, queue it up
        pendingSongIdRef.current = song.id;
        setIsPlaying(true);
      }
    },
    [showToast]
  );
  playSongRef.current = playSong;

  const togglePlayPause = useCallback(() => {
    if (!currentSong) {
      if (queue.length > 0) {
        playSong(queue[0]);
      } else if (feedCategories.length > 0 && feedCategories[0].songs.length > 0) {
        playSong(feedCategories[0].songs[0], feedCategories[0].songs, 0);
      }
      return;
    }

    if (ytPlayerRef.current && isPlayerReadyRef.current) {
      try {
        if (isPlaying) {
          ytPlayerRef.current.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current.playVideo();
          setIsPlaying(true);
        }
      } catch (err) {
        console.error('Play/Pause Error:', err);
      }
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentSong, queue, isPlaying, feedCategories, playSong]);

  const play = useCallback(() => {
    if (ytPlayerRef.current && isPlayerReadyRef.current) {
      try {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      } catch {}
    } else {
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (ytPlayerRef.current && isPlayerReadyRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } catch {}
    } else {
      setIsPlaying(false);
    }
  }, []);

  const nextTrack = useCallback(() => {
    const curQueue = queueRef.current;
    if (curQueue.length === 0) return;

    if (isShuffledRef.current) {
      const randomIndex = Math.floor(Math.random() * curQueue.length);
      setCurrentSongIndex(randomIndex);
      playSong(curQueue[randomIndex]);
      return;
    }

    const curIndex = currentSongIndexRef.current;
    if (curIndex < curQueue.length - 1) {
      const nextIndex = curIndex + 1;
      setCurrentSongIndex(nextIndex);
      playSong(curQueue[nextIndex]);
    } else if (repeatModeRef.current === 'all') {
      setCurrentSongIndex(0);
      playSong(curQueue[0]);
    } else {
      setIsPlaying(false);
    }
  }, [playSong]);
  nextTrackRef.current = nextTrack;

  const prevTrack = useCallback(() => {
    const curQueue = queueRef.current;
    if (curQueue.length === 0) return;

    if (ytPlayerRef.current && isPlayerReadyRef.current) {
      try {
        const curTime = ytPlayerRef.current.getCurrentTime() || 0;
        if (curTime > 3) {
          ytPlayerRef.current.seekTo(0);
          return;
        }
      } catch {}
    }

    const curIndex = currentSongIndexRef.current;
    if (curIndex > 0) {
      const prevIndex = curIndex - 1;
      setCurrentSongIndex(prevIndex);
      playSong(curQueue[prevIndex]);
    } else {
      setCurrentSongIndex(curQueue.length - 1);
      playSong(curQueue[curQueue.length - 1]);
    }
  }, [playSong]);

  const seekTo = useCallback((seconds: number) => {
    if (ytPlayerRef.current && isPlayerReadyRef.current) {
      try {
        ytPlayerRef.current.seekTo(seconds, true);
        setProgress(seconds);
      } catch {}
    } else {
      setProgress(seconds);
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(100, Math.round(vol)));
    setVolumeState(clamped);
    saveJSON(STORAGE.VOLUME, clamped);
    if (ytPlayerRef.current && isPlayerReadyRef.current) {
      try {
        ytPlayerRef.current.setVolume(clamped);
        if (clamped > 0 && isMuted) {
          ytPlayerRef.current.unMute();
          setIsMuted(false);
        }
      } catch {}
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    if (ytPlayerRef.current && isPlayerReadyRef.current) {
      try {
        if (isMuted) {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume);
          setIsMuted(false);
        } else {
          ytPlayerRef.current.mute();
          setIsMuted(true);
        }
      } catch {}
    } else {
      setIsMuted((prev) => !prev);
    }
  }, [isMuted, volume]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      let next: RepeatMode = 'none';
      if (prev === 'none') next = 'all';
      else if (prev === 'all') next = 'one';
      else next = 'none';
      saveJSON(STORAGE.REPEAT, next);
      showToast(
        next === 'none'
          ? 'Repeat off'
          : next === 'all'
          ? 'Repeat all'
          : 'Repeat one'
      );
      return next;
    });
  }, [showToast]);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const next = !prev;
      saveJSON(STORAGE.SHUFFLE, next);
      showToast(next ? 'Shuffle turned on' : 'Shuffle turned off');
      return next;
    });
  }, [showToast]);

  const toggleVideo = useCallback(() => {
    setIsVideoMode((prev) => {
      const next = !prev;
      showToast(next ? 'Video mode enabled' : 'Audio mode enabled');
      return next;
    });
  }, [showToast]);

  const toggleFavorite = useCallback(
    (song: Song) => {
      if (!song) return;
      setFavorites((prev) => {
        const exists = prev.some((s) => s.id === song.id);
        let updated: Song[];
        if (exists) {
          updated = prev.filter((s) => s.id !== song.id);
          showToast(`Removed from Favorites`);
        } else {
          updated = [song, ...prev];
          showToast(`Added to Favorites`);
        }
        saveJSON(STORAGE.FAVORITES, updated);
        return updated;
      });
    },
    [showToast]
  );

  const isFavorite = useCallback(
    (songId: string) => {
      return favorites.some((s) => s.id === songId);
    },
    [favorites]
  );

  const addToQueue = useCallback(
    (song: Song) => {
      setQueue((prev) => {
        const nextQ = [...prev, song];
        saveJSON(STORAGE.QUEUE, nextQ);
        showToast(`Added "${song.title}" to queue`);
        return nextQ;
      });
    },
    [showToast]
  );

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((prev) => {
        const nextQ = prev.filter((_, i) => i !== index);
        saveJSON(STORAGE.QUEUE, nextQ);
        if (index === currentSongIndex) {
          if (nextQ.length > 0) {
            const nextIdx = Math.min(index, nextQ.length - 1);
            setCurrentSongIndex(nextIdx);
            playSong(nextQ[nextIdx]);
          } else {
            setCurrentSong(null);
            setIsPlaying(false);
          }
        } else if (index < currentSongIndex) {
          setCurrentSongIndex((prevIdx) => Math.max(0, prevIdx - 1));
        }
        return nextQ;
      });
    },
    [currentSongIndex, playSong]
  );

  const clearQueue = useCallback(() => {
    setQueue([]);
    saveJSON(STORAGE.QUEUE, []);
    setCurrentSongIndex(0);
    showToast('Queue cleared');
  }, [showToast]);

  const createPlaylist = useCallback(
    (name: string): Playlist => {
      const newPlaylist: Playlist = {
        id: `pl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim() || 'My Playlist',
        songs: [],
      };
      setPlaylists((prev) => {
        const updated = [...prev, newPlaylist];
        saveJSON(STORAGE.PLAYLISTS, updated);
        return updated;
      });
      showToast(`Created playlist "${newPlaylist.name}"`);
      return newPlaylist;
    },
    [showToast]
  );

  const deletePlaylist = useCallback(
    (id: string) => {
      setPlaylists((prev) => {
        const target = prev.find((p) => p.id === id);
        const updated = prev.filter((p) => p.id !== id);
        saveJSON(STORAGE.PLAYLISTS, updated);
        showToast(`Deleted playlist "${target?.name || ''}"`);
        return updated;
      });
      if (route.name === 'playlist' && route.playlistId === id) {
        navigate('library');
      }
    },
    [route, navigate, showToast]
  );

  const renamePlaylist = useCallback(
    (id: string, name: string) => {
      const clean = name.trim();
      if (!clean) return;
      setPlaylists((prev) => {
        const updated = prev.map((p) =>
          p.id === id ? { ...p, name: clean } : p
        );
        saveJSON(STORAGE.PLAYLISTS, updated);
        return updated;
      });
      showToast('Playlist renamed');
    },
    [showToast]
  );

  const addSongToPlaylist = useCallback(
    (playlistId: string, song: Song) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId) {
            const exists = p.songs.some((s) => s.id === song.id);
            if (exists) {
              showToast(`Already in "${p.name}"`);
              return p;
            }
            showToast(`Added to "${p.name}"`);
            return {
              ...p,
              songs: [song, ...p.songs],
            };
          }
          return p;
        });
        saveJSON(STORAGE.PLAYLISTS, updated);
        return updated;
      });
    },
    [showToast]
  );

  const removeSongFromPlaylist = useCallback(
    (playlistId: string, songId: string) => {
      setPlaylists((prev) => {
        const updated = prev.map((p) => {
          if (p.id === playlistId) {
            return {
              ...p,
              songs: p.songs.filter((s) => s.id !== songId),
            };
          }
          return p;
        });
        saveJSON(STORAGE.PLAYLISTS, updated);
        showToast('Removed from playlist');
        return updated;
      });
    },
    [showToast]
  );

  const addRecentSearch = useCallback((item: SearchItem) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((x) =>
        x.type === 'query'
          ? x.query?.toLowerCase() !== item.query?.toLowerCase()
          : x.id !== item.id
      );
      const updated = [item, ...filtered].slice(0, 15);
      saveJSON(STORAGE.RECENT_SEARCHES, updated);
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    saveJSON(STORAGE.RECENT_SEARCHES, []);
    showToast('Search history cleared');
  }, [showToast]);

  const setUserName = useCallback(
    (name: string) => {
      const clean = name.trim() || 'Music Lover';
      setUserNameState(clean);
      saveJSON(STORAGE.USER_NAME, clean);
      showToast(`Name saved`);
    },
    [showToast]
  );

  const setTheme = useCallback(
    (newTheme: 'dark' | 'light' | 'amoled') => {
      setThemeState(newTheme);
      saveJSON(STORAGE.THEME, newTheme);
      showToast(`Switched theme to ${newTheme}`);
    },
    [showToast]
  );

  const openArtistProfile = useCallback(
    async (artistName: string, imageUrl?: string) => {
      setArtistProfile({
        name: artistName,
        imageUrl: imageUrl || '/assets/pawtify.png',
        loading: true,
        songs: [],
      });
      try {
        const songs = await searchSongs(`${artistName} songs`, 20);
        setArtistProfile({
          name: artistName,
          imageUrl:
            imageUrl || songs[0]?.coverUrl || '/assets/pawtify.png',
          loading: false,
          songs: songs,
        });
      } catch {
        setArtistProfile((prev) => (prev ? { ...prev, loading: false } : null));
      }
    },
    []
  );

  const closeArtistProfile = useCallback(() => {
    setArtistProfile(null);
  }, []);

  const getSongById = useCallback(
    (id: string): Song | undefined => {
      return (
        queue.find((s) => s.id === id) ||
        history.find((s) => s.id === id) ||
        favorites.find((s) => s.id === id)
      );
    },
    [queue, history, favorites]
  );

  // Initialize YouTube Iframe Player
  const initYouTubePlayer = useCallback(() => {
    if (typeof window === 'undefined') return;

    const createPlayer = () => {
      const container = document.getElementById('youtube-player-hidden');
      if (!container || ytPlayerRef.current) return;

      try {
        ytPlayerRef.current = new window.YT.Player('youtube-player-hidden', {
          height: '100%',
          width: '100%',
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              isPlayerReadyRef.current = true;
              event.target.setVolume(volumeRef.current);

              // Check if a song was requested before the player was ready
              if (pendingSongIdRef.current) {
                event.target.loadVideoById(pendingSongIdRef.current);
                pendingSongIdRef.current = null;
                setIsPlaying(true);
              } else if (currentSongRef.current) {
                event.target.cueVideoById(currentSongRef.current.id);
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === 1) {
                setIsPlaying(true);
                const dur = event.target.getDuration() || 0;
                if (dur > 0) setDuration(dur);
              } else if (event.data === 2) {
                setIsPlaying(false);
              } else if (event.data === 0) {
                if (repeatModeRef.current === 'one') {
                  event.target.seekTo(0);
                  event.target.playVideo();
                } else {
                  nextTrackRef.current();
                }
              }
            },
            onError: (event: any) => {
              console.warn('YouTube Player error code:', event.data);
              const current = currentSongRef.current;
              if (current && !current._triedFallback) {
                searchSongs(`${current.artist} ${current.title} audio`)
                  .then((results) => {
                    const fallback = results.find((r) => r.id !== current.id);
                    if (fallback) {
                      fallback._triedFallback = true;
                      playSongRef.current(fallback);
                    } else {
                      nextTrackRef.current();
                    }
                  })
                  .catch(() => nextTrackRef.current());
              } else {
                nextTrackRef.current();
              }
            },
          },
        });
      } catch (e) {
        console.error('Error creating YouTube player:', e);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        if (firstScriptTag && firstScriptTag.parentNode) {
          firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        } else {
          document.head.appendChild(tag);
        }
      }
    }
  }, []);

  useEffect(() => {
    initYouTubePlayer();
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [initYouTubePlayer]);

  // Progress update timer
  useEffect(() => {
    if (isPlaying) {
      progressIntervalRef.current = setInterval(() => {
        if (ytPlayerRef.current && isPlayerReadyRef.current) {
          try {
            const curTime = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setProgress(curTime);
            if (dur > 0) setDuration(dur);
          } catch {}
        }
      }, 250);
    } else {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [isPlaying]);

  // MediaSession API integration
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentSong) {
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: currentSong.title,
          artist: currentSong.artist,
          album: currentSong.album || 'Pawtify',
          artwork: [
            { src: currentSong.coverUrl, sizes: '96x96', type: 'image/jpeg' },
            { src: currentSong.coverUrl, sizes: '128x128', type: 'image/jpeg' },
            { src: currentSong.coverUrl, sizes: '192x192', type: 'image/jpeg' },
            { src: currentSong.coverUrl, sizes: '512x512', type: 'image/jpeg' },
          ],
        });

        navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

        navigator.mediaSession.setActionHandler('play', () => play());
        navigator.mediaSession.setActionHandler('pause', () => pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => prevTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => nextTrack());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) seekTo(details.seekTime);
        });
      } catch {}
    }
  }, [currentSong, isPlaying, play, pause, prevTrack, nextTrack, seekTo]);

  // Global keyboard shortcuts (Space to toggle, Ctrl+Arrow for skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        nextTrack();
      } else if (e.code === 'ArrowLeft' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        prevTrack();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        setFullscreenPlayer((f) => !f);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, nextTrack, prevTrack, toggleMute]);

  return (
    <PawtifyContext.Provider
      value={{
        currentSong,
        isPlaying,
        progress,
        duration,
        volume,
        isMuted,
        repeatMode,
        isShuffled,
        isVideoMode,
        queue,
        currentSongIndex,
        history,
        favorites,
        playlists,
        route,
        activeFilter,
        searchQuery,
        recentSearches,
        userName,
        theme,
        fullscreenPlayer,
        queuePanel,
        lyricsPanel,
        artistProfile,
        modal,
        toastMessage,

        feedCategories,
        feedLoading,
        refreshFeed: loadFeed,

        navigate,
        playSong,
        togglePlayPause,
        pause,
        play,
        nextTrack,
        prevTrack,
        seekTo,
        setVolume,
        toggleMute,
        toggleRepeat,
        toggleShuffle,
        toggleVideo,
        toggleFavorite,
        isFavorite,
        addToQueue,
        removeFromQueue,
        clearQueue,
        createPlaylist,
        deletePlaylist,
        renamePlaylist,
        addSongToPlaylist,
        removeSongFromPlaylist,
        setRoute,
        setSearchQuery,
        setActiveFilter,
        addRecentSearch,
        clearRecentSearches,
        setUserName,
        setTheme,
        setFullscreenPlayer,
        setQueuePanel,
        setLyricsPanel,
        openArtistProfile,
        closeArtistProfile,
        setModal,
        showToast,
        getSongById,
      }}
    >
      {children}
    </PawtifyContext.Provider>
  );
};

export const usePawtify = () => {
  const ctx = useContext(PawtifyContext);
  if (!ctx) {
    throw new Error('usePawtify must be used within a PawtifyProvider');
  }
  return ctx;
};
