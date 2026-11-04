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
  let text = 'Good evening';
  if (hour >= 5 && hour < 12) text = 'Good morning';
  else if (hour >= 12 && hour < 18) text = 'Good afternoon';

  const name = state.userName || 'Music Lover';
  return `${text}, ${name}`;
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

  // Exactly 4 horizontal quick-launch cards at the top of the feed
  const favCover = state.favorites?.[0]?.coverUrl || '/assets/pawtify.png';
  const heavySong = state.recentlyPlayed?.[0] ? getSongById(state.recentlyPlayed[0]) : null;
  const heavyCover = heavySong?.coverUrl || state.recommendedSongs?.[0]?.coverUrl || '/assets/pawtify.png';
  const discoverCover = state.recommendedSongs?.[1]?.coverUrl || state.recommendedSongs?.[0]?.coverUrl || '/assets/pawtify.png';
  const topMixCover = state.feedCategories?.[0]?.songs?.[0]?.coverUrl || state.recommendedSongs?.[2]?.coverUrl || '/assets/pawtify.png';

  const topFourCards = [
    {
      id: 'card-liked-songs',
      title: 'Liked Songs',
      icon: 'favorite',
      iconColor: '#1db954',
      route: '/playlist/liked',
      isLiked: true,
    },
    {
      id: 'card-heavy-rotation',
      title: 'Heavy Rotation',
      icon: 'history',
      iconColor: '#ffffff',
      route: '/playlist/history',
      songId: heavySong?.id || null,
    },
    {
      id: 'card-discover-weekly',
      title: 'Discover Weekly',
      icon: 'explore',
      iconColor: '#ffffff',
      action: 'search-category',
      category: 'Discover',
    },
    {
      id: 'card-top-mixes',
      title: 'Top Mixes',
      icon: 'queue_music',
      iconColor: '#ffffff',
      action: 'navigate',
      path: '/library',
    },
  ];

  // 4-Card Grid HTML (2 rows of 2 standard square cards, centered Material Symbols icons, no image thumbnails)
  const compactGridHTML = topFourCards
    .map((item) => {
      return `
        <article class="home-compact-card home-square-card"
                 ${item.route ? `data-route="${escapeHTML(item.route)}"` : ''}
                 ${item.path ? `data-action="navigate" data-path="${escapeHTML(item.path)}"` : ''}
                 ${item.action ? `data-action="${escapeHTML(item.action)}" data-category="${escapeHTML(item.category || '')}"` : ''}
                 ${item.songId ? `data-action="play-song" data-song-id="${escapeHTML(item.songId)}" data-source="home-compact"` : ''}
                 role="button"
                 tabindex="0"
                 aria-label="Open ${escapeHTML(item.title)}">
          <div class="home-compact-icon-wrap">
            <span class="material-symbols-rounded home-compact-icon" style="color: ${item.iconColor};">${item.icon}</span>
          </div>
          <span class="home-compact-title">${escapeHTML(item.title)}</span>
        </article>
      `;
    })
    .join('');

  // Sections (Recents carousel and Popular Shows removed per specifications)
  let sectionsHTML = '';

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

  // Feed categories (filter out any broken [object Object] categories)
  categories.forEach((cat) => {
    if (cat.songs && cat.songs.length && cat.title && typeof cat.title === 'string' && !cat.title.includes('[object')) {
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
      <!-- Dynamic Welcome Header -->
      <header class="home-top-bar">
        <div class="home-welcome-wrap">
          <button class="home-user-avatar-btn" data-route="/you" type="button" aria-label="Your Profile" title="Profile">
            <span class="material-symbols-rounded" style="font-size: 1.5rem; color: #ffffff;">account_circle</span>
          </button>
          <div class="home-welcome-text">
            <h1 class="home-greeting-title">${escapeHTML(greeting)}</h1>
          </div>
        </div>
        <div class="home-header-actions">
          <button class="icon-btn" data-action="open-settings" type="button" aria-label="Settings" title="Settings">
            <span class="material-symbols-rounded">settings</span>
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
