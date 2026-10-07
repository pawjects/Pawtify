'use client';

import React from 'react';
import { useLibrary } from '@/context/LibraryContext';

export function MobileNav() {
  const { route, navigate } = useLibrary();

  let activeIndex = 0;
  if (route.name === 'home') activeIndex = 0;
  else if (route.name === 'search') activeIndex = 1;
  else if (route.name === 'library' || route.name === 'playlist') activeIndex = 2;
  else if (route.name === 'you') activeIndex = 3;

  return (
    <nav
      className="mobile-nav"
      aria-label="Mobile navigation"
      style={{ '--active-tab-index': activeIndex } as React.CSSProperties}
    >
      <div className="mobile-nav-indicator" id="mobile-nav-indicator"></div>
      <button
        className={`mobile-nav-item ${activeIndex === 0 ? 'active' : ''}`}
        onClick={() => navigate('/')}
        type="button"
      >
        <i className="fa-solid fa-house"></i>
        <span>Home</span>
      </button>
      <button
        className={`mobile-nav-item ${activeIndex === 1 ? 'active' : ''}`}
        onClick={() => navigate('/search')}
        type="button"
      >
        <i className="fa-solid fa-magnifying-glass"></i>
        <span>Search</span>
      </button>
      <button
        className={`mobile-nav-item ${activeIndex === 2 ? 'active' : ''}`}
        onClick={() => navigate('/library')}
        type="button"
      >
        <i className="fa-solid fa-book-open"></i>
        <span>Library</span>
      </button>
      <button
        className={`mobile-nav-item ${activeIndex === 3 ? 'active' : ''}`}
        onClick={() => navigate('/you')}
        type="button"
      >
        <i className="fa-solid fa-circle-user"></i>
        <span>You</span>
      </button>
    </nav>
  );
}
