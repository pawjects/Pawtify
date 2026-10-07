'use client';

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      setDeferredPrompt(null);
      setVisible(false);
    }
  };

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="pwa-install-banner" id="pwa-install-banner" style={{ display: 'block' }}>
      <div className="pwa-install-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/pawtify.png" alt="" className="pwa-install-icon" />
        <div className="pwa-install-text">
          <strong>Install Pawtify</strong>
          <span>Add to home screen for the best experience</span>
        </div>
        <button className="pwa-install-btn" onClick={handleInstall} type="button">
          Install
        </button>
        <button className="pwa-install-close" onClick={handleClose} type="button" aria-label="Close">
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  );
}
