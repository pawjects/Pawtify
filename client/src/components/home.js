import { state } from '../config/config.js';
import {
  renderHomeScrollCard,
  renderHomeScrollSkeleton,
  renderHomeGridSkeleton,
} from './components.js';
import { escapeHTML, getOptimizedArtwork } from '../utils/utils.js';
import { getSongById } from '../core/details.js';

export function getGreeting() {
  const hour = new Date().getHours();
  let text = 'Good Evening';
  if (hour < 12) text = 'Good Morning';
  else if (hour < 18) text = 'Good Afternoon';

  if (state.userName) {
    return `${text}, ${state.userName}`;
  }
  return text;
}

/**
 * Curated Recommended Stations data matching the Spotify reference screenshot
 */
const RECOMMENDED_STATIONS = [
  {
    id: 'station-mitraz',
    artist: 'Mitraz',
    subtitle: 'King, Mitraz, The PropheC, Aashir Wajahat, Anmol A',
    bgColor: '#8be8b5',
    textColor: '#121212',
    artistImg: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=300&h=300',
  },
  {
    id: 'station-gravero',
    artist: 'Gravero',
    subtitle: 'Gravero, SINASH, Salem Sandhu, Waleed Osman',
    bgColor: '#f4a6d7',
    textColor: '#121212',
    artistImg: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=300&h=300',
  },
  {
    id: 'station-arijit',
    artist: 'Arijit Singh',
    subtitle: 'Arijit Singh, Pritam, Atif Aslam, Jasleen Royal',
    bgColor: '#f5c542',
    textColor: '#121212',
    artistImg: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=300&h=300',
  },
  {
    id: 'station-weeknd',
    artist: 'The Weeknd',
    subtitle: 'The Weeknd, Post Malone, Bruno Mars, Dua Lipa',
    bgColor: '#85d6d8',
    textColor: '#121212',
    artistImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=300&h=300',
  },
];

