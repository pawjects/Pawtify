import { state, LOGO_URL } from '../config/config.js';
import { artistProfile } from '../config/dom.js';
import {
  saveRecentItem,
  saveRecentSearch,
  rememberSongs,
} from '../core/details.js';
import { searchSongs, searchArtists } from '../services/apiMapping.js';
import { escapeHTML } from '../utils/utils.js';
import { renderSongRow } from './components.js';

export async function openArtistProfile(artistName) {
  if (state.route.name === 'search' && state.searchQuery.trim()) {
    // Save as query for now since we don't have full artist data immediately, but wait, we have artistName.
    // If we can get image from searchResults we save as item
    const artistObj = state.searchResults.artists.find(
      (a) => a.name === artistName
    );
    if (artistObj) {
      saveRecentItem('artist', {
        id: artistObj.id,
        title: artistObj.name,
        subtitle: 'Artist',
        imageUrl: artistObj.imageUrl,
      });
    } else {
      saveRecentSearch(state.searchQuery);
    }
  }
  state.artistProfile = {
    name: artistName,
    loading: true,
    songs: [],
    imageUrl: '',
  };
  renderArtistProfile();
  try {
    const [songs, artists] = await Promise.all([
      searchSongs(artistName, 0, 20),
      searchArtists(artistName, 0, 1),
    ]);
    const artist = artists[0] || { imageUrl: LOGO_URL, type: 'Artist' };
    state.artistProfile = {
      name: artistName,
      loading: false,
      songs: songs,
      imageUrl: artist.imageUrl,
      type: artist.type || 'Artist',
    };
    rememberSongs(songs);
    renderArtistProfile();
  } catch (err) {
    if (state.artistProfile) state.artistProfile.loading = false;
    renderArtistProfile();
  }
}

export function renderArtistProfile() {
  if (!artistProfile) return;
  if (!state.artistProfile) {
    artistProfile.classList.remove('active');
    artistProfile.innerHTML = '';
    return;
  }
  artistProfile.classList.add('active');
  const artist = state.artistProfile;
  artistProfile.innerHTML = `
     <div class="artist-hero">
       <button class="artist-hero-back" data-action="close-artist-profile" type="button" aria-label="Back">
         <i class="fa-solid fa-chevron-down"></i>
       </button>
       <img class="artist-hero-img" src="${escapeHTML(artist.imageUrl || LOGO_URL)}" alt="${escapeHTML(artist.name)}" />
       <div class="artist-hero-name">${escapeHTML(artist.name)}</div>
       <div class="artist-hero-meta">${escapeHTML(artist.type || 'Artist')} \u2022 ${artist.songs?.length || 0} songs</div>
       <div class="artist-hero-actions">
         <button class="btn-play" data-action="play-song" data-song-id="${escapeHTML(artist.songs?.[0]?.id || '')}" data-source="artist" type="button">
           <i class="fa-solid fa-play"></i>
         </button>
         <button class="btn-icon" data-action="shuffle-playlist" data-playlist-id="artist-${escapeHTML(artist.name)}" type="button">
           <i class="fa-solid fa-shuffle"></i>
         </button>
       </div>
     </div>
     <div class="artist-section">
       <h3><i class="fa-solid fa-music" style="margin-right:8px; color:var(--green);"></i>Popular</h3>
       <div class="song-table">
         ${
           artist.loading
             ? `<div class="song-table" style="padding:0 24px;">${Array(6).fill('').map(() => `
    <div class="skeleton-song-row">
      <div class="skeleton skeleton-cover-sm"></div>
      <div class="skeleton-text-wrap">
        <div class="skeleton skeleton-text-main" style="width: 60%;"></div>
        <div class="skeleton skeleton-text-sub" style="width: 40%;"></div>
      </div>
    </div>
  `).join('')}</div>`
             : artist.songs?.length
               ? artist.songs
                   .map((s, i) => renderSongRow(s, i + 1, 'artist'))
                   .join('')
               : '<div class="empty-state"><i class="fa-solid fa-music"></i><h2>No songs found</h2></div>'
         }
       </div>
     </div>
   `;
}
