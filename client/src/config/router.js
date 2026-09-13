export function parseRoute() {
  const raw = window.location.hash.replace(/^#/, '') || '/';
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  if (normalized === '/' || normalized === '')
    return { name: 'home', playlistId: null };
  if (normalized === '/search') return { name: 'search', playlistId: null };
  if (normalized === '/library') return { name: 'library', playlistId: null };
  if (normalized.startsWith('/song/'))
    return { name: 'song', songId: normalized.split('/')[2] };
  if (normalized.startsWith('/playlist/')) {
    const id = decodeURIComponent(normalized.replace('/playlist/', '').trim());
    return { name: 'playlist', playlistId: id || null };
  }
  return { name: 'home', playlistId: null };
}

export function navigate(route) {
  window.location.hash = `#${route.startsWith('/') ? route : `/${route}`}`;
}
