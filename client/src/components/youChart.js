import { state } from '../config/config.js';
import { escapeHTML } from '../utils/utils.js';
import { navigate } from '../config/router.js';

let chartResizeObserver = null;
let currentChartMode = 'artists'; // 'artists' | 'genres'
let hoveredSliceIndex = null;
let useSampleMix = false;

// Color palette specifically calibrated for AMOLED dark glass UI
const CHART_PALETTE = [
  '#10b981', // Emerald Green (Pawtify signature)
  '#06b6d4', // Electric Cyan
  '#8b5cf6', // Vivid Purple
  '#f59e0b', // Warm Amber
  '#f43f5e', // Coral Rose
  '#3b82f6', // Bright Blue
  '#ec4899', // Pink Accent
  '#14b8a6', // Teal
  '#f97316', // Bright Orange
  '#a855f7', // Violet
  '#64748b', // Slate Neutral (Others)
];

// Genre detection rule patterns
const GENRE_RULES = [
  {
    name: 'Bollywood & Hindi',
    keywords: ['bollywood', 'hindi', 'arijit', 'pritam', 'shreya', 'kumar', 'sonu', 'armaan', 'stree', 'bhediya', 'jawan', 'pathaan', 'neha kakkar', 'jubin', 'atif', 't-series', 'yash raj', 'amitabh'],
  },
  {
    name: 'Punjabi & Desi',
    keywords: ['punjabi', 'diljit', 'sidhu', 'ap dhillon', 'shubh', 'karan aujla', 'bhangra', 'ammy virk', 'harrdy', 'badshah', 'raftaar', 'yo yo honey', 'jassi', 'gurdas', 'parmish'],
  },
  {
    name: 'Lo-Fi & Ambient',
    keywords: ['lofi', 'lo-fi', 'chill', 'sleep', 'study', 'relax', 'ambient', 'peaceful', 'calm', 'soft', 'rain', 'night', 'meditation', 'aesthetic'],
  },
  {
    name: 'Pop & Melodic',
    keywords: ['pop', 'taylor', 'ed sheeran', 'ariana', 'dua lipa', 'billie', 'the weeknd', 'bieber', 'coldplay', 'shawn mendes', 'maroon 5', 'bruno mars', 'charlie puth', 'adele', 'katy perry', 'olivia rodrigo'],
  },
  {
    name: 'Hip-Hop & Rap',
    keywords: ['hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'mc stan', 'divine', 'emiway', 'drake', 'kendrick', 'eminem', 'travis', 'post malone', 'kanye', '21 savage', 'future', 'j. cole'],
  },
  {
    name: 'Indie & Acoustic',
    keywords: ['acoustic', 'indie', 'folk', 'unplugged', 'prateek kuhad', 'anuv jain', 'jasleen', 'when chai met toast', 'zaeden', 'vance joy', 'lumineers', 'fingerstyle', 'guitar ballad'],
  },
  {
    name: 'Electronic & Dance',
    keywords: ['electronic', 'dance', 'edm', 'remix', 'house', 'techno', 'alan walker', 'martin garrix', 'marshmello', 'chainsmokers', 'david guetta', 'dj', 'tiësto', 'avicii', 'electro', 'club'],
  },
  {
    name: 'Rock & Alternative',
    keywords: ['rock', 'metal', 'punk', 'guitar', 'band', 'linkin park', 'queen', 'nirvana', 'imagine dragons', 'green day', 'metallica', 'bon jovi', 'arctic monkeys', 'radiohead', 'red hot'],
  },
  {
    name: 'Classical & Score',
    keywords: ['classical', 'instrumental', 'piano', 'violin', 'orchestra', 'symphony', 'theme', 'soundtrack', 'ost', 'score', 'raga', 'carnatic', 'beethoven', 'mozart', 'hans zimmer', 'ludovico', 'yiruma'],
  },
  {
    name: 'R&B, Soul & Jazz',
    keywords: ['r&b', 'soul', 'blues', 'jazz', 'groove', 'sza', 'giveon', 'frank ocean', 'daniel caesar', 'leon bridges', 'norah jones', 'smooth'],
  },
  {
    name: 'Devotional & Spiritual',
    keywords: ['bhajan', 'aarti', 'mantra', 'krishna', 'shiva', 'hanuman', 'devotional', 'sufi', 'qawwali', 'nusrat', 'rahmat', 'spiritual'],
  },
];

/**
 * Collect deduplicated library songs from favorites, playlists, and recently played.
 */
export function getLibrarySongs(forceSample = false) {
  const songsMap = new Map();

  const addSongs = (list) => {
    if (!Array.isArray(list)) return;
    list.forEach((s) => {
      if (s && s.id && !songsMap.has(s.id)) {
        songsMap.set(s.id, s);
      }
    });
  };

  if (!forceSample) {
    addSongs(state.favorites);
    if (Array.isArray(state.playlists)) {
      state.playlists.forEach((p) => addSongs(p.songs));
    }
    addSongs(state.recentlyPlayed);
  }

  // If user has no or very few songs, or forceSample is requested, include starter catalog
  const isSample = forceSample || songsMap.size < 3;
  if (isSample) {
    addSongs(state.trendingSongs);
    addSongs(state.melodicIndieSongs);
    addSongs(state.lofiSongs);
    addSongs(state.acousticSongs);
    addSongs(state.indieBandsSongs);
  }

  return {
    songs: Array.from(songsMap.values()),
    isSample,
  };
}

/**
 * Clean artist string and extract primary artist
 */
function cleanArtistName(raw) {
  if (!raw || typeof raw !== 'string') return 'Unknown Artist';
  let name = raw.trim();
  // Remove channel badges, "Topic", "Official", etc.
  name = name.replace(/ - Topic$/i, '');
  name = name.replace(/ Official( Channel)?$/i, '');
  name = name.replace(/ VEVO$/i, '');
  // Split multiple collaborative artists to primary
  const splitMatch = name.split(/\s*(?:feat\.|ft\.|&|,|\bx\b)\s*/i);
  if (splitMatch && splitMatch[0] && splitMatch[0].trim().length > 1) {
    return splitMatch[0].trim();
  }
  return name.trim() || 'Unknown Artist';
}

/**
 * Group library songs by Artist
 */
export function getArtistDistribution(songs) {
  if (!songs || songs.length === 0) return [];
  const counts = new Map();
  const samples = new Map();

  songs.forEach((song) => {
    const artist = cleanArtistName(song.artist || song.uploaderName);
    counts.set(artist, (counts.get(artist) || 0) + 1);
    if (!samples.has(artist)) samples.set(artist, []);
    if (samples.get(artist).length < 3) {
      samples.get(artist).push(song.title);
    }
  });

  const sorted = Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      sampleTracks: samples.get(name) || [],
    }))
    .sort((a, b) => b.count - a.count);

  const total = songs.length;
  // Take top 7, combine rest into "Other Artists"
  const top = sorted.slice(0, 7);
  const others = sorted.slice(7);

  if (others.length > 0) {
    const othersCount = others.reduce((sum, item) => sum + item.count, 0);
    const otherSamples = [];
    others.forEach((o) => {
      o.sampleTracks.forEach((t) => {
        if (otherSamples.length < 3) otherSamples.push(t);
      });
    });
    top.push({
      name: 'Other Artists',
      count: othersCount,
      sampleTracks: otherSamples,
      isOther: true,
    });
  }

  return top.map((item, idx) => ({
    ...item,
    percent: Math.round((item.count / total) * 100) || (item.count > 0 ? 1 : 0),
    color: CHART_PALETTE[idx % CHART_PALETTE.length],
  }));
}

