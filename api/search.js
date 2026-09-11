const YTMusic = require("ytmusic-api");

const ytmusic = new YTMusic();
let isYtMusicInitialized = false;
let ytMusicInitPromise = null;

async function initYtMusic() {
  if (isYtMusicInitialized) return;
  if (!ytMusicInitPromise) {
    ytMusicInitPromise = ytmusic.initialize({ gl: 'IN' })
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

// Background initialization
initYtMusic();

function formatDurationString(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function searchHandler(req, res) {
  // Add CORS headers for Vercel / cross-domain preview hosting
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawQuery = req.query?.q || (req.url ? new URL(req.url, 'http://localhost').searchParams.get('q') : '') || '';
  const query = typeof rawQuery === 'string' ? rawQuery.trim() : '';

  if (!query) {
    return res.status(200).json({ items: [] });
  }

  await initYtMusic();

  try {
    const [songs, videos, artists] = await Promise.all([
      ytmusic.searchSongs(query).catch(() => []),
      ytmusic.searchVideos(query).catch(() => []),
      ytmusic.searchArtists(query).catch(() => [])
    ]);

    const combined = [];

    // Add top artist match first
    if (artists && artists.length > 0) {
      combined.push(artists[0]);
    }

    // Interleave videos first (official videos and audios have full third-party embed permission)
    const maxLen = Math.max(songs?.length || 0, videos?.length || 0);
    for (let i = 0; i < maxLen; i++) {
      if (videos && videos[i]) combined.push(videos[i]);
      if (songs && songs[i]) combined.push(songs[i]);
    }

    const mapped = combined.map(item => {
      const durationSec = item.duration || 0;
      let resultType = "video";
      if (item.type === "SONG") resultType = "song";
      if (item.type === "ALBUM") resultType = "album";
      if (item.type === "ARTIST") resultType = "artist";

      let tags = ["official release"];

      return {
        id: item.videoId || item.albumId || item.artistId,
        title: item.name || "Unknown Title",
        uploaderName: item.type === "ARTIST" ? item.name : (item.artist?.name || "Unknown Artist"),
        thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
        duration: durationSec,
        durationString: formatDurationString(durationSec),
        resultType: resultType,
        isVerified: true,
        isOfficialArtist: true,
        isTopic: true,
        tags: tags
      };
    }).filter(i => i.id);

    return res.status(200).json({ items: mapped });
  } catch (e) {
    console.error('Search error:', e);
    return res.status(500).json({ items: [] });
  }
}

module.exports = searchHandler;

