import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  YouTubeMediaCategory,
  YouTubeSearchResponse,
  YouTubeVideo,
} from '../../domain/media/youtube/types';
import {
  defaultYouTubeService,
  YouTubeService,
} from '../../domain/media/youtube/service';
import { MediaCategoryTabs } from './components/MediaCategoryTabs';
import { MediaSearchBar } from './components/MediaSearchBar';
import { MediaResultCard } from './components/MediaResultCard';
import { MediaPlayerModal } from './components/MediaPlayerModal';
import {
  RefreshCw,
  WifiOff,
  Search,
  Sparkles,
  Info,
  ShieldCheck,
  Video,
} from '../../ui/icons';

export interface MediaSearchScreenProps {
  youtubeService?: YouTubeService;
  initialCategory?: YouTubeMediaCategory;
  initialQuery?: string;
  initialExerciseId?: string;
  initialExerciseName?: string;
}

const QUICK_CHIPS: Record<YouTubeMediaCategory, string[]> = {
  EXERCISE: ['Push-Up Form', 'Squat Depth', 'Plank Bracing', 'Glute Bridge', 'Doorway Row'],
  WORKOUT: ['Full Body Calisthenics', '10 Min Core', 'Bodyweight Legs', 'Upper Body Push'],
  MOBILITY: ['Daily Spine Routine', 'Hip Mobility', 'Shoulder Prep', 'Full Body Stretch'],
  MOTIVATION: ['Consistency Mindset', 'Habit Building', 'Athletic Discipline'],
  MUSIC: ['Calisthenics Beats', '120 BPM Focus', 'Steady Rhythm'],
};

