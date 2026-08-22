/**
 * YouTube Media Domain Types (Phase 8)
 * Pure typed contracts for YouTube Data API search, video representations,
 * media categories, player state, and playback lifecycle.
 */

export type YouTubeMediaCategory =
  | 'EXERCISE'
  | 'WORKOUT'
  | 'MOBILITY'
  | 'MOTIVATION'
  | 'MUSIC';

export interface YouTubeVideo {
  /** YouTube Video ID (e.g. "IODxDxX7oi4") */
  videoId: string;
  /** Video title */
  title: string;
  /** Clean video description or snippet */
  description: string;
  /** Secure thumbnail image URL */
  thumbnailUrl: string;
  /** YouTube Channel ID */
  channelId: string;
  /** YouTube Channel Title (e.g. "Calisthenicmovement") */
  channelTitle: string;
  /** ISO Date string of publication */
  publishedAt: string;
  /** Approximate or formatted duration (e.g. "04:15", "15:30") where available */
  duration?: string;
  /** Fixed source classification */
  sourceType: 'YOUTUBE_VIDEO';
  /** Official standard embed URL */
  embedUrl?: string;
  /** Optional linked exercise ID in the domain */
  exerciseId?: string;
  /** Category classification within the training app */
  category: YouTubeMediaCategory;
  /** Whether the video is embeddable */
  isEmbeddable?: boolean;
}

export interface YouTubeSearchRequest {
  /** Search terms or target keywords */
  query: string;
  /** Optional application media category */
  category?: YouTubeMediaCategory;
  /** Optional targeted exercise ID */
  exerciseId?: string;
  /** Optional targeted exercise display name for focused query building */
  exerciseName?: string;
  /** Page token for forward pagination */
  pageToken?: string;
  /** Maximum number of results to fetch (default: 10, max: 25) */
  maxResults?: number;
  /** Safe search level (default: strict for youth and home safety) */
  safeSearch?: 'strict' | 'moderate' | 'none';
  /** Optional language code preference (e.g. 'en') */
  language?: string;
}

export interface YouTubeSearchResponse {
  /** Normalized list of YouTube videos */
  items: YouTubeVideo[];
  /** Token for fetching next page */
  nextPageToken?: string;
  /** Token for fetching previous page */
  prevPageToken?: string;
  /** Estimated total results */
  totalResults?: number;
  /** Active query that produced the results */
  query: string;
  /** Active category */
  category: YouTubeMediaCategory;
  /** Whether response was served from short-lived client cache */
  fromCache?: boolean;
}

/**
 * YouTube IFrame Player State (matches official YT.PlayerState)
 */
export enum YouTubePlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

export type YouTubePlayerAvailability =
  | 'AVAILABLE'
  | 'LOADING'
  | 'UNAVAILABLE'
  | 'ERROR'
  | 'BLOCKED'
  | 'OFFLINE';
