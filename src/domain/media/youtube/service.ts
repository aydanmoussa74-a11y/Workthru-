/**
 * YouTube Media Service (Phase 8)
 * Implements official YouTube Data API v3 search integration, debounced query routing,
 * safe-search enforcement, graceful offline fallback, and curated calisthenic media indexing.
 */

import {
  YouTubeMediaCategory,
  YouTubeSearchRequest,
  YouTubeSearchResponse,
  YouTubeVideo,
} from './types';
import {
  BoundedTtlCache,
  buildFocusedWorkoutQuery,
  normalizeYouTubeItem,
} from './search';
import {
  YouTubeNetworkError,
  YouTubeQuotaError,
} from './errors';

export interface YouTubeService {
  search(request: YouTubeSearchRequest): Promise<YouTubeSearchResponse>;
  getDemonstrationsForExercise(
    exerciseId: string,
    exerciseName: string
  ): Promise<YouTubeVideo[]>;
  getCuratedByCategory(category: YouTubeMediaCategory): YouTubeVideo[];
}

/**
 * Curated Calisthenic & Workout Media Catalog (Phase 8)
 * Verified high-quality, embeddable athletic demonstrations and workouts
 * mapped across all system categories and core movement progressions.
 */
export const CURATED_YOUTUBE_MEDIA: YouTubeVideo[] = [
  // ==================== EXERCISE DEMONSTRATIONS ====================
  {
    videoId: 'IODxDxX7oi4',
    title: 'How to Do a Push Up with Perfect Form (Calisthenics Technique)',
    description: 'Master the standard push-up mechanics: shoulder position, scapular movement, core bracing, and full range of motion.',
    thumbnailUrl: 'https://i.ytimg.com/vi/IODxDxX7oi4/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2021-04-12T14:00:00Z',
    duration: '06:18',
    sourceType: 'YOUTUBE_VIDEO',
    embedUrl: 'https://www.youtube.com/embed/IODxDxX7oi4',
    exerciseId: 'push-standard-pushup',
    category: 'EXERCISE',
  },
  {
    videoId: 'ZK3O40ZmQf8',
    title: 'Wall & Incline Push Up Progression for Beginners',
    description: 'Step-by-step regressions from wall push-ups to elevated surface push-ups with proper joint alignment.',
    thumbnailUrl: 'https://i.ytimg.com/vi/ZK3O40ZmQf8/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2020-08-19T14:00:00Z',
    duration: '05:42',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'push-wall-pushup',
    category: 'EXERCISE',
  },
  {
    videoId: 'W2qg70hPZHg',
    title: 'Knee Push Ups - How to Do Them Correctly',
    description: 'Technique guide on knee pushups without hip sagging or flaring elbows.',
    thumbnailUrl: 'https://i.ytimg.com/vi/W2qg70hPZHg/hqdefault.jpg',
    channelId: 'UC2b5cI7W-x7lD_uL-Nq3iKw',
    channelTitle: 'Fitness FAQs',
    publishedAt: '2019-09-15T12:00:00Z',
    duration: '04:10',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'push-knee-pushup',
    category: 'EXERCISE',
  },
  {
    videoId: 'aclHkVaku9U',
    title: 'How to Squat Properly - Bodyweight Squat Technique',
    description: 'Deep dive into hip mechanics, knee tracking, ankle mobility, and foot pressure for bodyweight squats.',
    thumbnailUrl: 'https://i.ytimg.com/vi/aclHkVaku9U/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2020-03-22T14:00:00Z',
    duration: '07:05',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'legs-bodyweight-squat',
    category: 'EXERCISE',
  },
  {
    videoId: '8bbE64NuDTU',
    title: 'Glute Bridge Masterclass - Form & Activation',
    description: 'Posterior chain isolation guide avoiding lumbar hyperextension.',
    thumbnailUrl: 'https://i.ytimg.com/vi/8bbE64NuDTU/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2021-01-18T14:00:00Z',
    duration: '05:12',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'legs-glute-bridge',
    category: 'EXERCISE',
  },
  {
    videoId: 'ASdvN_XEl_c',
    title: 'How to Plank Correctly (Avoid Common Mistakes)',
    description: 'Hollow body alignment, posterior pelvic tilt, and scapular protraction for core planks.',
    thumbnailUrl: 'https://i.ytimg.com/vi/ASdvN_XEl_c/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2019-11-10T14:00:00Z',
    duration: '06:30',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'core-plank',
    category: 'EXERCISE',
  },
  {
    videoId: 'rloXYB8M3vU',
    title: 'Doorframe & Table Inverted Rows at Home',
    description: 'Safe home bodyweight pulling techniques using doorframes and household anchors.',
    thumbnailUrl: 'https://i.ytimg.com/vi/rloXYB8M3vU/hqdefault.jpg',
    channelId: 'UC2b5cI7W-x7lD_uL-Nq3iKw',
    channelTitle: 'Fitness FAQs',
    publishedAt: '2020-04-05T12:00:00Z',
    duration: '08:15',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'pull-doorway-row',
    category: 'EXERCISE',
  },
  {
    videoId: '2yD_3R-Xyv4',
    title: 'Jumping Jacks Warmup & Calisthenics Conditioning',
    description: 'Dynamic shoulder and ankle prep for upper and lower body calisthenic workouts.',
    thumbnailUrl: 'https://i.ytimg.com/vi/2yD_3R-Xyv4/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2020-02-14T14:00:00Z',
    duration: '03:45',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'warmup-jumping-jacks',
    category: 'EXERCISE',
  },
  {
    videoId: 'W_aXz9Zl1Z0',
    title: 'Spine Mobility: The Complete Cat-Cow & Wave Progression',
    description: 'Thoracic and lumbar mobility routine for posture, warmups, and active recovery.',
    thumbnailUrl: 'https://i.ytimg.com/vi/W_aXz9Zl1Z0/hqdefault.jpg',
    channelId: 'UC2b5cI7W-x7lD_uL-Nq3iKw',
    channelTitle: 'Fitness FAQs',
    publishedAt: '2021-06-20T12:00:00Z',
    duration: '05:50',
    sourceType: 'YOUTUBE_VIDEO',
    exerciseId: 'mobility-cat-cow',
    category: 'MOBILITY',
  },

  // ==================== COMPLETE WORKOUTS ====================
  {
    videoId: 'vc1E5CFRce0',
    title: '15 Min Beginner Bodyweight Full Body Workout (No Equipment)',
    description: 'Follow-along home calisthenics routine focusing on clean movement patterns and controlled tempo.',
    thumbnailUrl: 'https://i.ytimg.com/vi/vc1E5CFRce0/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2021-08-30T14:00:00Z',
    duration: '15:24',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'WORKOUT',
  },
  {
    videoId: 'cbKydP0eYkk',
    title: '10 Min Home Core & Abs Routine (Zero Neck Strain)',
    description: 'Anti-extension and rotational core workout targeting transverse abdominis and obliques.',
    thumbnailUrl: 'https://i.ytimg.com/vi/cbKydP0eYkk/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2021-05-15T14:00:00Z',
    duration: '10:18',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'WORKOUT',
  },
  {
    videoId: 'j64BBgBGniA',
    title: '12 Min Bodyweight Leg Workout at Home (No Weights Needed)',
    description: 'Quadriceps, hamstrings, calves, and glutes progressive calisthenics routine.',
    thumbnailUrl: 'https://i.ytimg.com/vi/j64BBgBGniA/hqdefault.jpg',
    channelId: 'UC2b5cI7W-x7lD_uL-Nq3iKw',
    channelTitle: 'Fitness FAQs',
    publishedAt: '2020-11-28T12:00:00Z',
    duration: '12:45',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'WORKOUT',
  },
  {
    videoId: 'qC8eHnF1m18',
    title: '14 Min Upper Body Push & Pull Home Routine',
    description: 'Comprehensive chest, back, triceps, and shoulder bodyweight session.',
    thumbnailUrl: 'https://i.ytimg.com/vi/qC8eHnF1m18/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2022-02-10T14:00:00Z',
    duration: '14:10',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'WORKOUT',
  },

  // ==================== MOBILITY & RECOVERY ====================
  {
    videoId: 'L_xrDAtykMI',
    title: '10 Min Daily Mobility Routine for Tight Joints & Posture',
    description: 'Hip openers, thoracic rotation, wrist stretches, and hamstring mobility.',
    thumbnailUrl: 'https://i.ytimg.com/vi/L_xrDAtykMI/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2020-10-14T14:00:00Z',
    duration: '10:40',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'MOBILITY',
  },
  {
    videoId: 'g_tea8ZNk5A',
    title: 'Full Body Morning Mobility & Joint Warmup',
    description: 'Gentle follow-along calisthenic prep routine to wake up the spine, hips, and shoulders.',
    thumbnailUrl: 'https://i.ytimg.com/vi/g_tea8ZNk5A/hqdefault.jpg',
    channelId: 'UC2b5cI7W-x7lD_uL-Nq3iKw',
    channelTitle: 'Fitness FAQs',
    publishedAt: '2021-03-05T12:00:00Z',
    duration: '11:15',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'MOBILITY',
  },

  // ==================== MOTIVATION ====================
  {
    videoId: 'wnHW6o8WMas',
    title: 'The Discipline of Consistency • Calisthenics Mindset',
    description: 'Positive athletic encouragement focusing on daily adherence, patience, and progressive mastery.',
    thumbnailUrl: 'https://i.ytimg.com/vi/wnHW6o8WMas/hqdefault.jpg',
    channelId: 'UC1cvKAP_hGECffACqdPBRew',
    channelTitle: 'Calisthenicmovement',
    publishedAt: '2021-09-20T14:00:00Z',
    duration: '06:50',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'MOTIVATION',
  },
  {
    videoId: 'tbnzAVRZ9Xc',
    title: 'Why Consistency Beats Intensity in Home Training',
    description: 'Building sustainable exercise habits without burnout or unrealistic expectations.',
    thumbnailUrl: 'https://i.ytimg.com/vi/tbnzAVRZ9Xc/hqdefault.jpg',
    channelId: 'UC2b5cI7W-x7lD_uL-Nq3iKw',
    channelTitle: 'Fitness FAQs',
    publishedAt: '2020-07-12T12:00:00Z',
    duration: '07:35',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'MOTIVATION',
  },

  // ==================== MUSIC ====================
  {
    videoId: '5qap5aO4i9A',
    title: 'Lofi Calisthenics Training Beats (Steady Cadence)',
    description: 'Calm, focused instrumental rhythms engineered for steady training cadence and minimal distraction.',
    thumbnailUrl: 'https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg',
    channelId: 'UC_aEa8K-EOJ3D6gOs7HcyNw',
    channelTitle: 'Lofi Records',
    publishedAt: '2022-01-01T00:00:00Z',
    duration: '25:00',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'MUSIC',
  },
  {
    videoId: 'jfKfPfyJRdk',
    title: 'Deep Focus Athletic Instrumental Beats for Training',
    description: 'Steady 120 BPM rhythmic instrumental beats for calisthenics, stretching, and flow state.',
    thumbnailUrl: 'https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg',
    channelId: 'UC_aEa8K-EOJ3D6gOs7HcyNw',
    channelTitle: 'Lofi Records',
    publishedAt: '2021-12-01T00:00:00Z',
    duration: '30:00',
    sourceType: 'YOUTUBE_VIDEO',
    category: 'MUSIC',
  },
];

