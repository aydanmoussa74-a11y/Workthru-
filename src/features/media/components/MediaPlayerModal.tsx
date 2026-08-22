import React from 'react';
import { YouTubeVideo } from '../../../domain/media/youtube/types';
import { YouTubePlayer } from './YouTubePlayer';
import { X, ExternalLink, ShieldCheck, Video } from '../../../ui/icons';

export interface MediaPlayerModalProps {
  video: YouTubeVideo | null;
  isOpen: boolean;
  onClose: () => void;
  contextTitle?: string;
}

export const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({
  video,
  isOpen,
  onClose,
  contextTitle,
}) => {
  if (!isOpen || !video) return null;

  return (
    <div
      id="media-player-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="media-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        id="media-modal-container"
        className="relative w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-950/90">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-neutral-850 border border-neutral-750 text-[10px] font-mono text-neutral-300">
              <Video className="w-3 h-3 text-red-400" />
              <span>YouTube Media</span>
            </span>
            {contextTitle && (
              <span className="text-xs font-medium text-emerald-400 truncate">
                • {contextTitle}
              </span>
            )}
          </div>

          <button
            type="button"
            id="media-modal-close-btn"
            aria-label="Close media player"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-100 hover:bg-neutral-850 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Frame */}
        <div className="relative w-full bg-neutral-950">
          <YouTubePlayer
            videoId={video.videoId}
            title={video.title}
            autoPlay={true}
            className="w-full rounded-none border-0"
          />
        </div>

        {/* Modal Body: Information & Technique Notes */}
        <div className="p-4 space-y-3 overflow-y-auto">
          <div className="space-y-1">
            <h3 id="media-modal-title" className="text-base font-bold text-neutral-100 leading-snug">
              {video.title}
            </h3>
            <p className="text-xs text-neutral-400">
              Presented by <span className="text-neutral-200 font-semibold">{video.channelTitle}</span>
            </p>
          </div>

          {video.description && (
            <p className="text-xs text-neutral-400 leading-relaxed max-h-24 overflow-y-auto bg-neutral-950/50 p-2.5 rounded-xl border border-neutral-850/80">
              {video.description}
            </p>
          )}

          {/* Safety & Form Reminder */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-850 text-neutral-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-neutral-300">Training Recommendation</span>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                Prioritize movement control and joint alignment over speed or reps. If you feel sharp joint discomfort, pause and regress the exercise.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 py-3 border-t border-neutral-800 bg-neutral-950 flex items-center justify-between">
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-neutral-200 font-mono transition-colors"
          >
            <span>Open in YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            id="media-modal-done-btn"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold transition-colors cursor-pointer"
          >
            Done Watching
          </button>
        </div>
      </div>
    </div>
  );
};
