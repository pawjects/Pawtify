import { initApp } from './config/config.js';
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
import './utils/utils.js';
import './components/lyrics.js';
import './components/fullscreen.js';
import './components/artistProfile.js';
import './components/queuePanel.js';
import { setupSwipeGestures } from './core/gestures.js';
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

async function bootApp() {
  console.info('[Pawtify Boot] Booting Pawtify application entry point...');

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
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; color: var(--danger, #ef4444); margin-bottom: 16px;"></i>
          <h2 style="font-size: 1.4rem; margin-bottom: 8px;">Initialization Error</h2>
          <p style="color: var(--muted); font-size: 0.9rem; max-width: 420px; margin: 0 auto 16px;">
            The app encountered an issue during startup: ${String(bootErr?.message || bootErr)}
          </p>
          <button class="btn btn-primary" onclick="window.location.reload();" type="button" style="padding: 8px 20px;">
            <i class="fa-solid fa-rotate-right"></i> Reload App
          </button>
        </div>
      `;
    }
  }

  try {
    console.info('[Pawtify Boot] Setting up swipe gestures...');
    setupSwipeGestures();
    console.info('[Pawtify Boot] Swipe gestures initialized.');
  } catch (err) {
    console.warn('[Pawtify Boot Warning] Non-fatal swipe gestures error:', err);
  }

  try {
    startFeedPolling();
    setupPullToRefresh();
    console.info('[Pawtify Boot] Background feed polling and pull-to-refresh active.');
  } catch (pollErr) {
    console.warn('[Pawtify Boot Warning] Polling setup error:', pollErr);
  }
}

function setupPullToRefresh() {
  if (typeof document === 'undefined') return;
  const mainStage = document.getElementById('app-main');
  if (!mainStage) return;

  let pullStartY = 0;
  let isPulling = false;
  let indicator = document.getElementById('pull-to-refresh-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'pull-to-refresh-indicator';
    indicator.className = 'pull-to-refresh-indicator';
    indicator.innerHTML = '<i class="fa-solid fa-rotate-right"></i>';
    document.body.appendChild(indicator);
  }

  mainStage.addEventListener(
    'touchstart',
    (e) => {
      if (mainStage.scrollTop <= 2 && e.touches.length === 1) {
        pullStartY = e.touches[0].clientY;
        isPulling = false;
      }
    },
    { passive: true }
  );

  mainStage.addEventListener(
    'touchmove',
    (e) => {
      if (!pullStartY) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - pullStartY;
      if (deltaY > 20 && mainStage.scrollTop <= 2) {
        isPulling = true;
        const progress = Math.min(1, (deltaY - 20) / 70);
        indicator.style.transform = `translateX(-50%) translateY(${Math.min(24, progress * 24)}px)`;
        indicator.style.opacity = `${progress}`;
        indicator.classList.add('visible');
      }
    },
    { passive: true }
  );

  mainStage.addEventListener('touchend', async () => {
    if (isPulling) {
      indicator.classList.add('spinning');
      try {
        await refreshFeedSilently();
      } catch (_) {}
      setTimeout(() => {
        indicator.classList.remove('visible', 'spinning');
        indicator.style.transform = '';
        indicator.style.opacity = '';
      }, 400);
    }
    pullStartY = 0;
    isPulling = false;
  });
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