/**
 * Detect genre for a song based on title, artist, and genre rules
 */
function detectSongGenre(song) {
  if (song.genre && typeof song.genre === 'string' && song.genre.trim()) {
    return song.genre.trim();
  }
  if (song.category && typeof song.category === 'string' && song.category.trim()) {
    return song.category.trim();
  }

  const textToSearch = `${song.title || ''} ${song.artist || ''} ${song.uploaderName || ''}`.toLowerCase();

  for (const rule of GENRE_RULES) {
    for (const kw of rule.keywords) {
      if (textToSearch.includes(kw)) {
        return rule.name;
      }
    }
  }

  return 'Pop & Melodic';
}

/**
 * Group library songs by Genre
 */
export function getGenreDistribution(songs) {
  if (!songs || songs.length === 0) return [];
  const counts = new Map();
  const samples = new Map();

  songs.forEach((song) => {
    const genre = detectSongGenre(song);
    counts.set(genre, (counts.get(genre) || 0) + 1);
    if (!samples.has(genre)) samples.set(genre, []);
    if (samples.get(genre).length < 3) {
      samples.get(genre).push(song.title);
    }
  });

  const sorted = Array.from(counts.entries())
    .map(([name, count]) => ({
      name,
      count,
      sampleTracks: samples.get(name) || [],
    }))
    .sort((a, b) => b.count - a.count);

  const total = songs.length;
  // Take top 7, group rest into "Other Genres"
  const top = sorted.slice(0, 7);
  const others = sorted.slice(7);

  if (others.length > 0) {
    const othersCount = others.reduce((sum, item) => sum + item.count, 0);
    const otherSamples = [];
    others.forEach((o) => {
      o.sampleTracks.forEach((t) => {
        if (otherSamples.length < 3) otherSamples.push(t);
      });
    });
    top.push({
      name: 'Other Genres',
      count: othersCount,
      sampleTracks: otherSamples,
      isOther: true,
    });
  }

  return top.map((item, idx) => ({
    ...item,
    percent: Math.round((item.count / total) * 100) || (item.count > 0 ? 1 : 0),
    color: CHART_PALETTE[idx % CHART_PALETTE.length],
  }));
}

