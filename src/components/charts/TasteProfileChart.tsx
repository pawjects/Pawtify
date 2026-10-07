'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Song, TasteDistributionItem } from '@/types/music';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';

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

const GENRE_RULES = [
  {
    name: 'Bollywood & Hindi',
    keywords: [
      'bollywood', 'hindi', 'arijit', 'pritam', 'shreya', 'kumar', 'sonu',
      'armaan', 'stree', 'bhediya', 'jawan', 'pathaan', 'neha kakkar', 'jubin',
      'atif', 't-series', 'yash raj', 'amitabh'
    ],
  },
  {
    name: 'Punjabi & Desi',
    keywords: [
      'punjabi', 'diljit', 'sidhu', 'ap dhillon', 'shubh', 'karan aujla',
      'bhangra', 'ammy virk', 'harrdy', 'badshah', 'raftaar', 'yo yo honey',
      'jassi', 'gurdas', 'parmish'
    ],
  },
  {
    name: 'Lo-Fi & Ambient',
    keywords: [
      'lofi', 'lo-fi', 'chill', 'sleep', 'study', 'relax', 'ambient',
      'peaceful', 'calm', 'soft', 'rain', 'night', 'meditation', 'aesthetic'
    ],
  },
  {
    name: 'Pop & Melodic',
    keywords: [
      'pop', 'taylor', 'ed sheeran', 'ariana', 'dua lipa', 'billie',
      'the weeknd', 'bieber', 'coldplay', 'shawn mendes', 'maroon 5',
      'bruno mars', 'charlie puth', 'adele', 'katy perry', 'olivia rodrigo'
    ],
  },
  {
    name: 'Hip-Hop & Rap',
    keywords: [
      'hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'mc stan', 'divine',
      'emiway', 'drake', 'kendrick', 'eminem', 'travis', 'post malone',
      'kanye', '21 savage', 'future', 'j. cole'
    ],
  },
  {
    name: 'Indie & Acoustic',
    keywords: [
      'acoustic', 'indie', 'folk', 'unplugged', 'prateek kuhad', 'anuv jain',
      'jasleen', 'when chai met toast', 'zaeden', 'vance joy', 'lumineers',
      'fingerstyle', 'guitar ballad'
    ],
  },
  {
    name: 'Electronic & Dance',
    keywords: [
      'electronic', 'dance', 'edm', 'remix', 'house', 'techno', 'alan walker',
      'martin garrix', 'marshmello', 'chainsmokers', 'david guetta', 'dj',
      'tiësto', 'avicii', 'electro', 'club'
    ],
  },
  {
    name: 'Rock & Alternative',
    keywords: [
      'rock', 'metal', 'punk', 'guitar', 'band', 'linkin park', 'queen',
      'nirvana', 'imagine dragons', 'green day', 'metallica', 'bon jovi',
      'arctic monkeys', 'radiohead', 'red hot'
    ],
  },
  {
    name: 'Classical & Score',
    keywords: [
      'classical', 'instrumental', 'piano', 'violin', 'orchestra', 'symphony',
      'theme', 'soundtrack', 'ost', 'score', 'raga', 'carnatic', 'beethoven',
      'mozart', 'hans zimmer', 'ludovico', 'yiruma'
    ],
  },
  {
    name: 'R&B, Soul & Jazz',
    keywords: [
      'r&b', 'soul', 'blues', 'jazz', 'groove', 'sza', 'giveon',
      'frank ocean', 'daniel caesar', 'leon bridges', 'norah jones', 'smooth'
    ],
  },
  {
    name: 'Devotional & Spiritual',
    keywords: [
      'bhajan', 'aarti', 'mantra', 'krishna', 'shiva', 'hanuman',
      'devotional', 'sufi', 'qawwali', 'nusrat', 'rahmat', 'spiritual'
    ],
  },
];

function cleanArtistName(raw?: string): string {
  if (!raw || typeof raw !== 'string') return 'Unknown Artist';
  let name = raw.trim();
  name = name.replace(/ - Topic$/i, '');
  name = name.replace(/ Official( Channel)?$/i, '');
  name = name.replace(/ VEVO$/i, '');
  const splitMatch = name.split(/\s*(?:feat\.|ft\.|&|,|\bx\b)\s*/i);
  if (splitMatch && splitMatch[0] && splitMatch[0].trim().length > 1) {
    return splitMatch[0].trim();
  }
  return name.trim() || 'Unknown Artist';
}

