import { Song } from '@/types/music';

interface WindowWithYT extends Window {
  YT?: {
    Player: new (
      elementId: string,
      config: {
        height: string;
        width: string;
        host?: string;
        playerVars?: Record<string, unknown>;
        events?: {
          onReady?: (event: { target: YTPlayerInstance }) => void;
          onStateChange?: (event: { data: number }) => void;
          onError?: (event: { data: number }) => void;
        };
      }
    ) => YTPlayerInstance;
    PlayerState: {
      UNSTARTED: number;
      ENDED: number;
      PLAYING: number;
      PAUSED: number;
      BUFFERING: number;
      CUED: number;
    };
  };
  onYouTubeIframeAPIReady?: () => void;
}

export interface YTPlayerInstance {
  loadVideoById: (id: string, startSeconds?: number) => void;
  cueVideoById: (id: string, startSeconds?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  getIframe: () => HTMLIFrameElement | null;
  destroy?: () => void;
}

export interface YouTubePlayerCallbacks {
  onReady: () => void;
  onPlay: () => void;
  onPause: () => void;
  onBuffering: () => void;
  onEnded: () => void;
  onError: (errorCode: number) => void;
  onProgress: (currentTime: number, duration: number) => void;
}

class YouTubePlayerEngine {
  private player: YTPlayerInstance | null = null;
  private isReady = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private loadTimeout: NodeJS.Timeout | null = null;
  private callbacks: YouTubePlayerCallbacks | null = null;
  private pendingVideoId: string | null = null;
  private pendingAutoplay = false;

  public init(callbacks: YouTubePlayerCallbacks): void {
    this.callbacks = callbacks;
    this.loadApi();
  }

  private loadApi(): void {
    if (typeof window === 'undefined') return;
    const win = window as unknown as WindowWithYT;

    if (win.YT && win.YT.Player) {
      this.createPlayer();
      return;
    }

    if (!document.getElementById('yt-iframe-api-script')) {
      const tag = document.createElement('script');
      tag.id = 'yt-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }

    const prevReady = win.onYouTubeIframeAPIReady;
    win.onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      this.createPlayer();
    };
  }

  public createPlayer(): void {
    if (this.player || typeof window === 'undefined') return;
    const win = window as unknown as WindowWithYT;
    if (!win.YT || !win.YT.Player) return;
    const hostElem = document.getElementById('yt-player-host');
    if (!hostElem) {
      setTimeout(() => this.createPlayer(), 200);
      return;
    }

    try {
      this.player = new win.YT.Player('yt-player-host', {
        height: '158',
        width: '280',
        host: 'https://www.youtube.com',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          playsinline: 1,
          fs: 0,
          rel: 0,
          enablejsapi: 1,
          iv_load_policy: 3,
          modestbranding: 1,
        },
        events: {
          onReady: () => {
            this.isReady = true;
            this.callbacks?.onReady();
            if (this.pendingVideoId) {
              if (this.pendingAutoplay) {
                this.loadVideo(this.pendingVideoId);
              } else {
                this.cueVideo(this.pendingVideoId);
              }
              this.pendingVideoId = null;
            }
          },
          onStateChange: (e) => {
            this.handleStateChange(e.data);
          },
          onError: (e) => {
            console.warn('YouTube Player Error code:', e.data);
            this.clearLoadTimeout();
            this.callbacks?.onError(e.data);
          },
        },
      });
    } catch (err) {
      console.error('Failed to create YT.Player instance:', err);
    }
  }

