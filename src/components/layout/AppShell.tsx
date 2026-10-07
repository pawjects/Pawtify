'use client';

import React, { useEffect, useRef } from 'react';
import { useLibrary } from '@/context/LibraryContext';
import { usePlayer } from '@/context/PlayerContext';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { PwaBanner } from './PwaBanner';
import { PlayerBar } from '../player/PlayerBar';
import { MiniPlayer } from '../player/MiniPlayer';
import { FullscreenPlayer } from '../player/FullscreenPlayer';
import { FloatingVideo } from '../player/FloatingVideo';
import { LyricsPanel } from '../panels/LyricsPanel';
import { QueuePanel } from '../panels/QueuePanel';
import { ArtistProfileModal } from '../panels/ArtistProfileModal';
import { ModalOverlay } from '../panels/ModalOverlay';
import { HomeView } from '../views/HomeView';
import { SearchView } from '../views/SearchView';
import { LibraryView } from '../views/LibraryView';
import { PlaylistView } from '../views/PlaylistView';
import { YouView } from '../views/YouView';

export function AppShell() {
  const { route, navigate, modal } = useLibrary();
  const { fullscreenPlayer, artistProfile, queuePanel, lyricsPanel } = usePlayer();

  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);
  const touchMovedRef = useRef(false);

  // Setup swipe gestures across tabs on mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      touchStartXRef.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
      touchMovedRef.current = false;
    };

    const handleTouchMove = () => {
      touchMovedRef.current = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartXRef.current || !touchStartYRef.current || !touchMovedRef.current) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartXRef.current;
      const deltaY = touchEndY - touchStartYRef.current;

      touchStartXRef.current = 0;
      touchStartYRef.current = 0;

      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 75) {
        const target = e.target as HTMLElement | null;
        if (target && target.tagName && target.tagName.toLowerCase() === 'input' && (target as HTMLInputElement).type === 'range') {
          return;
        }

        let el = target;
        while (el && el !== document.body) {
          if (el.scrollWidth > el.clientWidth) {
            const style = window.getComputedStyle(el);
            if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.overflow === 'auto' || style.overflow === 'scroll') {
              return;
            }
          }
          el = el.parentElement;
        }

        if (fullscreenPlayer || artistProfile || queuePanel || lyricsPanel || modal) return;
        if (target && (target.closest('#mini-player') || target.closest('#player-bar'))) return;

        const routes = ['/', '/search', '/library'];
        let currentPath = '/';
        if (route.name === 'search') currentPath = '/search';
        else if (route.name === 'library') currentPath = '/library';
        else if (route.name === 'home') currentPath = '/';
        else return;

        const currentIdx = routes.indexOf(currentPath);
        if (currentIdx === -1) return;

        if (deltaX < 0) {
          if (currentIdx < routes.length - 1) {
            navigate(routes[currentIdx + 1]);
          }
        } else {
          if (currentIdx > 0) {
            navigate(routes[currentIdx - 1]);
          }
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [artistProfile, fullscreenPlayer, lyricsPanel, modal, navigate, queuePanel, route.name]);

  // Service worker registration
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration warning:', err));
    }
  }, []);

  return (
    <>
      <PwaBanner />

      <div className="app-container">
        <Sidebar />

        <main className="main-stage" id="app-main" aria-live="polite">
          {route.name === 'home' && <HomeView />}
          {route.name === 'search' && <SearchView />}
          {route.name === 'library' && <LibraryView />}
          {route.name === 'playlist' && <PlaylistView playlistId={route.playlistId || ''} />}
          {route.name === 'you' && <YouView />}
          {route.name === 'song' && <HomeView />}
        </main>

        <PlayerBar />
        <MiniPlayer />
        <MobileNav />
      </div>

      <FullscreenPlayer />
      <LyricsPanel />
      <ArtistProfileModal />
      <QueuePanel />
      <ModalOverlay />
      <FloatingVideo />
    </>
  );
}
