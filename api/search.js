const express = require('express');
const YTMusic = require("ytmusic-api");

const router = express.Router();
const ytmusic = new YTMusic();
let isYtMusicInitialized = false;

async function initYtMusic() {
  if (!isYtMusicInitialized) {
    try {
      await ytmusic.initialize();
      isYtMusicInitialized = true;
      console.log('YTMusic API initialized in search service');
    } catch (e) {
      console.error('Failed to initialize YTMusic API:', e);
    }
  }
}

// Initialize on startup
initYtMusic();

function formatDurationString(seconds) {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

router.get('/', async (req, res) => {
  const query = req.query.q || '';
  if (!query) return res.json({ items: [] });
  
  await initYtMusic();
  
  try {
    const [songs, videos, artists] = await Promise.all([
      ytmusic.searchSongs(query).catch(() => []),
      ytmusic.searchVideos(query).catch(() => []),
      ytmusic.searchArtists(query).catch(() => [])
    ]);

    const combined = [];
    
    // Add the top artist match first
    if (artists.length > 0) {
      combined.push(artists[0]);
    }

    const maxLen = Math.max(songs.length, videos.length);
    for (let i = 0; i < maxLen; i++) {
      if (songs[i]) combined.push(songs[i]);
      if (videos[i]) combined.push(videos[i]);
    }

    const mapped = combined.map(item => {
      const durationSec = item.duration || 0;
      let resultType = "video";
      if (item.type === "SONG") resultType = "song";
      if (item.type === "ALBUM") resultType = "album";
      if (item.type === "ARTIST") resultType = "artist";
      
      let tags = [];
      if (item.type === "VIDEO") {
         tags.push("official release"); // Ensure YT Music videos pass the frontend filter
      }

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
    
    res.json({ items: mapped });
  } catch (e) {
    console.error('Search error:', e);
    res.status(500).json({ items: [] });
  }
});

module.exports = router;
