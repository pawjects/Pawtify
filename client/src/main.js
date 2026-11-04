import { initApp, state } from './config/config.js';
import './services/youtube.js';
import './core/events.js';
import './config/router.js';
import './services/search.js';
import './components/master.js';
import './components/home.js';
import './components/components.js';
import './components/playerBar.js';
import './components/player.js';
import './services/dataLoader.js';
import './core/details.js';
import './components/overlay.js';
import './services/apiMapping.js';
import { isAppInstalled } from './utils/utils.js';
import './components/lyrics.js';
import './components/fullscreen.js';
import './components/artistProfile.js';
import './components/queuePanel.js';
import { setupSwipeGestures } from './core/gestures.js';
import { setupMaterialRipple } from './core/ripple.js';
import { startFeedPolling, refreshFeedSilently } from './services/dataLoader.js';

// Global unhandled error and rejection listeners for immediate identification of runtime or module failures
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    console.error(
      '[Pawtify Runtime Crash: Window Error]',
      event.message,
      'Source:',
      event.filename,
      'Line:',
      event.lineno,
      'Col:',
      event.colno,
      'Error:',
      event.error
    );
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error(
      '[Pawtify Runtime Crash: Unhandled Promise Rejection]',
      event.reason
    );
  });
}

// Window visibilitychange listener to prevent pause() calls on the global HTMLMediaElement when document.hidden becomes true
if (typeof window !== 'undefined') {
  window.addEventListener('visibilitychange', () => {
    const globalAudio =
      (typeof document !== 'undefined'
        ? document.getElementById('pawtify-native-audio')
        : null);
    if (!globalAudio) return;

    if (document.hidden) {
      if (!globalAudio._originalPause) {
        globalAudio._originalPause = globalAudio.pause;
      }
      globalAudio.pause = function preventedHiddenPause() {
        if (document.hidden) {
          return;
        }
        return globalAudio._originalPause.apply(this, arguments);
      };
    } else {
      if (globalAudio._originalPause) {
        globalAudio.pause = globalAudio._originalPause;
      }
    }
  });
}

/**
 * Service Worker Registration & Seamless Auto-Reload Lifecycle
 * - Detects new versions via 'updatefound' and 'statechange'
 * - Reloads silently to apply latest assets when active controller exists
 * - Defers reload if a song is actively playing until playback pauses
 */
function initServiceWorkerLifecycle() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  if (typeof window !== 'undefined') {
    window.pawtifyState = state;
  }

  let isReloading = false;

  const triggerUpdateReload = () => {
    if (isReloading) return;

    const performReload = () => {
      if (isReloading) return;
      isReloading = true;
      console.info('[Pawtify SW] Applying seamless update reload...');
      window.location.reload();
    };

    // If audio is currently playing, defer reload until playback pauses
    if (state && state.isPlaying) {
      console.info('[Pawtify SW] Audio is actively playing; deferring reload until paused.');
      let pausedListenerAttached = false;

      const checkPauseInterval = setInterval(() => {
        if (!state.isPlaying) {
          clearInterval(checkPauseInterval);
          performReload();
        }
      }, 1000);

      // Listen for global audio pause event as immediate fallback
      const audioEl = document.getElementById('pawtify-native-audio');
      if (audioEl && !pausedListenerAttached) {
        pausedListenerAttached = true;
        audioEl.addEventListener('pause', () => {
          clearInterval(checkPauseInterval);
          performReload();
        }, { once: true });
      }
    } else {
      performReload();
    }
  };

  const registerSW = () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.info('[Pawtify SW] Registered successfully with scope:', reg.scope);

        // Check if an updated worker is already waiting in the background
        if (reg.waiting && navigator.serviceWorker.controller) {
          console.info('[Pawtify SW] Updated worker waiting; triggering reload.');
          triggerUpdateReload();
        }

        // Listen for updates discovered by the browser
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (!installingWorker) return;

          console.info('[Pawtify SW] New service worker version detected, installing...');
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.info('[Pawtify SW] New service worker installed with active controller; updating...');
                triggerUpdateReload();
              } else {
                console.info('[Pawtify SW] Content cached for offline use for the first time.');
              }
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[Pawtify SW Registration Error]:', err);
      });
  };

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }

  // Handle controllerchange when skipWaiting activates a new SW
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.info('[Pawtify SW] Controller changed; triggering update reload.');
    triggerUpdateReload();
  });
}

async function bootApp() {
  console.info('[Pawtify Boot] Booting Pawtify application entry point...');

  try {
    initServiceWorkerLifecycle();
  } catch (swErr) {
    console.warn('[Pawtify Boot Warning] Service Worker lifecycle setup error:', swErr);
  }

  try {
    console.info('[Pawtify Boot] Calling initApp()...');
    await initApp();
    console.info('[Pawtify Boot] initApp() succeeded.');
  } catch (bootErr) {
    console.error('[Pawtify Fatal Initialization Error in initApp]:', bootErr);
    const mainEl = typeof document !== 'undefined' ? document.getElementById('app-main') : null;
    if (mainEl && !mainEl.innerHTML.trim()) {
      mainEl.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px; text-align: center;">
          <span class="material-symbols-rounded" style="font-size: 2.5rem; color: var(--danger, #ef4444); margin-bottom: 16px;">warning</span>
          <h2 style="font-size: 1.4rem; margin-bottom: 8px;">Initialization Error</h2>
          <p style="color: var(--muted); font-size: 0.9rem; max-width: 420px; margin: 0 auto 16px;">
            The app encountered an issue during startup: ${String(bootErr?.message || bootErr)}
          </p>
          <button class="btn btn-primary" onclick="window.location.reload();" type="button" style="padding: 8px 20px;">
            <span class="material-symbols-rounded">refresh</span> Reload App
          </button>
        </div>
      `;
    }
  }

  try {
    console.info('[Pawtify Boot] Setting up swipe gestures and Material ripples...');
    setupSwipeGestures();
    setupMaterialRipple();
    console.info('[Pawtify Boot] Swipe gestures and ripples initialized.');
  } catch (err) {
    console.warn('[Pawtify Boot Warning] Non-fatal swipe gestures or ripples error:', err);
  }

  try {
    if (typeof document !== 'undefined' && isAppInstalled()) {
      document.body.classList.add('is-standalone');
    }
    startFeedPolling();
    console.info('[Pawtify Boot] Background feed polling active.');
  } catch (pollErr) {
    console.warn('[Pawtify Boot Warning] Polling setup error:', pollErr);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bootApp();
    });
  } else {
    bootApp();
  }
} else {
  bootApp();
}

