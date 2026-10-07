'use client';

import React, { useState, useEffect } from 'react';
import { usePawtify } from '../context/PawtifyContext';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  match: (name: string) => boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', icon: 'fa-house', match: (n) => n === 'home' },
  { id: 'search', label: 'Search', icon: 'fa-magnifying-glass', match: (n) => n === 'search' },
  {
    id: 'library',
    label: 'Library',
    icon: 'fa-book-bookmark',
    match: (n) => n === 'library' || n === 'playlist',
  },
  { id: 'you', label: 'You', icon: 'fa-user', match: (n) => n === 'you' },
];

export const MobileNav: React.FC = () => {
  const { route, navigate } = usePawtify();
  const [mounted, setMounted] = useState(false);

  const getRouteIndex = (routeName: string) => {
    const idx = NAV_ITEMS.findIndex((item) => item.match(routeName));
    return idx >= 0 ? idx : 0;
  };

  const activeIndex = getRouteIndex(route.name);
  const [visualIndex, setVisualIndex] = useState(activeIndex);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep visualIndex in sync with external route changes (history popstate, direct links, playlists)
  useEffect(() => {
    setVisualIndex(activeIndex);
  }, [activeIndex]);

  const handleNav = (tabId: string, index: number) => {
    // Immediate visual feedback: pill starts gliding immediately on tap
    setVisualIndex(index);
    navigate(tabId);
  };

  return (
    <nav className="mobile-nav" role="navigation" aria-label="Bottom Navigation">
      {/* Continuous Fluid Liquid Pill Active Indicator */}
      <div
        className="mobile-nav-indicator"
        style={{
          transform: `translate3d(${visualIndex * 100}%, 0, 0)`,
          transition: mounted
            ? 'transform 0.28s cubic-bezier(0.22, 1, 0.36, 1)'
            : 'none',
        }}
        aria-hidden="true"
      />

      {NAV_ITEMS.map((item, index) => {
        const isActive = visualIndex === index;
        return (
          <button
            key={item.id}
            type="button"
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleNav(item.id, index)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="mobile-nav-icon-wrap">
              <i className={`fa-solid ${item.icon}`} />
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
