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
export const RECOMMENDED_STATIONS = [
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
    bgColor: '#1db954',
    textColor: '#000000',
    artistImg: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&q=80&w=300&h=300',
  },
];

export const PODCAST_SHOWS = [
  {
    id: 'podcast-the-daily',
    title: 'The Daily',
    publisher: 'The New York Times',
    description: 'This is what the news should sound like. Twenty minutes a day, five days a week.',
    coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300&h=300',
    category: 'News & Politics',
  },
  {
    id: 'podcast-huberman',
    title: 'Huberman Lab',
    publisher: 'Scicomm Media',
    description: 'Dr. Andrew Huberman discusses neuroscience and science-based tools for everyday life.',
    coverUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300&h=300',
    category: 'Science & Health',
  },
  {
    id: 'podcast-waveform',
    title: 'Waveform: The MKBHD Podcast',
    publisher: 'MKBHD',
    description: 'A tech podcast for gadget lovers and tech heads from Marques Brownlee and Andrew Manganelli.',
    coverUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=300&h=300',
    category: 'Technology',
  },
  {
    id: 'podcast-smartless',
    title: 'SmartLess',
    publisher: 'Jason Bateman, Sean Hayes, Will Arnett',
    description: 'A podcast that connects and unites people from all walks of life to learn about other experiences.',
    coverUrl: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&q=80&w=300&h=300',
    category: 'Comedy & Interviews',
  },
  {
    id: 'podcast-ted-talks',
    title: 'TED Talks Daily',
    publisher: 'TED',
    description: 'Every weekday, TED Talks Daily brings you the latest talks in audio format.',
    coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300&h=300',
    category: 'Education',
  },
  {
    id: 'podcast-crime-junkie',
    title: 'Crime Junkie',
    publisher: 'audiochuck',
    description: 'If you can never get enough true crime... Congratulations, you’ve found your people.',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=300&h=300',
    category: 'True Crime',
  },
];

export const PODCAST_EPISODES = [
  {
    id: 'pod-ep-1',
    title: 'How to Optimize Your Brain & Dopamine',
    artist: 'Huberman Lab',
    coverUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=300&h=300',
    durationSec: 3600,
  },
  {
    id: 'pod-ep-2',
    title: 'The AI Revolution and the Next Decade',
    artist: 'Waveform: The MKBHD Podcast',
    coverUrl: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=300&h=300',
    durationSec: 4200,
  },
  {
    id: 'pod-ep-3',
    title: 'The Headlines: Global Economic Outlook',
    artist: 'The Daily',
    coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&q=80&w=300&h=300',
    durationSec: 1800,
  },
  {
    id: 'pod-ep-4',
    title: 'Finding Flow State in Modern Life',
    artist: 'TED Talks Daily',
    coverUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=300&h=300',
    durationSec: 2100,
  },
  {
    id: 'pod-ep-5',
    title: 'Unsolved Mysteries & Forensic Breakthroughs',
    artist: 'Crime Junkie',
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=300&h=300',
    durationSec: 2700,
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

  if (activeFilter === 'podcasts') {
    // Curated podcasts in compact grid
    PODCAST_SHOWS.slice(0, 6).forEach((show) => {
      topRecentPicks.push({
        id: show.id,
        title: show.title,
        coverUrl: show.coverUrl,
        action: 'search-category',
        category: show.title,
      });
    });
  } else {
    // Music or All mode
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
                     ${item.category ? `data-action="search-category" data-category="${escapeHTML(item.category)}"` : ''}
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

  // Sections
  let sectionsHTML = '';

  if (activeFilter === 'podcasts') {
    // 1. Popular Podcast Shows Carousel
    sectionsHTML += `
      <section class="home-section">
        <h2 class="home-section-title">Popular Podcast Shows</h2>
        <div class="home-scroll">
          ${PODCAST_SHOWS.map((show, idx) => `
            <article class="home-scroll-card" data-action="search-category" data-category="${escapeHTML(show.title)}" role="button" tabindex="0">
              <div class="scroll-cover-wrap">
                <img src="${escapeHTML(show.coverUrl)}" alt="${escapeHTML(show.title)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
              </div>
              <h3 class="scroll-title">${escapeHTML(show.title)}</h3>
              <p class="scroll-subtitle">${escapeHTML(show.publisher)}</p>
            </article>
          `).join('')}
        </div>
      </section>
    `;

    // 2. Latest Podcast Episodes Carousel
    sectionsHTML += `
      <section class="home-section">
        <h2 class="home-section-title">Top Podcast Episodes</h2>
        <div class="home-scroll">
          ${PODCAST_EPISODES.map((ep, idx) => `
            <article class="home-scroll-card" data-action="search-category" data-category="${escapeHTML(ep.title)}" role="button" tabindex="0">
              <div class="scroll-cover-wrap">
                <img src="${escapeHTML(ep.coverUrl)}" alt="${escapeHTML(ep.title)}" loading="lazy" onerror="this.onerror=null;this.src='/assets/pawtify.png'" />
              </div>
              <h3 class="scroll-title">${escapeHTML(ep.title)}</h3>
              <p class="scroll-subtitle">${escapeHTML(ep.artist)}</p>
            </article>
          `).join('')}
        </div>
      </section>
    `;
  } else {
    // Music or All mode
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
  }

  return `
    <section class="page home-page-spotify">
      <!-- Top Bar: User Profile Avatar & Horizontal Filter Chips (Real-time Filtering) -->
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

      <!-- Feed Sections -->
      ${sectionsHTML}
    </section>
  `;
}
