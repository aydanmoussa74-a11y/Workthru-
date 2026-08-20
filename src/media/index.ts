/**
 * Media Layer Interface
 * Phase 0: Media contracts for video playback, demonstrations, and cues.
 */

export interface MediaAsset {
  id: string;
  type: 'video_embed' | 'animation_svg' | 'audio_cue';
  sourceUrl: string;
  aspectRatio?: string;
}
