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
    if (type === 'song' || type === 'track' || type === 'song_details') {
      if (!/^[a-zA-Z0-9_-]{11}$/.test(query)) {
        return res.status(400).json({ error: 'Invalid song ID format', item: null, items: [] });
      }
      let songObj = null;
      try {
        const item = await ytmusic.getSong(query);
        if (item && (item.videoId || item.name)) {
          const durationSec = item.duration || 0;
          const uploader = Array.isArray(item.artist)
            ? item.artist.map((a) => a.name || a).join(', ')
            : (item.artist?.name || item.artist || 'Unknown Artist');
          const thumb = item.thumbnails?.[item.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${item.videoId || query}/hqdefault.jpg`;
          songObj = {
            id: item.videoId || query,
            title: item.name || 'Unknown Title',
            uploaderName: uploader,
            thumbnail: thumb,
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        }
      } catch (err) {
        // Fallback to getVideo if getSong failed
        try {
          const vItem = await ytmusic.getVideo(query);
          if (vItem && (vItem.videoId || vItem.name)) {
            const durationSec = vItem.duration || 0;
            const uploader = Array.isArray(vItem.artist)
              ? vItem.artist.map((a) => a.name || a).join(', ')
              : (vItem.artist?.name || vItem.artist || vItem.author || 'Unknown Artist');
            const thumb = vItem.thumbnails?.[vItem.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${vItem.videoId || query}/hqdefault.jpg`;
            songObj = {
              id: vItem.videoId || query,
              title: vItem.name || vItem.title || 'Unknown Title',
              uploaderName: uploader,
              thumbnail: thumb,
              duration: durationSec,
              durationString: formatDurationString(durationSec),
              resultType: 'song',
              isVerified: true,
              isOfficialArtist: true,
              isTopic: true,
              tags: ['official release'],
            };
          }
        } catch (vErr) {
          // Both getSong and getVideo failed
        }
      }

      if (!songObj) {
        // Fallback to search songs for the ID
        const searchResults = await ytmusic.searchSongs(query).catch(() => []);
        if (searchResults && searchResults.length > 0) {
          const match = searchResults.find((s) => s.videoId === query) || searchResults[0];
          const durationSec = match.duration || 0;
          const uploader = Array.isArray(match.artist)
            ? match.artist.map((a) => a.name || a).join(', ')
            : (match.artist?.name || match.artist || 'Unknown Artist');
          const thumb = match.thumbnails?.[match.thumbnails.length - 1]?.url || `https://i.ytimg.com/vi/${query}/hqdefault.jpg`;
          songObj = {
            id: match.videoId || query,
            title: match.name || 'Unknown Title',
            uploaderName: uploader,
            thumbnail: thumb,
            duration: durationSec,
            durationString: formatDurationString(durationSec),
            resultType: 'song',
            isVerified: true,
            isOfficialArtist: true,
            isTopic: true,
            tags: ['official release'],
          };
        }
      }

      // Safe fallback if still null but valid query ID
      if (!songObj && /^[a-zA-Z0-9_-]{6,32}$/.test(query)) {
        songObj = {
          id: query,
          title: 'Track ' + query,
          uploaderName: 'YouTube Music',
          thumbnail: `https://i.ytimg.com/vi/${query}/hqdefault.jpg`,
          duration: 0,
          durationString: '',
          resultType: 'song',
          isVerified: true,
          isOfficialArtist: false,
          isTopic: false,
          tags: ['official release'],
        };
      }

      return res.status(200).json({
        item: songObj,
        items: songObj ? [songObj] : [],
      });
    } else if (type === 'suggestions') {
      const results = await ytmusic.getSearchSuggestions(query).catch(() => []);
      return res.status(200).json({ items: results });
    } else if (type === 'playlist_videos') {
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
