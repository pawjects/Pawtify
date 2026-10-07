'use client';

import React from 'react';
import { PawtifyProvider, usePawtify } from '../context/PawtifyContext';
import { Sidebar } from './Sidebar';
import { PlayerBar } from './PlayerBar';
import { MiniPlayer } from './MiniPlayer';
import { MobileNav } from './MobileNav';
import { FullscreenPlayer } from './FullscreenPlayer';
import { QueuePanel } from './QueuePanel';
import { LyricsPanel } from './LyricsPanel';
import { ArtistProfileModal } from './ArtistProfileModal';
import { Overlays } from './Overlays';
import { PWAInstallBanner } from './PWAInstallBanner';

import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { LibraryPage } from './pages/LibraryPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { YouPage } from './pages/YouPage';

const PawtifyAppInner: React.FC = () => {
  const { route, isVideoMode, toastMessage, currentSong } = usePawtify();

  return (
    <div className={`app-container ${currentSong ? 'has-active-track' : ''}`}>
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Stage */}
      <main className="main-stage">
        {route.name === 'home' && <HomePage />}
        {route.name === 'search' && <SearchPage />}
        {route.name === 'library' && <LibraryPage />}
        {route.name === 'playlist' && (
          <PlaylistPage playlistId={route.playlistId || 'favorites'} />
        )}
        {route.name === 'you' && <YouPage />}
        {route.name === 'song' && (
          <div style={{ padding: '24px' }}>
            <SearchPage />
          </div>
        )}
      </main>

      {/* Desktop Bottom Player Bar */}
      <PlayerBar />

      {/* Mobile Mini Player */}
      <MiniPlayer />

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Modals & Fullscreen Sheets */}
      <FullscreenPlayer />
      <QueuePanel />
      <LyricsPanel />
      <ArtistProfileModal />
      <Overlays />
      <PWAInstallBanner />

      {/* YouTube Audio/Video Container */}
      <div
        id="yt-player-wrapper"
        className={isVideoMode ? 'yt-video-active' : 'yt-player-container'}
        style={
          isVideoMode
            ? {
                position: 'fixed',
                bottom: '108px',
                right: '24px',
                width: '320px',
                height: '180px',
                zIndex: 120,
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                boxShadow: '0 12px 36px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                background: '#000',
              }
            : undefined
        }
      >
        <div
          id="yt-player-host"
          style={{ width: '100%', height: '100%' }}
          dangerouslySetInnerHTML={{
            __html: '<div id="youtube-player-hidden" style="width:100%;height:100%"></div>',
          }}
        />
      </div>

      {/* Toast Notification */}
      <div className={`toast ${toastMessage ? 'show' : ''}`}>
        {toastMessage}
      </div>
    </div>
  );
};

export default function PawtifyApp() {
  return (
    <PawtifyProvider>
      <PawtifyAppInner />
    </PawtifyProvider>
  );
}