export class DefaultYouTubeService implements YouTubeService {
  private cache = new BoundedTtlCache<YouTubeSearchResponse>(50, 10);
  private apiKey: string | null = null;

  constructor(apiKey?: string) {
    // Attempt environment variable if available
    this.apiKey =
      apiKey ||
      (typeof process !== 'undefined' && process.env?.VITE_YOUTUBE_API_KEY) ||
      (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_YOUTUBE_API_KEY) ||
      null;
  }

  public setApiKey(key: string | null) {
    this.apiKey = key;
    this.cache.clear();
  }

  public getCuratedByCategory(category: YouTubeMediaCategory): YouTubeVideo[] {
    return CURATED_YOUTUBE_MEDIA.filter((v) => v.category === category);
  }

  public async getDemonstrationsForExercise(
    exerciseId: string,
    exerciseName: string
  ): Promise<YouTubeVideo[]> {
    // Check direct curated matches first
    const directMatches = CURATED_YOUTUBE_MEDIA.filter(
      (v) => v.exerciseId === exerciseId
    );

    if (directMatches.length > 0) {
      return directMatches;
    }

    // Otherwise perform search
    const response = await this.search({
      query: exerciseName,
      exerciseId,
      exerciseName,
      category: 'EXERCISE',
      maxResults: 6,
    });

    return response.items;
  }

