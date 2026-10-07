'use client';

import React, { useState, useEffect } from 'react';
import { LOGO_URL } from '../utils/helpers';

export const PWAInstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!showBanner) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  return (
    <div className="pwa-install-banner">
      <div className="pwa-install-content">
        <img
          src={LOGO_URL}
          alt="Pawtify"
          className="pwa-install-icon"
        />
        <div className="pwa-install-text">
          <strong>Install Pawtify App</strong>
          <span>Add to home screen for faster, distraction-free playback</span>
        </div>
        <button className="pwa-install-btn" onClick={handleInstall}>
          Install
        </button>
        <button
          className="pwa-install-close"
          onClick={handleDismiss}
          aria-label="Close install banner"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>
    </div>
  );
};
