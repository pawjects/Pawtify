function getEl(id) {
  return typeof document !== 'undefined' ? document.getElementById(id) : null;
}

export function refreshDom() {
  appMain = getEl('app-main');
  playerBar = getEl('player-bar');
  miniPlayer = getEl('mini-player');
  overlayRoot = getEl('overlay-root');
  fullscreenPlayer = getEl('fullscreen-player');
  lyricsPanel = getEl('lyrics-panel');
  artistProfile = getEl('artist-profile');
  queuePanel = getEl('queue-panel');
  sidebarPlaylists = getEl('sidebar-playlists');
}

export let appMain = getEl('app-main');
export let playerBar = getEl('player-bar');
export let miniPlayer = getEl('mini-player');
export let overlayRoot = getEl('overlay-root');
export let fullscreenPlayer = getEl('fullscreen-player');
export let lyricsPanel = getEl('lyrics-panel');
export let artistProfile = getEl('artist-profile');
export let queuePanel = getEl('queue-panel');
export let sidebarPlaylists = getEl('sidebar-playlists');

export const getAppMain = () => appMain || getEl('app-main');
export const getPlayerBar = () => playerBar || getEl('player-bar');
export const getMiniPlayer = () => miniPlayer || getEl('mini-player');
export const getOverlayRoot = () => overlayRoot || getEl('overlay-root');
export const getFullscreenPlayer = () => fullscreenPlayer || getEl('fullscreen-player');
export const getLyricsPanel = () => lyricsPanel || getEl('lyrics-panel');
export const getArtistProfile = () => artistProfile || getEl('artist-profile');
export const getQueuePanel = () => queuePanel || getEl('queue-panel');
export const getSidebarPlaylists = () => sidebarPlaylists || getEl('sidebar-playlists');