  private handleStateChange(data: number): void {
    if (data === 1) {
      // PLAYING
      this.clearLoadTimeout();
      this.startPolling();
      this.callbacks?.onPlay();
    } else if (data === 2) {
      // PAUSED
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }
      this.stopPolling();
      this.callbacks?.onPause();
    } else if (data === 3) {
      // BUFFERING
      this.callbacks?.onBuffering();
    } else if (data === 0) {
      // ENDED
      this.stopPolling();
      this.callbacks?.onEnded();
    }
  }

  public loadVideo(id: string, startSeconds = 0): void {
    this.startLoadTimeout();
    if (this.isReady && this.player && typeof this.player.loadVideoById === 'function') {
      try {
        this.player.loadVideoById(id, startSeconds);
      } catch (err) {
        console.warn('loadVideoById error:', err);
        this.callbacks?.onError(101);
      }
    } else {
      this.pendingVideoId = id;
      this.pendingAutoplay = true;
      this.createPlayer();
    }
  }

  public cueVideo(id: string, startSeconds = 0): void {
    if (this.isReady && this.player && typeof this.player.cueVideoById === 'function') {
      try {
        this.player.cueVideoById(id, startSeconds);
      } catch (err) {
        console.warn('cueVideoById error:', err);
      }
    } else {
      this.pendingVideoId = id;
      this.pendingAutoplay = false;
      this.createPlayer();
    }
  }

  public play(): void {
    this.startLoadTimeout();
    if (this.isReady && this.player) {
      try {
        const state = typeof this.player.getPlayerState === 'function' ? this.player.getPlayerState() : -1;
        if (state === -1 || state === 5) {
          if (this.pendingVideoId) {
            this.player.loadVideoById(this.pendingVideoId);
          }
        } else if (typeof this.player.playVideo === 'function') {
          this.player.playVideo();
        }
        const iframe = typeof this.player.getIframe === 'function' ? this.player.getIframe() : null;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
            '*'
          );
        }
      } catch (e) {
        console.warn('play error:', e);
      }
    }
  }

  public pause(): void {
    if (this.isReady && this.player) {
      try {
        if (typeof this.player.pauseVideo === 'function') {
          this.player.pauseVideo();
        }
        const iframe = typeof this.player.getIframe === 'function' ? this.player.getIframe() : null;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
            '*'
          );
        }
      } catch (e) {
        console.warn('pause error:', e);
      }
    }
    this.stopPolling();
  }

  public seekTo(seconds: number): void {
    if (!Number.isFinite(seconds)) return;
    if (this.isReady && this.player) {
      try {
        this.player.seekTo(seconds, true);
        const iframe = typeof this.player.getIframe === 'function' ? this.player.getIframe() : null;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
            '*'
          );
        }
      } catch (e) {
        console.warn('seekTo error:', e);
      }
    }
  }

  public setVolume(val: number): void {
    // val 0 to 1
    const clamped = Math.max(0, Math.min(1, val));
    if (this.isReady && this.player && typeof this.player.setVolume === 'function') {
      try {
        this.player.setVolume(Math.round(clamped * 100));
      } catch (e) {
        console.warn('setVolume error:', e);
      }
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollInterval = setInterval(() => {
      if (this.isReady && this.player && typeof this.player.getPlayerState === 'function') {
        const state = this.player.getPlayerState();
        if (state === 1) {
          const curTime = this.player.getCurrentTime() || 0;
          const duration = this.player.getDuration() || 0;
          this.callbacks?.onProgress(curTime, duration);
        }
      }
    }, 250);
  }

  private stopPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  private startLoadTimeout(): void {
    this.clearLoadTimeout();
    this.loadTimeout = setTimeout(() => {
      console.warn('YouTube Player timed out loading video');
      this.callbacks?.onError(999); // Custom timeout code
    }, 20000);
  }

  public clearLoadTimeout(): void {
    if (this.loadTimeout) {
      clearTimeout(this.loadTimeout);
      this.loadTimeout = null;
    }
  }

  public updateMediaSession(
    song: Song | null,
    isPlaying: boolean,
    actions: {
      onPlay: () => void;
      onPause: () => void;
      onPrev: () => void;
      onNext: () => void;
      onSeek: (seconds: number) => void;
    }
  ): void {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;
    if (!song) {
      navigator.mediaSession.playbackState = 'none';
      return;
    }

    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.title || 'Unknown',
        artist: song.artist || 'Unknown',
        album: song.album || 'Single',
        artwork: [{ src: song.coverUrl, sizes: '512x512', type: 'image/jpeg' }],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

      navigator.mediaSession.setActionHandler('play', actions.onPlay);
      navigator.mediaSession.setActionHandler('pause', actions.onPause);
      navigator.mediaSession.setActionHandler('previoustrack', actions.onPrev);
      navigator.mediaSession.setActionHandler('nexttrack', actions.onNext);
      navigator.mediaSession.setActionHandler('seekforward', () => actions.onSeek(10));
      navigator.mediaSession.setActionHandler('seekbackward', () => actions.onSeek(-10));
      try {
        navigator.mediaSession.setActionHandler('seekto', (details: any) => {
          if (details && typeof details.seekTime === 'number') {
            this.seekTo(details.seekTime);
          }
        });
      } catch {}
    } catch (e) {
      console.warn('MediaSession update error:', e);
    }
  }
}

export const youtubePlayerEngine = new YouTubePlayerEngine();