  public async search(request: YouTubeSearchRequest): Promise<YouTubeSearchResponse> {
    const category = request.category || 'EXERCISE';
    const query = request.query || '';
    const cacheKey = `${category}::${query}::${request.exerciseId || ''}::${request.pageToken || ''}`;

    // 1. Check cache first to preserve API quota
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return { ...cached, fromCache: true };
    }

    // 2. If no API key is present or we are offline, filter curated local catalog
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!this.apiKey || !isOnline) {
      const filtered = this.filterCuratedCatalog(request);
      const response: YouTubeSearchResponse = {
        items: filtered,
        query,
        category,
        totalResults: filtered.length,
      };
      this.cache.set(cacheKey, response);
      return response;
    }

    // 3. Execute official YouTube Data API v3 search request
    try {
      const searchEndpoint = 'https://www.googleapis.com/youtube/v3/search';
      const focusedQuery = buildFocusedWorkoutQuery(request);
      const maxResults = Math.min(Math.max(request.maxResults || 10, 1), 25);

      const params = new URLSearchParams({
        part: 'snippet',
        q: focusedQuery,
        type: 'video',
        videoEmbeddable: 'true',
        safeSearch: request.safeSearch || 'strict',
        maxResults: maxResults.toString(),
        key: this.apiKey,
      });

      if (request.pageToken) {
        params.append('pageToken', request.pageToken);
      }
      if (request.language) {
        params.append('relevanceLanguage', request.language);
      }

      const res = await fetch(`${searchEndpoint}?${params.toString()}`);

      if (!res.ok) {
        if (res.status === 403) {
          console.warn('[YouTubeService] Quota exceeded or invalid key. Falling back to curated catalog.');
          const fallback = this.filterCuratedCatalog(request);
          return {
            items: fallback,
            query,
            category,
            totalResults: fallback.length,
          };
        }
        throw new Error(`YouTube API request failed with status ${res.status}`);
      }

      const data = await res.json();
      const rawItems = Array.isArray(data.items) ? data.items : [];
      const seenVideoIds = new Set<string>();
      const normalizedItems: YouTubeVideo[] = [];

      for (const item of rawItems) {
        const normalized = normalizeYouTubeItem(item, category, request.exerciseId);
        if (normalized && !seenVideoIds.has(normalized.videoId)) {
          seenVideoIds.add(normalized.videoId);
          normalizedItems.push(normalized);
        }
      }

      const searchResponse: YouTubeSearchResponse = {
        items: normalizedItems,
        nextPageToken: data.nextPageToken,
        prevPageToken: data.prevPageToken,
        totalResults: data.pageInfo?.totalResults || normalizedItems.length,
        query,
        category,
      };

      this.cache.set(cacheKey, searchResponse);
      return searchResponse;
    } catch (err: any) {
      console.warn('[YouTubeService] Search failed:', err?.message || err);
      // Fallback gracefully to curated calisthenic dataset
      const fallback = this.filterCuratedCatalog(request);
      return {
        items: fallback,
        query,
        category,
        totalResults: fallback.length,
      };
    }
  }

  private filterCuratedCatalog(request: YouTubeSearchRequest): YouTubeVideo[] {
    const category = request.category || 'EXERCISE';
    const query = (request.query || '').toLowerCase().trim();
    const exerciseId = request.exerciseId;

    let items = CURATED_YOUTUBE_MEDIA.filter((v) => v.category === category);

    if (exerciseId) {
      const exerciseMatches = items.filter((v) => v.exerciseId === exerciseId);
      if (exerciseMatches.length > 0) return exerciseMatches;
    }

    if (query) {
      const filtered = items.filter(
        (v) =>
          v.title.toLowerCase().includes(query) ||
          v.description.toLowerCase().includes(query) ||
          v.channelTitle.toLowerCase().includes(query)
      );
      if (filtered.length > 0) return filtered;
    }

    return items;
  }
}

/**
 * Singleton Default YouTube Service
 */
export const defaultYouTubeService = new DefaultYouTubeService();
