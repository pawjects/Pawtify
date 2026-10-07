export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration?: string;
  durationSec?: number;
  album?: string;
  addedAt?: number;
  _triedFallback?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  songs: Song[];
}

export interface FeedCategory {
  id: string;
  title: string;
  songs: Song[];
}

export interface ArtistProfile {
  name: string;
  loading: boolean;
  songs: Song[];
  imageUrl: string;
  type?: string;
}

export interface SearchItem {
  type: 'track' | 'artist' | 'playlist' | 'query';
  id?: string;
  query?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  timestamp?: number;
}

export interface SearchResults {
  songs: Song[];
  artists: Array<{
    id: string;
    name: string;
    imageUrl: string;
    type?: string;
  }>;
  playlists: Array<{
    id: string;
    name: string;
    uploaderName: string;
    imageUrl: string;
    type?: string;
  }>;
}

export type RepeatMode = 'none' | 'all' | 'one';

export interface RouteInfo {
  name: 'home' | 'search' | 'library' | 'you' | 'song' | 'playlist';
  songId?: string | null;
  playlistId?: string | null;
}

export type ModalState =
  | { type: 'songDetails'; songId?: string }
  | { type: 'playlistPicker'; songId: string }
  | { type: 'createPlaylist' }
  | { type: 'editPlaylist'; playlistId: string }
  | { type: 'welcome' }
  | { type: 'editName' }
  | null;
