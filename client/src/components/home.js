import { state } from '../config/config.js';
import { renderHomeScrollCard, renderHomeGridCard } from './components.js';
import { escapeHTML } from '../utils/utils.js';
import { getSongById } from '../core/details.js';

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
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
  // Shuffle heroes
  heroCandidates = heroCandidates.sort(() => 0.5 - Math.random());

  const loaderHTML = `<div class="empty-state"><div class="spinner" style="margin:0 auto 16px;"></div><h2>Loading Music...</h2></div>`;

  let sectionsHTML = state.isLoading ? loaderHTML : '';
  if (!state.isLoading) {
    if (rec.length) {
      sectionsHTML += `
        <div class="home-section">
          <h2 class="home-section-title"><i class="fa-solid fa-star" style="margin-right:8px; color:var(--green);"></i>Recommended for You</h2>
          <div class="home-scroll">
            ${rec.map((s, i) => renderHomeScrollCard(s, i, 'recommended')).join('')}
          </div>
        </div>
      `;
    }
    categories.forEach((cat) => {
      sectionsHTML += `
        <div class="home-section">
          <h2 class="home-section-title"><i class="fa-solid fa-music" style="margin-right:8px; color:var(--green);"></i>${escapeHTML(cat.title)}</h2>
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
             <h2 class="home-section-title"><i class="fa-solid fa-clock-rotate-left" style="margin-right:8px; color:var(--green);"></i>Recently Played</h2>
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
      <div class="home-greeting" style="display:flex; justify-content:space-between; align-items:center;">
        <h1><i class="fa-solid fa-music" style="margin-right:10px; color:var(--green); font-size:0.85em;"></i>${escapeHTML(greeting)}</h1>
        <div style="display:flex; gap:8px;">
          <button class="settings-btn" data-action="open-app-info" type="button" aria-label="About Pawtify" title="About">
            <i class="fa-solid fa-gear"></i>
          </button>
        </div>
      </div>

      <div class="home-grid">
        ${state.favorites.length ? renderHomeGridCard(state.favorites[0], 'favorites') : ''}
        ${state.playlists[0]?.songs?.length ? renderHomeGridCard(state.playlists[0].songs[0], 'playlist', state.playlists[0].id) : ''}
        ${heroCandidates
          .slice(0, 4)
          .map((h) => renderHomeGridCard(h.song, h.source))
          .join('')}
      </div>

      ${sectionsHTML}
    </section>
  `;
}
