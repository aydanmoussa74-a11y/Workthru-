import React from 'react';
import { YouTubeVideo } from '../../../domain/media/youtube/types';
import { Play, Video } from '../../../ui/icons';

export interface MediaResultCardProps {
  video: YouTubeVideo;
  onSelect: (video: YouTubeVideo) => void;
  className?: string;
}

export const MediaResultCard: React.FC<MediaResultCardProps> = ({
  video,
  onSelect,
  className = '',
}) => {
  return (
    <div
      id={`media-card-${video.videoId}`}
      onClick={() => onSelect(video)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(video);
        }
      }}
      aria-label={`Play ${video.title} by ${video.channelTitle}`}
      className={`group relative flex flex-col sm:flex-row gap-3 p-2.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-850 border border-neutral-800/90 hover:border-neutral-750 transition-all cursor-pointer select-none text-left focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 ${className}`}
    >
      {/* Thumbnail Container with Duration Badge & Play Overlay */}
      <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-neutral-950 shrink-0">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Dark subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/70 via-transparent to-transparent pointer-events-none" />

        {/* Duration Badge */}
        {video.duration && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-neutral-950/90 text-[10px] font-mono text-neutral-200 border border-neutral-800">
            {video.duration}
          </div>
        )}

        {/* Hover / Focus Play Button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 bg-neutral-950/40 transition-opacity">
          <div className="w-10 h-10 rounded-full bg-emerald-500 text-neutral-950 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* YouTube Source Badge */}
        <div className="absolute top-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded bg-neutral-950/80 border border-neutral-800 text-[9px] font-mono text-neutral-300">
          <Video className="w-2.5 h-2.5 text-red-400" />
          <span>YouTube</span>
        </div>
      </div>

      {/* Video Information Metadata */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-neutral-100 leading-snug line-clamp-2 group-hover:text-emerald-400 transition-colors">
            {video.title}
          </h3>
          <p className="text-xs text-neutral-400 line-clamp-1">{video.channelTitle}</p>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <span className="capitalize px-2 py-0.5 rounded bg-neutral-950/80 border border-neutral-850 text-neutral-400">
            {video.category.toLowerCase()}
          </span>
          <span className="text-emerald-400 font-medium group-hover:underline">Watch Video →</span>
        </div>
      </div>
    </div>
  );
};