export const MediaSearchScreen: React.FC<MediaSearchScreenProps> = ({
  youtubeService = defaultYouTubeService,
  initialCategory = 'EXERCISE',
  initialQuery = '',
  initialExerciseId,
  initialExerciseName,
}) => {
  const [activeCategory, setActiveCategory] = useState<YouTubeMediaCategory>(initialCategory);
  const [query, setQuery] = useState<string>(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Debounce query changes (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Online / Offline tracking
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch media results
  const fetchMedia = useCallback(
    async (isLoadMore: boolean = false, pageToken?: string) => {
      setIsLoading(true);
      try {
        const response = await youtubeService.search({
          query: debouncedQuery,
          category: activeCategory,
          exerciseId: initialExerciseId,
          exerciseName: initialExerciseName,
          pageToken,
          maxResults: 10,
        });

        if (isLoadMore) {
          setResults((prev) => {
            const seen = new Set(prev.map((p) => p.videoId));
            const newUnique = response.items.filter((item) => !seen.has(item.videoId));
            return [...prev, ...newUnique];
          });
        } else {
          const seen = new Set<string>();
          const uniqueItems = response.items.filter((item) => {
            if (seen.has(item.videoId)) return false;
            seen.add(item.videoId);
            return true;
          });
          setResults(uniqueItems);
        }
        setNextPageToken(response.nextPageToken);
      } catch (err) {
        console.warn('Failed to load YouTube media:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [youtubeService, debouncedQuery, activeCategory, initialExerciseId, initialExerciseName]
  );

  // Trigger search on category or debounced query change
  useEffect(() => {
    fetchMedia(false);
  }, [fetchMedia]);

  const handleCategoryChange = (cat: YouTubeMediaCategory) => {
    setActiveCategory(cat);
    setQuery('');
    setDebouncedQuery('');
  };

  const handleQuickChipClick = (chipText: string) => {
    setQuery(chipText);
  };

  const handleLoadMore = () => {
    if (nextPageToken && !isLoading) {
      fetchMedia(true, nextPageToken);
    }
  };

  return (
    <div id="media-search-screen" className="space-y-4 pb-12">
      {/* 1. Header & Purpose */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-emerald-400">
            <Video className="w-3 h-3 text-red-400" />
            <span>YouTube Training Hub</span>
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          Workout Media
        </h1>
        <p className="text-xs text-neutral-400 leading-relaxed">
          Discover focused exercise form tutorials, follow-along calisthenic sessions, and mobility routines without leaving the app.
        </p>
      </div>

      {/* 2. Offline Notice Banner */}
      {!isOnline && (
        <div
          id="media-offline-notice"
          className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs animate-in fade-in duration-150"
        >
          <WifiOff className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-neutral-200">Offline Mode Active</span>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Streaming YouTube videos requires internet connectivity. Showing curated offline-safe calisthenics index. Your local movement demonstrations and training engine remain 100% operational.
            </p>
          </div>
        </div>
      )}

      {/* 3. Category Selector Tabs */}
      <div className="space-y-2">
        <MediaCategoryTabs
          activeCategory={activeCategory}
          onSelectCategory={handleCategoryChange}
        />
      </div>

      {/* 4. Search Bar */}
      <div className="space-y-2">
        <MediaSearchBar
          value={query}
          onChange={setQuery}
          onClear={() => {
            setQuery('');
            setDebouncedQuery('');
          }}
          placeholder={`Search ${activeCategory.toLowerCase()} media or topics...`}
        />

        {/* Quick Topic Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-mono text-neutral-500 shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Topics:</span>
          </span>
          {QUICK_CHIPS[activeCategory].map((chip) => (
            <button
              key={chip}
              type="button"
              id={`quick-chip-${chip.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => handleQuickChipClick(chip)}
              className="min-h-[36px] px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-[11px] text-neutral-300 hover:text-neutral-100 whitespace-nowrap transition-colors cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Results Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
            {isLoading && results.length === 0
              ? 'Searching Media...'
              : `Found ${results.length} Videos`}
          </span>

          <div className="flex items-center gap-1 text-[10px] text-neutral-500 font-mono">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Safe Workout Filter</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && results.length === 0 && (
          <div
            id="media-loading-indicator"
            className="flex flex-col items-center justify-center p-12 space-y-3 bg-neutral-900/40 rounded-2xl border border-neutral-850"
          >
            <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin" />
            <p className="text-xs text-neutral-400 font-mono">Retrieving workout media...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && results.length === 0 && (
          <div
            id="media-empty-state"
            className="flex flex-col items-center justify-center p-8 text-center space-y-3 bg-neutral-900/30 rounded-2xl border border-neutral-850"
          >
            <div className="w-12 h-12 rounded-2xl bg-neutral-850 flex items-center justify-center text-neutral-400">
              <Search className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-neutral-200">No workout videos found</h3>
              <p className="text-xs text-neutral-400 max-w-xs leading-relaxed">
                Try searching for specific calisthenic movements like "Push Ups", "Squats", or "Core Routine".
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setDebouncedQuery('');
              }}
              className="min-h-[44px] px-3.5 py-1.5 rounded-xl bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-xs font-semibold text-neutral-200 transition-colors"
            >
              Reset Search Filter
            </button>
          </div>
        )}

        {/* Results List */}
        {results.length > 0 && (
          <div id="media-results-list" className="grid grid-cols-1 gap-2.5">
            {results.map((video, idx) => (
              <MediaResultCard
                key={`${video.videoId}-${idx}`}
                video={video}
                onSelect={(v) => setSelectedVideo(v)}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {nextPageToken && !isLoading && (
          <div className="pt-3 flex justify-center">
            <button
              type="button"
              id="media-load-more-btn"
              onClick={handleLoadMore}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <span>Load More Videos</span>
            </button>
          </div>
        )}

        {/* Loading More Indicator */}
        {isLoading && results.length > 0 && (
          <div className="py-4 flex justify-center items-center gap-2 text-xs font-mono text-neutral-400">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
            <span>Fetching more results...</span>
          </div>
        )}
      </div>

      {/* 6. Embedded Video Modal Player */}
      <MediaPlayerModal
        video={selectedVideo}
        isOpen={selectedVideo !== null}
        onClose={() => setSelectedVideo(null)}
        contextTitle={activeCategory}
      />
    </div>
  );
};
