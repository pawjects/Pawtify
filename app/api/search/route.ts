import { NextRequest, NextResponse } from 'next/server';
// @ts-ignore
import YTMusic from 'ytmusic-api';

const ytmusic = new YTMusic();
let isYtMusicInitialized = false;
let ytMusicInitPromise: Promise<void> | null = null;

async function initYtMusic() {
  if (isYtMusicInitialized) return;
  if (!ytMusicInitPromise) {
    ytMusicInitPromise = (async () => {
      try {
        await (ytmusic as any).initialize();
        isYtMusicInitialized = true;
      } catch (e) {
        console.error('Failed to initialize YTMusic API:', e);
        ytMusicInitPromise = null;
      }
    })();
  }
  return ytMusicInitPromise;
}


function formatDurationString(seconds?: number): string {
  if (!seconds) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get('q') || '';
  const query = rawQuery.trim();
  const type = searchParams.get('type') || 'songs';

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (!query) {
    return NextResponse.json({ items: [] }, { headers: corsHeaders });
  }

  await initYtMusic();

  try {
    let items: any[] = [];

    if (type === 'song' || type === 'track' || type === 'song_details') {
      if (!/^[a-zA-Z0-9_-]{6,32}$/.test(query)) {
        return NextResponse.json(
          { error: 'Invalid song ID format', item: null, items: [] },
          { status: 400, headers: corsHeaders }
        );
      }

      let songObj: any = null;

      try {
        const item = await ytmusic.getSong(query);
        if (item && (item.videoId || item.name)) {
          const durationSec = item.duration || 0;
          const uploader = Array.isArray(item.artist)
            ? item.artist.map((a: any) => a.name || a).join(', ')
            : (item.artist?.name || item.artist || 'Unknown Artist');
          const thumb =
            item.thumbnails?.[item.thumbnails.length - 1]?.url ||
            `https://i.ytimg.com/vi/${item.videoId || query}/hqdefault.jpg`;

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
      } catch {
        // Fallback to getVideo
        try {
          const vItem: any = await ytmusic.getVideo(query);
          if (vItem && (vItem.videoId || vItem.name)) {
            const durationSec = vItem.duration || 0;
            const uploader = Array.isArray(vItem.artist)
              ? vItem.artist.map((a: any) => a.name || a).join(', ')
              : (vItem.artist?.name || vItem.artist || vItem.author || 'Unknown Artist');
            const thumb =
              vItem.thumbnails?.[vItem.thumbnails.length - 1]?.url ||
              `https://i.ytimg.com/vi/${vItem.videoId || query}/hqdefault.jpg`;

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
        } catch {
          // ignore
        }
      }

      if (!songObj) {
        // Fallback to search songs for the ID
        try {
          const searchResults = await ytmusic.searchSongs(query);
          if (searchResults && searchResults.length > 0) {
            const match = searchResults.find((s: any) => s.videoId === query) || searchResults[0];
            const durationSec = match.duration || 0;
            const uploader = Array.isArray(match.artist)
              ? match.artist.map((a: any) => a.name || a).join(', ')
              : (match.artist?.name || match.artist || 'Unknown Artist');
            const thumb =
              match.thumbnails?.[match.thumbnails.length - 1]?.url ||
              `https://i.ytimg.com/vi/${query}/hqdefault.jpg`;

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
        } catch {
          // ignore
        }
      }

      if (!songObj && /^[a-zA-Z0-9_-]{6,32}$/.test(query)) {
        songObj = {
          id: query,
          title: `Track ${query}`,
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

      return NextResponse.json(
        {
          item: songObj,
          items: songObj ? [songObj] : [],
        },
        { headers: corsHeaders }
      );
    } else if (type === 'suggestions') {
      const results = await ytmusic.getSearchSuggestions(query).catch(() => []);
      return NextResponse.json({ items: results }, { headers: corsHeaders });
    } else if (type === 'playlist_videos') {
      const results = await ytmusic.getPlaylistVideos(query).catch(() => []);
      items = (results || [])
        .map((item: any) => {
          const durationSec = item.duration || 0;
          return {
            id: item.videoId,
            title: item.name || 'Unknown Title',
            uploaderName: Array.isArray(item.artist)
              ? item.artist.map((a: any) => a.name || a).join(', ')
              : (item.artist?.name || item.artist || 'Unknown Artist'),
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
        .filter((i: any) => i.id);
    } else if (type === 'playlists') {
      const results = await ytmusic.searchPlaylists(query).catch(() => []);
      items = (results || [])
        .map((item: any) => ({
          id: item.playlistId,
          title: item.name || 'Unknown Playlist',
          uploaderName: Array.isArray(item.artist)
            ? item.artist.map((a: any) => a.name || a).join(', ')
            : (item.artist?.name || item.artist || 'Various Artists'),
          thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
          resultType: 'playlist',
        }))
        .filter((i: any) => i.id);
    } else if (type === 'artists') {
      const results = await ytmusic.searchArtists(query).catch(() => []);
      items = (results || [])
        .map((item: any) => ({
          id: item.artistId,
          title: item.name || 'Unknown Artist',
          thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url || '',
          resultType: 'artist',
        }))
        .filter((i: any) => i.id);
    } else {
      const results = await ytmusic.searchSongs(query).catch(() => []);
      items = (results || [])
        .map((item: any) => {
          const durationSec = item.duration || 0;
          return {
            id: item.videoId,
            title: item.name || 'Unknown Title',
            uploaderName: Array.isArray(item.artist)
              ? item.artist.map((a: any) => a.name || a).join(', ')
              : (item.artist?.name || item.artist || 'Unknown Artist'),
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
        .filter((i: any) => i.id);
    }

    return NextResponse.json({ items }, { headers: corsHeaders });
  } catch (error) {
    console.error('Search error in API route:', error);
    return NextResponse.json({ items: [] }, { status: 500, headers: corsHeaders });
  }
}
