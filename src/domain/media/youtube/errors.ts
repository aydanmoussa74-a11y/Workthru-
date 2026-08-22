/**
 * YouTube Media Domain Errors (Phase 8)
 * Explicit domain error classes for YouTube API failures, network offline,
 * quota exhaustion, and video embedding restrictions.
 */

export class YouTubeError extends Error {
  public readonly code: string;

  constructor(message: string, code: string = 'YOUTUBE_ERROR') {
    super(message);
    this.name = 'YouTubeError';
    this.code = code;
  }
}

export class YouTubeNetworkError extends YouTubeError {
  constructor(message: string = 'Unable to connect to YouTube media service. Check internet connection.') {
    super(message, 'YOUTUBE_NETWORK_ERROR');
    this.name = 'YouTubeNetworkError';
  }
}

export class YouTubeQuotaError extends YouTubeError {
  constructor(message: string = 'YouTube API daily quota limit reached. Serving curated offline demonstrations.') {
    super(message, 'YOUTUBE_QUOTA_EXCEEDED');
    this.name = 'YouTubeQuotaError';
  }
}

export class YouTubeEmbeddingDisabledError extends YouTubeError {
  public readonly videoId: string;

  constructor(videoId: string, message: string = 'Video owner has disabled embedding for this video.') {
    super(message, 'YOUTUBE_EMBEDDING_DISABLED');
    this.name = 'YouTubeEmbeddingDisabledError';
    this.videoId = videoId;
  }
}

export class YouTubeVideoUnavailableError extends YouTubeError {
  public readonly videoId: string;

  constructor(videoId: string, message: string = 'The requested YouTube video is unavailable or private.') {
    super(message, 'YOUTUBE_VIDEO_UNAVAILABLE');
    this.name = 'YouTubeVideoUnavailableError';
    this.videoId = videoId;
  }
}
