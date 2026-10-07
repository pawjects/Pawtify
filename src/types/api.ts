export interface ApiSongItem {
  id: string;
  title: string;
  uploaderName: string;
  thumbnail: string;
  duration: number;
  durationString: string;
  resultType: 'song' | 'playlist' | 'artist';
  isVerified?: boolean;
  isOfficialArtist?: boolean;
  isTopic?: boolean;
  tags?: string[];
}

export interface ApiPlaylistItem {
  id: string;
  title: string;
  uploaderName: string;
  thumbnail: string;
  resultType: 'playlist';
}

export interface ApiArtistItem {
  id: string;
  title: string;
  thumbnail: string;
  resultType: 'artist';
}

export interface ApiSearchResponse {
  item?: ApiSongItem | null;
  items: Array<ApiSongItem | ApiPlaylistItem | ApiArtistItem | string>;
  error?: string;
}
