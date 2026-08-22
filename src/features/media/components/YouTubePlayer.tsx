import React, { useEffect, useRef, useState } from 'react';
import { YouTubePlayerState, YouTubePlayerAvailability } from '../../../domain/media/youtube/types';
import { Play, AlertCircle, WifiOff, RefreshCw, ExternalLink } from '../../../ui/icons';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  autoPlay?: boolean;
  onStateChange?: (state: YouTubePlayerState) => void;
  onError?: (errorCode: number, message: string) => void;
  className?: string;
  showControls?: boolean;
}

let isIframeScriptLoading = false;
let iframeScriptLoaded = false;

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT && window.YT.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const existingCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      iframeScriptLoaded = true;
      if (existingCallback) existingCallback();
      resolve();
    };

    if (!isIframeScriptLoading) {
      isIframeScriptLoading = true;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head.appendChild(tag);
      }
    }
  });
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  title = 'YouTube Workout Media',
  autoPlay = false,
  onStateChange,
  onError,
  className = '',
  showControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef<string>(`yt-player-${Math.random().toString(36).substring(2, 9)}`);

  const [availability, setAvailability] = useState<YouTubePlayerAvailability>('LOADING');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAutoplayBlocked, setIsAutoplayBlocked] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // Check offline status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setAvailability('OFFLINE');
      setErrorMessage('You are currently offline. YouTube streaming requires internet.');
      return;
    }

    setAvailability('LOADING');
    setErrorMessage(null);
    setIsAutoplayBlocked(false);

    loadYouTubeIframeApi().then(() => {
      if (!isMounted || !containerRef.current) return;

      // Clean up existing player if video changed
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }

      try {
        playerRef.current = new window.YT.Player(playerIdRef.current, {
          videoId,
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: showControls ? 1 : 0,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (!isMounted) return;
              setAvailability('AVAILABLE');
              if (autoPlay) {
                try {
                  event.target.playVideo();
                } catch {
                  setIsAutoplayBlocked(true);
                }
              }
            },
            onStateChange: (event: any) => {
              if (!isMounted) return;
              const ytState = event.data as number;
              setIsPlaying(ytState === YouTubePlayerState.PLAYING);
              if (onStateChange) {
                onStateChange(ytState as YouTubePlayerState);
              }
            },
            onError: (event: any) => {
              if (!isMounted) return;
              const errorCode = event.data;
              let message = 'An error occurred while loading this video.';

              if (errorCode === 2) {
                message = 'Invalid video parameter.';
              } else if (errorCode === 5) {
                message = 'HTML5 player error.';
              } else if (errorCode === 100) {
                message = 'The requested video was not found or is private.';
              } else if (errorCode === 101 || errorCode === 150) {
                message = 'The video owner does not allow embedded playback outside YouTube.';
                setAvailability('BLOCKED');
              } else {
                setAvailability('ERROR');
              }

              setErrorMessage(message);
              if (onError) {
                onError(errorCode, message);
              }
            },
          },
        });
      } catch (err: any) {
        if (!isMounted) return;
        setAvailability('ERROR');
        setErrorMessage('Failed to initialize YouTube IFrame Player.');
      }
    });

    return () => {
      isMounted = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId, autoPlay, showControls]);

  const handleManualPlay = () => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      try {
        playerRef.current.playVideo();
        setIsAutoplayBlocked(false);
      } catch (err) {
        console.warn('Manual play failed', err);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      id={`youtube-player-container-${videoId}`}
      className={`relative w-full aspect-video bg-neutral-950 flex items-center justify-center overflow-hidden rounded-xl border border-neutral-850 ${className}`}
    >
      {/* Target DOM Element for YT.Player replacement */}
      <div id={playerIdRef.current} className="w-full h-full" />

      {/* Loading Overlay */}
      {availability === 'LOADING' && (
        <div className="absolute inset-0 z-10 bg-neutral-950/90 flex flex-col items-center justify-center p-4 text-center">
          <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mb-2" />
          <p className="text-xs text-neutral-300 font-medium">Connecting to YouTube Media...</p>
          <span className="text-[10px] text-neutral-500 mt-1">Official YouTube IFrame Player</span>
        </div>
      )}

      {/* Offline Overlay */}
      {availability === 'OFFLINE' && (
        <div className="absolute inset-0 z-10 bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
          <WifiOff className="w-8 h-8 text-amber-400 mb-2" />
          <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">Device Offline</h4>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-xs">
            YouTube video streaming requires internet connectivity. Local movement demonstrations and written guides remain active.
          </p>
        </div>
      )}

      {/* Blocked Embedding / Error Overlay */}
      {(availability === 'BLOCKED' || availability === 'ERROR') && (
        <div className="absolute inset-0 z-10 bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
          <AlertCircle className="w-8 h-8 text-amber-400 mb-2" />
          <h4 className="text-xs font-semibold text-neutral-200">
            {availability === 'BLOCKED' ? 'Playback Restricted' : 'Playback Error'}
          </h4>
          <p className="text-[11px] text-neutral-400 mt-1 max-w-xs">
            {errorMessage || 'This video cannot be played inside the app.'}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-neutral-200 text-xs font-medium transition-colors"
            >
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3 h-3 text-neutral-400" />
            </a>
          </div>
        </div>
      )}

      {/* Autoplay Blocked Overlay Fallback */}
      {isAutoplayBlocked && availability === 'AVAILABLE' && (
        <div className="absolute inset-0 z-10 bg-neutral-950/75 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
          <button
            id="youtube-manual-play-btn"
            onClick={handleManualPlay}
            aria-label="Play YouTube Video"
            className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 flex items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-6 h-6 fill-current ml-0.5" />
          </button>
          <p className="text-xs text-neutral-200 font-medium mt-2">Tap to Play Demonstration</p>
          <span className="text-[10px] text-neutral-400">Browser requires user interaction to start video</span>
        </div>
      )}

      {/* Verified Source Attribution Tag */}
      <div className="absolute bottom-2 right-2 z-10 pointer-events-none">
        <span className="px-2 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-[10px] font-mono text-neutral-400 shadow-sm">
          YouTube
        </span>
      </div>
    </div>
  );
};
