/**
 * Demonstration Domain Types
 * Defines data structures, source classifications, availability states, and resolution models for exercise demonstrations.
 */

export type DemonstrationSourceType =
  | 'REAL_PERSON'
  | 'THREE_D_TRAINER'
  | 'YOUTUBE_VIDEO'
  | 'FUTURE_AI_GENERATED'
  | 'FUTURE_EXTERNAL_VIDEO';

export type DemonstrationAvailabilityState =
  | 'AVAILABLE'
  | 'UNAVAILABLE'
  | 'LOADING'
  | 'ERROR'
  | 'BLOCKED'
  | 'OFFLINE';

export interface DemonstrationMetadata {
  angles?: ('FRONT' | 'SIDE' | 'ANGLED' | 'TOP')[];
  tempo?: string; // e.g. "2-1-2"
  repCountInDemo?: number;
  focalCues?: string[];
  equipmentNeeded?: string;
  resolution?: string; // e.g. "1080p", "Vector"
  fps?: number;
  [key: string]: any;
}

export interface DemonstrationAsset {
  /** Unique demonstration asset identifier */
  id: string;
  /** Associated exercise identifier */
  exerciseId: string;
  /** Demonstration source classification */
  sourceType: DemonstrationSourceType;
  /** Display title for the demonstration */
  title: string;
  /** Optional contextual description or instructions */
  description?: string;
  /** Media URL or relative path for video/animation */
  mediaUrl?: string | null;
  /** Poster thumbnail image URL or relative path */
  posterUrl?: string | null;
  /** Approximate duration in seconds of one demonstration cycle */
  durationSec?: number;
  /** Whether the demonstration is designed to loop continuously */
  loop: boolean;
  /** Whether this asset is fully cached and operable offline */
  availableOffline: boolean;
  /** Source attribution or author credit */
  attribution?: string;
  /** Optional YouTube Video ID if source is YOUTUBE_VIDEO */
  youtubeVideoId?: string;
  /** Additional domain metadata */
  metadata?: DemonstrationMetadata;
}

export interface DemonstrationResolutionOptions {
  /** Whether device currently has internet connectivity (defaults to navigator.onLine or true) */
  isOnline?: boolean;
  /** Preferred initial source type if multiple available */
  preferredSourceType?: DemonstrationSourceType;
}

export interface DemonstrationResolution {
  /** The exercise ID resolved */
  exerciseId: string;
  /** Overall availability state */
  state: DemonstrationAvailabilityState;
  /** List of all resolved available assets for this exercise */
  assets: DemonstrationAsset[];
  /** Currently active selected asset (null if none available) */
  selectedAsset: DemonstrationAsset | null;
  /** 0-based index of currently active asset in assets array */
  selectedIndex: number;
  /** List of distinct source types available for this exercise */
  availableSourceTypes: DemonstrationSourceType[];
  /** Optional human-readable explanation if unavailable or error occurred */
  statusMessage?: string;
  /** Optional technical error details */
  errorMessage?: string;
}