/**
 * Draw interactive D3 Donut Chart
 */
export function drawD3Chart(containerEl, data, totalCount, mode, isSample) {
  const d3 = window.d3;
  if (!d3 || !containerEl) return;

  // Clear previous chart render
  containerEl.innerHTML = '';

  const rect = containerEl.getBoundingClientRect();
  const rawSize = Math.min(rect.width || 320, 380);
  const size = Math.max(260, rawSize);
  const width = size;
  const height = size;
  const radius = size / 2 - 14;
  const innerRadius = radius * 0.62;
  const hoverRadius = radius + 6;

  // Create SVG element
  const svg = d3
    .select(containerEl)
    .append('svg')
    .attr('id', 'you-d3-chart-svg')
    .attr('role', 'img')
    .attr('aria-label', `Music ${mode} distribution chart`)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', '100%')
    .style('overflow', 'visible')
    .style('display', 'block');

  // SVG Definitions: Filter glow and subtle radial gradients
  const defs = svg.append('defs');

  // Subtle glow filter for hovered slices
  const filter = defs.append('filter').attr('id', 'd3-glow-filter').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
  filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
  filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

  const g = svg
    .append('g')
    .attr('id', 'you-d3-chart-group')
    .attr('transform', `translate(${width / 2}, ${height / 2})`);

  // Background subtle track ring
  g.append('circle')
    .attr('r', (radius + innerRadius) / 2)
    .attr('fill', 'none')
    .attr('stroke', 'rgba(255, 255, 255, 0.04)')
    .attr('stroke-width', radius - innerRadius);

  // D3 Pie & Arc generators
  const pie = d3
    .pie()
    .value((d) => d.count)
    .sort(null)
    .padAngle(0.035);

  const arc = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(radius)
    .cornerRadius(5);

  const arcHover = d3
    .arc()
    .innerRadius(innerRadius - 3)
    .outerRadius(hoverRadius)
    .cornerRadius(6);

  const pieData = pie(data);

  // Create Center Text Group
  const centerG = g.append('g').attr('id', 'you-d3-center-info').attr('text-anchor', 'middle').style('pointer-events', 'none');

  const centerPrimary = centerG
    .append('text')
    .attr('id', 'you-d3-center-primary')
    .attr('dy', '-4px')
    .attr('fill', 'var(--text)')
    .style('font-size', '1.65rem')
    .style('font-weight', '800')
    .style('font-family', 'var(--font-display)')
    .style('letter-spacing', '-0.02em')
    .text(String(totalCount));

  const centerSecondary = centerG
    .append('text')
    .attr('id', 'you-d3-center-secondary')
    .attr('dy', '18px')
    .attr('fill', 'var(--muted)')
    .style('font-size', '0.75rem')
    .style('font-weight', '600')
    .style('text-transform', 'uppercase')
    .style('letter-spacing', '0.06em')
    .text(isSample ? 'Sample Tracks' : 'Library Songs');

  const centerTertiary = centerG
    .append('text')
    .attr('id', 'you-d3-center-tertiary')
    .attr('dy', '34px')
    .attr('fill', 'var(--green)')
    .style('font-size', '0.6875rem')
    .style('font-weight', '700')
    .text(`${data.length} ${mode === 'artists' ? 'Artists' : 'Genres'}`);

  // Create Slices
  const slices = g
    .selectAll('.you-d3-slice')
    .data(pieData)
    .enter()
    .append('path')
    .attr('class', 'you-d3-slice')
    .attr('id', (d, i) => `you-d3-slice-${i}`)
    .attr('fill', (d) => d.data.color)
    .attr('stroke', 'rgba(10, 14, 12, 0.8)')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .style('transition', 'opacity 0.2s ease, filter 0.2s ease')
    .attr('d', arc);

  // Entrance transition animation
  slices
    .transition()
    .duration(700)
    .attrTween('d', function (d) {
      const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
      return function (t) {
        return arc(interpolate(t));
      };
    });

  // Tooltip DOM element
  let tooltip = document.getElementById('you-chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'you-chart-tooltip';
    tooltip.className = 'you-chart-floating-tooltip';
    document.body.appendChild(tooltip);
  }

  // Hover & Interaction Handlers
  function handleHighlight(targetIndex) {
    hoveredSliceIndex = targetIndex;
    const d = pieData[targetIndex];
    if (!d) return;

    // Expand highlighted slice and dim siblings
    slices
      .transition()
      .duration(200)
      .attr('d', (s, i) => (i === targetIndex ? arcHover(s) : arc(s)))
      .style('opacity', (s, i) => (i === targetIndex ? 1 : 0.35))
      .style('filter', (s, i) => (i === targetIndex ? 'url(#d3-glow-filter)' : 'none'));

    // Highlight legend item
    document.querySelectorAll('.you-legend-item').forEach((el, i) => {
      if (i === targetIndex) el.classList.add('highlighted');
      else el.classList.remove('highlighted');
    });

    // Update center content
    const nameDisplay = d.data.name.length > 14 ? d.data.name.slice(0, 12) + '…' : d.data.name;
    centerPrimary.text(`${d.data.percent}%`).attr('fill', d.data.color);
    centerSecondary.text(nameDisplay);
    centerTertiary.text(`${d.data.count} track${d.data.count === 1 ? '' : 's'}`);
  }

  function handleReset() {
    hoveredSliceIndex = null;
    slices
      .transition()
      .duration(200)
      .attr('d', arc)
      .style('opacity', 1)
      .style('filter', 'none');

    document.querySelectorAll('.you-legend-item').forEach((el) => {
      el.classList.remove('highlighted');
    });

    centerPrimary.text(String(totalCount)).attr('fill', 'var(--text)');
    centerSecondary.text(isSample ? 'Sample Tracks' : 'Library Songs');
    centerTertiary.text(`${data.length} ${mode === 'artists' ? 'Artists' : 'Genres'}`);

    if (tooltip) tooltip.classList.remove('visible');
  }

  slices
    .on('mouseenter', function (event, d) {
      const idx = pieData.indexOf(d);
      handleHighlight(idx);

      if (tooltip) {
        const samplesHtml = d.data.sampleTracks && d.data.sampleTracks.length
          ? `<div class="you-tt-tracks">
              <span class="you-tt-tracks-lbl">Sample songs:</span>
              ${d.data.sampleTracks.map((t) => `<div class="you-tt-song"><i class="fa-solid fa-play"></i> ${escapeHTML(t)}</div>`).join('')}
             </div>`
          : '';

        tooltip.innerHTML = `
          <div class="you-tt-head">
            <span class="you-tt-dot" style="background:${d.data.color};"></span>
            <strong>${escapeHTML(d.data.name)}</strong>
          </div>
          <div class="you-tt-stat">
            <span>${d.data.count} track${d.data.count === 1 ? '' : 's'}</span>
            <span class="you-tt-badge" style="background:${d.data.color}22; color:${d.data.color}; border:1px solid ${d.data.color}44;">${d.data.percent}%</span>
          </div>
          ${samplesHtml}
          <div class="you-tt-hint"><i class="fa-solid fa-arrow-up-right-from-square"></i> Click to search songs</div>
        `;
        tooltip.classList.add('visible');
      }
    })
    .on('mousemove', function (event) {
      if (tooltip) {
        const x = event.clientX;
        const y = event.clientY;
        const padding = 16;
        let left = x + padding;
        let top = y + padding;

        const ttWidth = 220;
        const ttHeight = 140;
        if (left + ttWidth > window.innerWidth) {
          left = x - ttWidth - padding;
        }
        if (top + ttHeight > window.innerHeight) {
          top = y - ttHeight - padding;
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
      }
    })
    .on('mouseleave', function () {
      handleReset();
    })
    .on('click', function (event, d) {
      if (d.data.name && !d.data.isOther) {
        if (tooltip) tooltip.classList.remove('visible');
        state.searchQuery = d.data.name;
        state.pendingSearchQuery = d.data.name;
        navigate('/search');
      }
    });

  // Attach hover handlers for legend items outside SVG
  window.__pawtifyHighlightSlice = handleHighlight;
  window.__pawtifyResetSlice = handleReset;
}

/**
 * Render Legend List and Summary Strip
 */
function renderLegendAndSummary(legendEl, summaryEl, data, totalCount, mode, isSample) {
  if (!legendEl || !summaryEl) return;

  const topItem = data[0] || null;
  const topPercent = topItem ? topItem.percent : 0;
  const dominantName = topItem ? topItem.name : 'Diverse';

  // Summary Strip
  summaryEl.innerHTML = `
    <div class="you-chart-summary-strip">
      <div class="you-summary-stat">
        <span class="you-summary-lbl">Analyzed Collection</span>
        <strong class="you-summary-val">${totalCount} <span style="font-size:0.75rem; font-weight:500; color:var(--muted);">Tracks</span></strong>
      </div>
      <div class="you-summary-stat">
        <span class="you-summary-lbl">Dominant ${mode === 'artists' ? 'Artist' : 'Genre'}</span>
        <strong class="you-summary-val" style="color:${topItem ? topItem.color : 'var(--green)'};">
          ${escapeHTML(dominantName)} <span style="font-size:0.75rem; font-weight:600; opacity:0.8;">(${topPercent}%)</span>
        </strong>
      </div>
      <div class="you-summary-stat">
        <span class="you-summary-lbl">Diversity Index</span>
        <strong class="you-summary-val" style="color:var(--green);">
          ${data.length > 5 ? 'High Variety' : 'Specialized'}
        </strong>
      </div>
    </div>
    ${
      isSample
        ? `<div class="you-sample-note">
             <i class="fa-solid fa-circle-info" style="color:var(--green);"></i>
             <span>Showing starter catalog distribution. Heart or add songs to playlists to personalize your taste graph!</span>
           </div>`
        : ''
    }
  `;

  // Legend List
  legendEl.innerHTML = data
    .map(
      (item, idx) => `
      <div 
        class="you-legend-item" 
        id="you-legend-item-${idx}" 
        data-index="${idx}"
        data-name="${escapeHTML(item.name)}"
        role="button"
        tabindex="0"
      >
        <div class="you-legend-swatch" style="background:${item.color}; box-shadow: 0 0 8px ${item.color}66;"></div>
        <div class="you-legend-info">
          <div class="you-legend-name-row">
            <span class="you-legend-name">${escapeHTML(item.name)}</span>
            <span class="you-legend-count">${item.count} track${item.count === 1 ? '' : 's'}</span>
          </div>
          <div class="you-legend-bar-wrap">
            <div class="you-legend-bar" style="width:${item.percent}%; background:${item.color};"></div>
          </div>
        </div>
        <span class="you-legend-badge" style="color:${item.color}; border:1px solid ${item.color}33; background:${item.color}14;">
          ${item.percent}%
        </span>
      </div>
    `
    )
    .join('');

  // Attach hover and click events to legend items
  const items = legendEl.querySelectorAll('.you-legend-item');
  items.forEach((itemEl) => {
    const idx = Number(itemEl.dataset.index);
    const name = itemEl.dataset.name;

    itemEl.addEventListener('mouseenter', () => {
      if (typeof window.__pawtifyHighlightSlice === 'function') {
        window.__pawtifyHighlightSlice(idx);
      }
    });

    itemEl.addEventListener('mouseleave', () => {
      if (typeof window.__pawtifyResetSlice === 'function') {
        window.__pawtifyResetSlice();
      }
    });

    itemEl.addEventListener('click', () => {
      if (name && !name.startsWith('Other')) {
        state.searchQuery = name;
        state.pendingSearchQuery = name;
        navigate('/search');
      }
    });

    itemEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        itemEl.click();
      }
    });
  });
}

