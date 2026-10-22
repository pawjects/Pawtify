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

initApp();
setupSwipeGestures();
