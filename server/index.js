const express = require('express');
const cors = require('cors');
const YTMusic = require('ytmusic-api');

const app = express();

// Enable CORS so frontend domains can securely call this Vercel backend
app.use(cors());

const ytmusic = new YTMusic();
let ytMusicInitPromise = null;

// For Vercel's serverless environment, handle cold starts efficiently
async function ensureYTMusicInitialized() {
  if (!ytMusicInitPromise) {
    ytMusicInitPromise = ytmusic.initialize().catch(err => {
      ytMusicInitPromise = null;
      throw err;
    });
  }
  return ytMusicInitPromise;
}

app.get('/api/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    if (!query) return res.json({ items: [] });
    
    // Ensure API is initialized
    await ensureYTMusicInitialized();
    
    // Fetch both songs and videos for better results
    const [songs, videos] = await Promise.all([
      ytmusic.searchSongs(query).catch(() => []),
      ytmusic.searchVideos(query).catch(() => [])
    ]);

    const combined = [];
    const maxLen = Math.max(songs.length, videos.length);
    for (let i = 0; i < maxLen; i++) {
      if (songs[i]) combined.push(songs[i]);
      if (videos[i]) combined.push(videos[i]);
    }

    const mapped = combined.map(item => ({
      videoId: item.videoId || item.albumId || item.artistId,
      title: item.name || "Unknown Title",
      artist: item.artist?.name || "Unknown Artist",
      thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
      duration: item.duration || 0
    })).filter(i => i.videoId);
    
    res.json({ items: mapped });
  } catch (e) {
    console.error('Search error:', e);
    res.status(500).json({ error: 'Search failed', items: [] });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export the Express app module for Vercel
module.exports = app;

// Local development fallback
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
