const YTMusic = require('ytmusic-api');
const ytmusic = new YTMusic();

let isYtMusicInitialized = false;
let ytMusicInitPromise = null;

async function initYtMusic() {
  if (isYtMusicInitialized) return;
  if (!ytMusicInitPromise) {
    ytMusicInitPromise = ytmusic
      .initialize({ gl: 'IN' })
      .then(() => {
        isYtMusicInitialized = true;
        console.log('YTMusic API initialized in search service');
      })
      .catch((e) => {
        ytMusicInitPromise = null;
        console.error('Failed to initialize YTMusic API:', e);
      });
  }
  return ytMusicInitPromise;
}

initYtMusic();

function formatDurationString(seconds) {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ':' + s.toString().padStart(2, '0');
}

async function searchHandler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawQuery =
    req.query?.q ||
    (req.url
      ? new URL(req.url, 'http://localhost').searchParams.get('q')
      : '') ||
    '';
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  const type =
    req.query?.type ||
    (req.url
      ? new URL(req.url, 'http://localhost').searchParams.get('type')
      : '') ||
    'songs';

  if (!query) {
    return res.status(200).json({ items: [] });
  }

  await initYtMusic();

  try {
    let items = [];
    if (type === 'playlist_videos') {
      const results = await ytmusic.getPlaylistVideos(query).catch(() => []);
      items = results
        .map((item) => {
          const durationSec = item.duration || 0;
          return {
            id: item.videoId,
            title: item.name || 'Unknown Title',
            uploaderName: Array.isArray(item.artist) ? item.artist.map(a => a.name || a).join(', ') : (item.artist?.name || item.artist || 'Unknown Artist'),
            thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        })
        .filter((i) => i.id);
    } else if (type === 'playlists') {
      const results = await ytmusic.searchPlaylists(query).catch(() => []);
      items = results
        .map((item) => ({
          id: item.playlistId,
          title: item.name || 'Unknown Playlist',
          uploaderName: Array.isArray(item.artist) ? item.artist.map(a => a.name || a).join(', ') : (item.artist?.name || item.artist || 'Various Artists'),
          thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
          resultType: 'playlist',
        }))
        .filter((i) => i.id);
    } else if (type === 'artists') {
      const results = await ytmusic.searchArtists(query).catch(() => []);
      items = results
        .map((item) => ({
          id: item.artistId,
          title: item.name || 'Unknown Artist',
          thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
          resultType: 'artist',
        }))
        .filter((i) => i.id);
    } else {
      const results = await ytmusic.searchSongs(query).catch(() => []);
      items = results
        .map((item) => {
          const durationSec = item.duration || 0;
          return {
            id: item.videoId,
            title: item.name || 'Unknown Title',
            uploaderName: Array.isArray(item.artist) ? item.artist.map(a => a.name || a).join(', ') : (item.artist?.name || item.artist || 'Unknown Artist'),
            thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        })
        .filter((i) => i.id);
    }

    return res.status(200).json({ items });
  } catch (e) {
    console.error('Search error:', e);
    return res.status(500).json({ items: [] });
  }
}

module.exports = searchHandler;
