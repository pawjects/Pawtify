export function isValidSongId(id) {
  if (!id || typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Valid IDs are 6 to 32 safe characters (YouTube IDs are typically 11 chars)
  return /^[a-zA-Z0-9_-]{6,32}$/.test(trimmed);
}

export function parseRoute() {
  const hash = window.location.hash
    ? window.location.hash.replace(/^#\/?/, '').trim()
    : '';
  const pathname = window.location.pathname
    ? window.location.pathname.trim()
    : '';
  const searchParams = new URLSearchParams(window.location.search || '');

  let routePath = '';

  // 1. Check Hash first (standard SPA route)
  if (hash) {
    routePath = hash.startsWith('/') ? hash : `/${hash}`;
  }
  // 2. Check Pathname if not root or static file (handles direct URL navigation without hash)
  else if (pathname && pathname !== '/' && !pathname.includes('.')) {
    routePath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  }
  // 3. Fallback to search parameters (?song= or ?track= or ?v= or ?playlist=)
  else if (
    searchParams.get('song') ||
    searchParams.get('track') ||
    searchParams.get('v')
  ) {
    const sId =
      searchParams.get('song') ||
      searchParams.get('track') ||
      searchParams.get('v');
    routePath = `/song/${sId}`;
  } else if (searchParams.get('playlist')) {
    routePath = `/playlist/${searchParams.get('playlist')}`;
  }

  const normalized = routePath
    ? routePath.startsWith('/')
      ? routePath
      : `/${routePath}`
    : '/';

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

  if (normalized.startsWith('/song/') || normalized.startsWith('/track/')) {
    const raw = normalized
      .replace(/^\/(?:song|track)\//, '')
      .split('?')[0]
      .split('#')[0]
      .trim();
    const songId = decodeURIComponent(raw);
    return { name: 'song', songId: songId || null, playlistId: null };
  }

  if (normalized.startsWith('/playlist/')) {
    const raw = normalized
      .replace('/playlist/', '')
      .split('?')[0]
      .split('#')[0]
      .trim();
    const playlistId = decodeURIComponent(raw);
    return { name: 'playlist', playlistId: playlistId || null, songId: null };
  }

  return { name: 'home', playlistId: null, songId: null };
}

export function navigate(route) {
  const clean = route.startsWith('/') ? route : `/${route}`;
  window.location.hash = `#${clean}`;
}