/**
 * Main Controller to Render or Update the D3 Chart
 */
export function updateYouChart(mode = currentChartMode, forceSample = useSampleMix) {
  currentChartMode = mode;
  useSampleMix = forceSample;

  const container = document.getElementById('you-chart-container');
  const legendEl = document.getElementById('you-chart-legend-list');
  const summaryEl = document.getElementById('you-chart-meta-summary');
  if (!container || !legendEl || !summaryEl) return;

  // Update button active states
  const btnArtists = document.getElementById('you-chart-toggle-artists');
  const btnGenres = document.getElementById('you-chart-toggle-genres');
  if (btnArtists && btnGenres) {
    if (mode === 'artists') {
      btnArtists.classList.add('active');
      btnGenres.classList.remove('active');
    } else {
      btnGenres.classList.add('active');
      btnArtists.classList.remove('active');
    }
  }

  // Get data
  const { songs, isSample } = getLibrarySongs(forceSample);
  const chartData = mode === 'artists' ? getArtistDistribution(songs) : getGenreDistribution(songs);

  // If D3 isn't yet attached on window, poll briefly
  if (!window.d3) {
    container.innerHTML = `
      <div class="you-chart-loading">
        <i class="fa-solid fa-spinner fa-spin" style="font-size:1.5rem; color:var(--green);"></i>
        <span>Loading chart visualization...</span>
      </div>
    `;
    setTimeout(() => updateYouChart(mode, forceSample), 60);
    return;
  }

  // Draw chart and legend
  drawD3Chart(container, chartData, songs.length, mode, isSample);
  renderLegendAndSummary(legendEl, summaryEl, chartData, songs.length, mode, isSample);
}

