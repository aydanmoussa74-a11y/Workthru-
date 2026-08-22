/**
 * YouTube Media Search and Normalization Engine (Phase 8)
 * Constructs safe, workout-focused queries, normalizes API response structures,
 * and maintains an in-memory bounded TTL cache to preserve API quota.
 */

import { YouTubeMediaCategory, YouTubeSearchRequest, YouTubeVideo } from './types';

/**
 * Builds a strict, workout-focused query to ensure users discover high-quality,
 * safe, age-appropriate calisthenic training, form demonstrations, and workout media.
 */
export function buildFocusedWorkoutQuery(
  requestOrQuery: YouTubeSearchRequest | string,
  explicitCategory?: YouTubeMediaCategory
): string {
  let category: YouTubeMediaCategory = 'EXERCISE';
  let rawQuery = '';
  let exerciseName: string | undefined;

  if (typeof requestOrQuery === 'string') {
    rawQuery = requestOrQuery.trim();
    if (explicitCategory) category = explicitCategory;
  } else {
    category = requestOrQuery.category || 'EXERCISE';
    rawQuery = (requestOrQuery.query || '').trim();
    exerciseName = requestOrQuery.exerciseName;
  }

  // Strip potentially risky script tags or injection artifacts
  rawQuery = rawQuery.replace(/<[^>]*>?/gm, '').replace(/["']/g, '');

  // If targeted at a specific exercise
  if (exerciseName && exerciseName.trim() !== '') {
    const cleanName = exerciseName.trim();
    if (category === 'EXERCISE') {
      return `${cleanName} exercise form demonstration tutorial calisthenics technique`;
    }
  }

  // Category specific focused framing
  switch (category) {
    case 'EXERCISE': {
      if (!rawQuery) {
        return 'calisthenics exercise form tutorial bodyweight training technique';
      }
      return `${rawQuery} calisthenics exercise form tutorial technique`;
    }
    case 'WORKOUT': {
      if (!rawQuery) {
        return 'calisthenics full body workout follow along no equipment';
      }
      return `${rawQuery} follow along workout routine bodyweight calisthenics`;
    }
    case 'MOBILITY': {
      if (!rawQuery) {
        return 'joint mobility routine full body flexibility recovery calisthenics';
      }
      return `${rawQuery} mobility routine flexibility recovery active stretch`;
    }
    case 'MOTIVATION': {
      if (!rawQuery) {
        return 'athletic training motivation discipline consistency calisthenics mindset';
      }
      return `${rawQuery} workout motivation discipline focus athletic consistency`;
    }
    case 'MUSIC': {
      if (!rawQuery) {
        return 'workout training focus instrumental beats rhythm';
      }
      return `${rawQuery} workout training music instrumental focus beats`;
    }
    default:
      return `${rawQuery} bodyweight workout calisthenics`;
  }
}

/**
 * Normalizes raw YouTube Data API item into domain-typed YouTubeVideo.
 * Safely handles missing snippets, thumbnails, or formatting discrepancies.
 */
export function normalizeYouTubeItem(
  rawItem: any,
  defaultCategory: YouTubeMediaCategory = 'EXERCISE',
  linkedExerciseId?: string
): YouTubeVideo | null {
  if (!rawItem) return null;

  // Extract video ID safely across search.list and videos.list structures
  let videoId = '';
  if (typeof rawItem.id === 'string') {
    videoId = rawItem.id;
  } else if (rawItem.id && typeof rawItem.id.videoId === 'string') {
    videoId = rawItem.id.videoId;
  } else if (rawItem.videoId) {
    videoId = rawItem.videoId;
  }

  if (!videoId) return null;

  const snippet = rawItem.snippet || {};
  const thumbnails = snippet.thumbnails || {};

  // Find best available thumbnail
  const thumbUrl =
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    thumbnails.standard?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  // Parse ISO 8601 duration (e.g. "PT4M15S" -> "04:15") if present from videos.list
  let formattedDuration: string | undefined;
  if (rawItem.contentDetails?.duration) {
    formattedDuration = formatIsoDuration(rawItem.contentDetails.duration);
  } else if (rawItem.duration) {
    formattedDuration = rawItem.duration;
  }

  return {
    videoId,
    title: unescapeHtml(snippet.title || 'Workout Demonstration'),
    description: snippet.description || '',
    thumbnailUrl: thumbUrl,
    channelId: snippet.channelId || '',
    channelTitle: unescapeHtml(snippet.channelTitle || 'YouTube Trainer'),
    publishedAt: snippet.publishedAt || new Date().toISOString(),
    duration: formattedDuration,
    sourceType: 'YOUTUBE_VIDEO',
    embedUrl: `https://www.youtube.com/embed/${videoId}`,
    exerciseId: linkedExerciseId || rawItem.exerciseId,
    category: defaultCategory,
    isEmbeddable: rawItem.status?.embeddable !== false,
  };
}

/**
 * Parses ISO 8601 duration strings like PT15M30S or PT1H2M10S into MM:SS or HH:MM:SS
 */
export function formatIsoDuration(isoDuration: string): string {
  if (!isoDuration || typeof isoDuration !== 'string') return '';
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return isoDuration;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  const secStr = seconds.toString().padStart(2, '0');
  const minStr = minutes.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${minStr}:${secStr}`;
  }
  return `${minutes}:${secStr}`;
}

/**
 * Unescapes standard HTML entities returned by YouTube API (e.g. &amp;, &quot;, &#39;)
 */
export function unescapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');
}

/**
 * In-Memory LRU/TTL Cache for YouTube search responses.
 * Avoids repeated API hits for identical queries and preserves API quota.
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class BoundedTtlCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private readonly maxEntries: number;
  private readonly ttlMs: number;

  constructor(maxEntries: number = 40, ttl: number = 10, isMilliseconds: boolean = false) {
    this.maxEntries = maxEntries;
    this.ttlMs = isMilliseconds ? ttl : ttl * 60 * 1000;
  }

  public get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public set(key: string, data: T): void {
    // Evict oldest if capacity exceeded
    if (this.cache.size >= this.maxEntries) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}
