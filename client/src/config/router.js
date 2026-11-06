export function isValidSongId(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Valid IDs are 6 to 32 safe characters (YouTube IDs are typically 11 chars)
  return /^[a-zA-Z0-9_-]{6,32}$/.test(trimmed);
}

/**
 * Parses current URL pathname using standard History API.
 * Automatically cleans legacy hash paths to clean URL paths.
 * Enforces global 404 catch-all redirect to homepage ('/').
 */
export function parseRoute() {
  // 1. Seamless migration of legacy hash routing (#/...) to HTML5 History API path
  if (window.location.hash) {
    const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
    const cleanPath = rawHash ? (rawHash.startsWith('/') ? rawHash : `/${rawHash}`) : '/';
    try {
      window.history.replaceState({ path: cleanPath }, '', cleanPath);
    } catch (e) {}
  }

  const pathname = window.location.pathname ? window.location.pathname.trim() : '/';
  const searchParams = new URLSearchParams(window.location.search || '');

  let routePath = pathname || '/';

  // Fallback support for query parameters (?song= or ?track= or ?v= or ?playlist=) on root
  if (routePath === '/' || routePath === '') {
    const sId = searchParams.get('song') || searchParams.get('track') || searchParams.get('v');
    if (sId) {
      routePath = `/song/${sId}`;
    } else if (searchParams.get('playlist')) {
      routePath = `/playlist/${searchParams.get('playlist')}`;
    }
  }

  const normalized = routePath.startsWith('/') ? routePath : `/${routePath}`;

  // Known Top-Level Route Matching
  if (normalized === '/' || normalized === '') {
    return { name: 'home', playlistId: null, songId: null };
  }
  if (normalized === '/search') {
    return { name: 'search', playlistId: null, songId: null };
  }
  if (normalized === '/library') {
    return { name: 'library', playlistId: null, songId: null };
  }
  if (normalized === '/playlists') {
    return { name: 'library', playlistId: null, songId: null, subTab: 'playlists' };
  }
  if (normalized === '/albums') {
    return { name: 'library', playlistId: null, songId: null, subTab: 'albums' };
  }
  if (normalized === '/artists') {
    return { name: 'library', playlistId: null, songId: null, subTab: 'artists' };
  }
  if (normalized === '/settings') {
    return { name: 'settings', playlistId: null, songId: null };
  }
  if (normalized === '/you') {
    return { name: 'you', playlistId: null, songId: null };
  }

  // Dynamic /song/:id or /track/:id Route Matching
  if (normalized.startsWith('/song/') || normalized.startsWith('/track/')) {
    const raw = normalized
      .replace(/^\/(?:song|track)\//, '')
      .split('?')[0]
      .split('#')[0]
      .trim();
    const songId = decodeURIComponent(raw);
    if (isValidSongId(songId)) {
      return { name: 'song', songId: songId, playlistId: null };
    }
    // Invalid song ID triggers 404 catch-all
  }

  // Dynamic /playlist/:id Route Matching
  if (normalized.startsWith('/playlist/')) {
    const raw = normalized
      .replace('/playlist/', '')
      .split('?')[0]
      .split('#')[0]
      .trim();
    const playlistId = decodeURIComponent(raw);
    if (playlistId) {
      return { name: 'playlist', playlistId: playlistId, songId: null };
    }
    // Invalid playlist ID triggers 404 catch-all
  }

  // Global 404 Catch-All Fallback: Automatically redirect to homepage
  if (window.location.pathname !== '/') {
    try {
      window.location.replace('/');
    } catch (e) {
      window.location.href = '/';
    }
  }

  return { name: 'home', playlistId: null, songId: null };
}

/**
 * Standard History API Navigation without hash fragments
 */
export function navigate(route, replace = false) {
  let clean = route ? (route.startsWith('/') ? route : `/${route}`) : '/';
  clean = clean.replace(/^#\/?/, '/');
  if (!clean.startsWith('/')) clean = `/${clean}`;

  if (replace) {
    window.history.replaceState({ path: clean }, '', clean);
  } else if (window.location.pathname !== clean) {
    window.history.pushState({ path: clean }, '', clean);
  }

  window.dispatchEvent(new CustomEvent('pawtify:navigate', { detail: { path: clean } }));
}

/**
 * Dynamically updates OpenGraph and Twitter card meta tags in <head>
 * with the active track's high-res artwork and metadata for rich link previews.
 */
export function updateDynamicLinkPreview(song) {
  if (!song) {
    document.title = 'Pawtify';
    const defaultImg = `${window.location.origin}/assets/pawtify.png`;
    setMetaTag('property', 'og:image', defaultImg);
    setMetaTag('name', 'twitter:image', defaultImg);
    setMetaTag('property', 'og:title', 'Pawtify');
    setMetaTag('name', 'twitter:title', 'Pawtify');
    setMetaTag('property', 'og:url', window.location.origin + window.location.pathname);
    return;
  }

  const titleText = `${song.title || 'Track'} • ${song.artist || 'Pawtify'} | Pawtify`;
  document.title = titleText;

  const artwork = song.coverUrl
    ? (song.coverUrl.startsWith('http') ? song.coverUrl : `${window.location.origin}${song.coverUrl}`)
    : `${window.location.origin}/assets/pawtify.png`;
  const songUrl = `${window.location.origin}/song/${encodeURIComponent(song.id || '')}`;
  const descText = `Listen to ${song.title || 'this track'} by ${song.artist || 'Unknown'} on Pawtify.`;

  setMetaTag('property', 'og:image', artwork);
  setMetaTag('name', 'twitter:image', artwork);
  setMetaTag('property', 'og:title', `${song.title} - ${song.artist}`);
  setMetaTag('name', 'twitter:title', `${song.title} - ${song.artist}`);
  setMetaTag('property', 'og:description', descText);
  setMetaTag('name', 'twitter:description', descText);
  setMetaTag('property', 'og:url', songUrl);
}

function setMetaTag(attrName, attrVal, contentVal) {
  let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrVal);
    document.head.appendChild(el);
  }
  el.setAttribute('content', contentVal);
}