function detectSongGenre(song: Song): string {
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

export function TasteProfileChart() {
  const { favorites, playlists, feedCategories, navigate, setSearchQuery, runSearch } = useLibrary();
  const { queue } = usePlayer();

  const [mode, setMode] = useState<'artists' | 'genres'>('artists');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Pool all library songs
  const allLibrarySongs = useMemo(() => {
    const map = new Map<string, Song>();
    favorites.forEach((s) => s?.id && map.set(s.id, s));
    playlists.forEach((p) => p.songs.forEach((s) => s?.id && map.set(s.id, s)));
    queue.forEach((s) => s?.id && map.set(s.id, s));

    // Fallback to feed categories if library is small
    if (map.size < 3) {
      feedCategories.forEach((cat) => cat.songs.forEach((s) => s?.id && map.set(s.id, s)));
    }
    return Array.from(map.values());
  }, [favorites, playlists, queue, feedCategories]);

  // Compute distribution
  const chartData: TasteDistributionItem[] = useMemo(() => {
    if (!allLibrarySongs.length) return [];
    const counts = new Map<string, number>();
    const samples = new Map<string, string[]>();

    allLibrarySongs.forEach((song) => {
      const name = mode === 'artists' ? cleanArtistName(song.artist) : detectSongGenre(song);
      counts.set(name, (counts.get(name) || 0) + 1);
      if (!samples.has(name)) samples.set(name, []);
      const sList = samples.get(name)!;
      if (sList.length < 3) {
        sList.push(song.title);
      }
    });

    const sorted: Array<{ name: string; count: number; sampleTracks: string[]; isOther?: boolean }> =
      Array.from(counts.entries())
        .map(([name, count]) => ({
          name,
          count,
          sampleTracks: samples.get(name) || [],
        }))
        .sort((a, b) => b.count - a.count);

    const total = allLibrarySongs.length;
    const top = sorted.slice(0, 7);
    const others = sorted.slice(7);

    if (others.length > 0) {
      const othersCount = others.reduce((sum, item) => sum + item.count, 0);
      const otherSamples: string[] = [];
      others.forEach((o) => {
        o.sampleTracks.forEach((t) => {
          if (otherSamples.length < 3) otherSamples.push(t);
        });
      });
      top.push({
        name: mode === 'artists' ? 'Other Artists' : 'Other Genres',
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
  }, [allLibrarySongs, mode]);

  // Render D3 Donut Chart
  const renderChart = useCallback(() => {
    const container = containerRef.current;
    if (!container || !chartData.length) return;

    // Clear previous
    d3.select(container).selectAll('*').remove();

    const rect = container.getBoundingClientRect();
    const rawSize = Math.min(rect.width || 320, 380);
    const size = Math.max(260, rawSize);
    const width = size;
    const height = size;
    const radius = size / 2 - 14;
    const innerRadius = radius * 0.62;
    const hoverRadius = radius + 6;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('id', 'you-d3-chart-svg')
      .attr('role', 'img')
      .attr('aria-label', `Music ${mode} distribution chart`)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', '100%')
      .style('overflow', 'visible')
      .style('display', 'block');

    svgRef.current = svg.node();

    const defs = svg.append('defs');
    const filter = defs
      .append('filter')
      .attr('id', 'd3-glow-filter')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    filter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'blur');
    filter.append('feComposite').attr('in', 'SourceGraphic').attr('in2', 'blur').attr('operator', 'over');

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3
      .pie<TasteDistributionItem>()
      .value((d) => d.count)
      .sort(null)
      .padAngle(0.035);

    const arc = d3
      .arc<d3.PieArcDatum<TasteDistributionItem>>()
      .innerRadius(innerRadius)
      .outerRadius(radius)
      .cornerRadius(4);

    const arcHover = d3
      .arc<d3.PieArcDatum<TasteDistributionItem>>()
      .innerRadius(innerRadius - 2)
      .outerRadius(hoverRadius)
      .cornerRadius(6);

    const arcs = g
      .selectAll('.chart-arc')
      .data(pie(chartData))
      .enter()
      .append('g')
      .attr('class', 'chart-arc')
      .style('cursor', 'pointer');

    arcs
      .append('path')
      .attr('d', (d) => arc(d))
      .attr('fill', (d) => d.data.color)
      .attr('stroke', 'rgba(0,0,0,0.5)')
      .attr('stroke-width', 2)
      .style('transition', 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)')
      .on('mouseenter', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', () => arcHover(d))
          .attr('filter', 'url(#d3-glow-filter)');
        setHoveredIndex(d.index);
      })
      .on('mouseleave', function (event, d) {
        d3.select(this)
          .transition()
          .duration(250)
          .attr('d', () => arc(d))
          .attr('filter', null);
        setHoveredIndex(null);
      })
      .on('click', function (event, d) {
        if (!d.data.isOther) {
          setSearchQuery(d.data.name);
          navigate('/search');
          runSearch(d.data.name);
        }
      });

    // Center display
    const centerGroup = g.append('g').attr('class', 'center-info').attr('text-anchor', 'middle');

    const activeItem = hoveredIndex !== null ? chartData[hoveredIndex] : chartData[0];
    if (activeItem) {
      centerGroup
        .append('text')
        .attr('dy', '-4')
        .attr('fill', '#ffffff')
        .attr('font-size', '1.6rem')
        .attr('font-weight', '800')
        .text(`${activeItem.percent}%`);

      centerGroup
        .append('text')
        .attr('dy', '18')
        .attr('fill', activeItem.color)
        .attr('font-size', '0.85rem')
        .attr('font-weight', '600')
        .text(activeItem.name.length > 16 ? activeItem.name.slice(0, 14) + '...' : activeItem.name);
    }
  }, [chartData, hoveredIndex, mode, navigate, runSearch, setSearchQuery]);

  useEffect(() => {
    renderChart();

    const handleResize = () => {
      renderChart();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [renderChart]);

  const handleLegendClick = (item: TasteDistributionItem) => {
    if (!item.isOther) {
      setSearchQuery(item.name);
      navigate('/search');
      runSearch(item.name);
    }
  };

  return (
    <div className="you-section" id="you-chart-section">
      <div
        className="you-section-head you-chart-header"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}
      >
        <div>
          <h2 className="you-section-title" id="you-chart-title">
            Taste profile
          </h2>
          <span className="you-section-sub">Artists and genres in your library</span>
        </div>
        <div className="you-chart-toggle-group" id="you-chart-mode-toggles">
          <button
            className={`you-chart-mode-btn ${mode === 'artists' ? 'active' : ''}`}
            onClick={() => setMode('artists')}
            type="button"
          >
            Artists
          </button>
          <button
            className={`you-chart-mode-btn ${mode === 'genres' ? 'active' : ''}`}
            onClick={() => setMode('genres')}
            type="button"
          >
            Genres
          </button>
        </div>
      </div>

      <div className="you-glass-card you-chart-card" id="you-chart-card">
        <div className="you-chart-layout" id="you-chart-layout">
          {/* D3 Visual Stage */}
          <div className="you-chart-visual-stage" id="you-chart-visual-stage">
            <div className="you-chart-svg-container" id="you-chart-container" ref={containerRef}></div>
          </div>

          {/* Interactive Legend & Details List */}
          <div className="you-chart-legend-stage" id="you-chart-legend-stage">
            <div className="you-chart-meta-summary" id="you-chart-meta-summary">
              <span>{allLibrarySongs.length} tracks analyzed</span>
              <span>{chartData.length} distinct {mode}</span>
            </div>
            <div className="you-chart-legend-list" id="you-chart-legend-list">
              {chartData.map((item, idx) => (
                <div
                  key={item.name + idx}
                  className={`you-chart-legend-item ${hoveredIndex === idx ? 'hovered' : ''}`}
                  onClick={() => handleLegendClick(item)}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: item.isOther ? 'default' : 'pointer' }}
                >
                  <div
                    className="you-chart-legend-indicator"
                    style={{ background: item.color }}
                  ></div>
                  <div className="you-chart-legend-info">
                    <div className="you-chart-legend-title">{item.name}</div>
                    <div className="you-chart-legend-samples">
                      {item.sampleTracks.map((track, tIdx) => (
                        <span key={tIdx} className="you-chart-legend-sample-pill">
                          {track}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="you-chart-legend-badge">{item.percent}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