export function renderHomePage() {
  const greeting = getGreeting();
  const rec = Array.isArray(state.recommendedSongs)
    ? state.recommendedSongs.slice(0, 10)
    : [];
  const categories = state.feedCategories || [];
  const activeFilter = state.homeFilter || 'all';

  // 1. Collect up to 8 top items for the 2-column compact recent grid (4 rows of 2)
  const topRecentPicks = [];
  const seenIds = new Set();

  if (state.favorites && state.favorites.length > 0) {
    topRecentPicks.push({
      id: 'liked-songs',
      title: 'Liked Songs',
      coverUrl: state.favorites[0].coverUrl || '/assets/pawtify.png',
      action: 'navigate-liked',
      route: '/playlist/liked',
    });
  }

  (state.playlists || []).forEach((p) => {
    if (topRecentPicks.length < 8) {
      topRecentPicks.push({
        id: p.id,
        title: p.name,
        coverUrl: p.coverUrl || p.songs?.[0]?.coverUrl || '/assets/pawtify.png',
        action: 'open-playlist-profile',
        playlistId: p.id,
      });
    }
  });

  // Pull from recently played tracks
  (state.recentlyPlayed || []).forEach((songId) => {
    if (topRecentPicks.length < 8 && !seenIds.has(songId)) {
      const s = getSongById(songId);
      if (s) {
        seenIds.add(songId);
        topRecentPicks.push({
          id: s.id,
          title: s.title,
          coverUrl: s.coverUrl,
          action: 'play-song',
          songId: s.id,
        });
      }
    }
  });

  // Fallbacks from recommended or feed categories if fewer than 8
  if (topRecentPicks.length < 8 && rec.length) {
    rec.forEach((s) => {
      if (topRecentPicks.length < 8 && !seenIds.has(s.id)) {
        seenIds.add(s.id);
        topRecentPicks.push({
          id: s.id,
          title: s.title,
          coverUrl: s.coverUrl,
          action: 'play-song',
          songId: s.id,
        });
      }
    });
  }

  // 2-Column Grid HTML
  const compactGridHTML = topRecentPicks.length
    ? topRecentPicks
        .slice(0, 8)
        .map((item) => {
          const cover = getOptimizedArtwork(item.coverUrl, 160);
          return `
            <article class="home-compact-card"
                     ${item.route ? `data-route="${escapeHTML(item.route)}"` : ''}
                     ${item.playlistId ? `data-action="open-playlist-profile" data-playlist-id="${escapeHTML(item.playlistId)}"` : ''}
                     ${item.songId ? `data-action="play-song" data-song-id="${escapeHTML(item.songId)}" data-source="home-compact"` : ''}
                     role="button"
                     tabindex="0"
                     aria-label="Play ${escapeHTML(item.title)}">
              <img class="home-compact-thumb" src="${escapeHTML(cover)}" alt="" loading="lazy" draggable="false" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
              <span class="home-compact-title">${escapeHTML(item.title)}</span>
            </article>
          `;
        })
        .join('')
    : Array(8).fill('').map(() => renderHomeGridSkeleton()).join('');

  // Recommended Stations Carousel HTML
  const stationsHTML = RECOMMENDED_STATIONS.map((st) => `
    <article class="station-card" style="background-color: ${st.bgColor}; color: ${st.textColor};" data-action="search-artist-station" data-artist="${escapeHTML(st.artist)}" role="button" tabindex="0">
      <div class="station-header">
        <i class="fa-brands fa-spotify station-logo" style="font-size: 1.15rem;"></i>
        <span class="station-badge">RADIO</span>
      </div>
      <div class="station-art-wrap">
        <img class="station-artist-photo" src="${escapeHTML(st.artistImg)}" alt="${escapeHTML(st.artist)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
      </div>
      <div class="station-footer">
        <h3 class="station-title" style="color: ${st.textColor};">${escapeHTML(st.artist)}</h3>
        <p class="station-subtitle" style="color: rgba(0,0,0,0.65);">${escapeHTML(st.subtitle)}</p>
      </div>
    </article>
  `).join('');

  // Sections (Recents, Suggested, Categories)
  let sectionsHTML = '';

  // Recommended Stations section
  sectionsHTML += `
    <section class="home-section">
      <h2 class="home-section-title">Recommended Stations</h2>
      <div class="home-scroll station-scroll">
        ${stationsHTML}
      </div>
    </section>
  `;

  // Recents section
  if (state.recentlyPlayed && state.recentlyPlayed.length) {
    const recentSongs = state.recentlyPlayed
      .map((id) => getSongById(id))
      .filter(Boolean)
      .slice(0, 10);
    if (recentSongs.length) {
      sectionsHTML += `
        <section class="home-section">
          <div class="home-section-header">
            <h2 class="home-section-title">Recents</h2>
            <button class="home-section-link" data-route="/playlist/history" type="button">Show all</button>
          </div>
          <div class="home-scroll">
            ${recentSongs.map((s, i) => renderHomeScrollCard(s, i, 'history')).join('')}
          </div>
        </section>
      `;
    }
  }

  // Recommended For You
  if (rec.length) {
    sectionsHTML += `
      <section class="home-section">
        <h2 class="home-section-title">Made for You</h2>
        <div class="home-scroll">
          ${rec.map((s, i) => renderHomeScrollCard(s, i, 'recommended')).join('')}
        </div>
      </section>
    `;
  }

  // Feed categories
  categories.forEach((cat) => {
    if (cat.songs && cat.songs.length) {
      sectionsHTML += `
        <section class="home-section">
          <h2 class="home-section-title">${escapeHTML(cat.title)}</h2>
          <div class="home-scroll">
            ${cat.songs.map((s, i) => renderHomeScrollCard(s, i, cat.id)).join('')}
          </div>
        </section>
      `;
    }
  });

  if (!rec.length && !categories.length) {
    sectionsHTML += `
      <section class="home-section">
        <h2 class="home-section-title">Trending Now</h2>
        <div class="home-scroll">
          ${Array(5).fill('').map(() => renderHomeScrollSkeleton()).join('')}
        </div>
      </section>
    `;
  }

  return `
    <section class="page home-page-spotify">
      <!-- Top Bar: User Profile Avatar & Horizontal Filter Chips -->
      <header class="home-top-bar">
        <button class="home-user-avatar-btn" data-route="/you" type="button" aria-label="Your Profile" title="Profile">
          <img class="home-user-avatar" src="/assets/pawtify.png" alt="Profile" />
        </button>
        <div class="home-chips-scroll">
          <button class="home-filter-chip ${activeFilter === 'all' ? 'active' : ''}" data-action="set-home-filter" data-filter="all" type="button">
            All
          </button>
          <button class="home-filter-chip ${activeFilter === 'music' ? 'active' : ''}" data-action="set-home-filter" data-filter="music" type="button">
            Music
          </button>
          <button class="home-filter-chip ${activeFilter === 'podcasts' ? 'active' : ''}" data-action="set-home-filter" data-filter="podcasts" type="button">
            Podcasts
          </button>
        </div>
      </header>

      <!-- 2-Column Compact Grid for Quick Recent Picks -->
      <div class="home-compact-grid">
        ${compactGridHTML}
      </div>

      <!-- Carousels & Stations -->
      ${sectionsHTML}
    </section>
  `;
}
