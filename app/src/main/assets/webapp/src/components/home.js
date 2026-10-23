import { state } from '../config/config.js';
import {
  renderHomeScrollCard,
  renderHomeGridCard,
  renderHomeGridSkeleton,
  renderHomeScrollSkeleton,
} from './components.js';
import { escapeHTML } from '../utils/utils.js';
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

export function renderHomePage() {
  const greeting = getGreeting();
  const rec = Array.isArray(state.recommendedSongs)
    ? state.recommendedSongs.slice(0, 10)
    : [];
  const categories = state.feedCategories || [];
  // Diverse hero cards representing different indie artists and subgenres
  let heroCandidates = [];
  categories.forEach((cat) => {
    if (cat.songs[0])
      heroCandidates.push({ song: cat.songs[0], source: cat.id });
    if (cat.songs[1])
      heroCandidates.push({ song: cat.songs[1], source: cat.id });
  });
  const hasLoadedContent =
    (categories.length > 0 && categories.some((cat) => cat.songs && cat.songs.length > 0)) ||
    rec.length > 0;

  let sectionsHTML = '';
  let gridHTML = '';

  if (state.isLoading && !hasLoadedContent) {
    gridHTML = Array(4).fill('').map(() => renderHomeGridSkeleton()).join('');

    sectionsHTML += Array(3).fill('').map(() => `
      <div class="home-section">
        <div class="skeleton skeleton-text-main" style="width: 180px; height: 22px; margin-bottom: 16px;"></div>
        <div class="home-scroll">
          ${Array(5).fill('').map(() => renderHomeScrollSkeleton()).join('')}
        </div>
      </div>
    `).join('');
  } else {
    // Collect exactly four top banner/shortcut cards
    const topShortcuts = [];
    const addedSongIds = new Set();

    if (state.favorites && state.favorites.length > 0) {
      topShortcuts.push({
        song: state.favorites[0],
        source: 'favorites',
        titleOverride: 'Liked Songs',
      });
      addedSongIds.add(state.favorites[0].id);
    }

    const activePlaylist = (state.playlists || []).find(
      (p) => p.songs && p.songs.length > 0
    );
    if (activePlaylist && activePlaylist.songs[0]) {
      const pSong = activePlaylist.songs[0];
      topShortcuts.push({
        song: pSong,
        source: 'playlist',
        playlistId: activePlaylist.id,
        titleOverride: activePlaylist.name || pSong.title,
      });
      addedSongIds.add(pSong.id);
    }

    for (const h of heroCandidates) {
      if (topShortcuts.length >= 4) break;
      if (h.song && !addedSongIds.has(h.song.id)) {
        topShortcuts.push({ song: h.song, source: h.source });
        addedSongIds.add(h.song.id);
      }
    }

    if (topShortcuts.length < 4 && rec.length) {
      for (const s of rec) {
        if (topShortcuts.length >= 4) break;
        if (s && !addedSongIds.has(s.id)) {
          topShortcuts.push({ song: s, source: 'recommended' });
          addedSongIds.add(s.id);
        }
      }
    }

    if (topShortcuts.length < 4) {
      for (const cat of categories) {
        if (topShortcuts.length >= 4) break;
        for (const s of (cat.songs || [])) {
          if (topShortcuts.length >= 4) break;
          if (s && !addedSongIds.has(s.id)) {
            topShortcuts.push({ song: s, source: cat.id });
            addedSongIds.add(s.id);
          }
        }
      }
    }

    if (topShortcuts.length < 4 && state.recentlyPlayed.length) {
      for (const id of state.recentlyPlayed) {
        if (topShortcuts.length >= 4) break;
        const s = getSongById(id);
        if (s && !addedSongIds.has(s.id)) {
          topShortcuts.push({ song: s, source: 'history' });
          addedSongIds.add(s.id);
        }
      }
    }

    if (topShortcuts.length > 0) {
      gridHTML = topShortcuts
        .slice(0, 4)
        .map((item) =>
          renderHomeGridCard(
            item.song,
            item.source,
            item.playlistId || '',
            item.titleOverride || ''
          )
        )
        .join('');
    } else {
      gridHTML = Array(4).fill('').map(() => renderHomeGridSkeleton()).join('');
    }

    if (rec.length) {
      sectionsHTML += `
        <div class="home-section">
          <h2 class="home-section-title">${state.userName ? `Made for ${escapeHTML(state.userName)}` : 'Suggested for You'}</h2>
          <div class="home-scroll">
            ${rec.map((s, i) => renderHomeScrollCard(s, i, 'recommended')).join('')}
          </div>
        </div>
      `;
    }
    categories.forEach((cat) => {
      sectionsHTML += `
        <div class="home-section">
          <h2 class="home-section-title">${escapeHTML(cat.title)}</h2>
          <div class="home-scroll">
            ${cat.songs.map((s, i) => renderHomeScrollCard(s, i, cat.id)).join('')}
          </div>
        </div>
      `;
    });
    if (state.recentlyPlayed.length) {
      const recentSongs = state.recentlyPlayed
        .map((id) => getSongById(id))
        .filter(Boolean);
      if (recentSongs.length) {
        sectionsHTML += `
           <div class="home-section">
             <h2 class="home-section-title">Recently Played</h2>
             <div class="home-scroll">
               ${recentSongs.map((s, i) => renderHomeScrollCard(s, i, 'queue')).join('')}
             </div>
           </div>
         `;
      }
    }
  }
  return `
    <section class="page">
      <div class="home-greeting">
        <h1>${escapeHTML(greeting)}</h1>
        <button class="settings-btn" data-route="/you" type="button" aria-label="Settings" title="Settings">
          <i class="fa-solid fa-gear"></i>
        </button>
      </div>

      <div class="home-grid">${gridHTML}</div>

      ${sectionsHTML}
    </section>
  `;
}