/**
 * Initialize You Page D3 Chart with ResizeObserver and Event Listeners
 */
export function initYouChart() {
  const container = document.getElementById('you-chart-container');
  if (!container) return;

  // Clean up previous observer if active
  if (chartResizeObserver) {
    chartResizeObserver.disconnect();
    chartResizeObserver = null;
  }

  // Initial draw
  updateYouChart(currentChartMode, useSampleMix);

  // Debounced ResizeObserver for fluid responsiveness
  let resizeTimeout = null;
  chartResizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.contentRect.width > 0) {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (document.getElementById('you-chart-container')) {
            updateYouChart(currentChartMode, useSampleMix);
          }
        }, 120);
      }
    }
  });

  chartResizeObserver.observe(container);

  // Bind Mode Toggle buttons
  const toggleGroup = document.getElementById('you-chart-mode-toggles');
  if (toggleGroup) {
    toggleGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      e.preventDefault();
      const targetMode = btn.dataset.mode;
      if (targetMode && targetMode !== currentChartMode) {
        updateYouChart(targetMode, useSampleMix);
      }
    });
  }
}

/**
 * Cleanup function to disconnect ResizeObserver and remove tooltips when navigating away
 */
export function teardownYouChart() {
  if (chartResizeObserver) {
    chartResizeObserver.disconnect();
    chartResizeObserver = null;
  }
  const tooltip = document.getElementById('you-chart-tooltip');
  if (tooltip) {
    tooltip.remove();
  }
}
