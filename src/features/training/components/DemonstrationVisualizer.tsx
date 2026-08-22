import React, { useState, useEffect } from 'react';
import { DemonstrationAsset } from '../../../domain/demonstrations/types';
import { Activity, Dumbbell, Sparkles, Layers, ShieldCheck, Eye } from '../../../ui/icons';
import { YouTubePlayer } from '../../media/components/YouTubePlayer';

export interface DemonstrationVisualizerProps {
  asset: DemonstrationAsset;
  isPlaying: boolean;
  activeAngle?: string;
  className?: string;
}

/**
 * DemonstrationVisualizer
 * High-performance movement visualizer supporting:
 * - Real Person athletic vector motion
 * - 3D biomechanical wireframe tension model
 * - YouTube embedded demonstration video (Phase 8)
 */
export const DemonstrationVisualizer: React.FC<DemonstrationVisualizerProps> = ({
  asset,
  isPlaying,
  activeAngle = 'SIDE',
  className = '',
}) => {
  // If YouTube source, render official embedded YouTube Player
  if (asset.sourceType === 'YOUTUBE_VIDEO') {
    const videoId =
      asset.youtubeVideoId ||
      (asset.mediaUrl?.includes('embed/') ? asset.mediaUrl.split('embed/')[1] : 'IODxDxX7oi4');

    return (
      <div id={`demo-visualizer-${asset.id}`} className={`w-full h-full ${className}`}>
        <YouTubePlayer
          videoId={videoId}
          title={asset.title}
          autoPlay={false}
          className="w-full h-full rounded-none border-0"
        />
      </div>
    );
  }

  const is3D = asset.sourceType === 'THREE_D_TRAINER';
  const focalCues = asset.metadata?.focalCues || [];
  const tempo = asset.metadata?.tempo || 'Controlled 2-1-2';

  // Animation cycle phase (0 to 1)
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!isPlaying) return;

    const duration = (asset.durationSec || 4) * 1000;
    let startTime: number | null = null;
    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;
      // Sinusoidal ease in-out
      const smoothProgress = (1 - Math.cos(progress * 2 * Math.PI)) / 2;
      setPhase(smoothProgress);
      animationFrameId = requestAnimationFrame(step);
    };

    animationFrameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, asset.durationSec]);

  // Derived kinematic values for push/squat/plank
  const isPush = asset.exerciseId.includes('push');
  const isSquat = asset.exerciseId.includes('squat');
  const isPlank = asset.exerciseId.includes('plank');
  const isBridge = asset.exerciseId.includes('bridge');

  // Push: torso lowers from y=75 to y=105, elbows bend from 170° to 85°
  const pushY = 70 + phase * 28;
  const pushElbowX = 85 - phase * 18;
  const pushElbowY = 70 + phase * 10;

  // Squat: hips drop from y=65 to y=110, knees bend
  const squatHipY = 65 + phase * 40;
  const squatKneeX = 85 + phase * 15;
  const squatTorsoAngle = phase * 12;

  return (
    <div
      id={`demo-visualizer-${asset.id}`}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden ${className}`}
    >
      {/* Background Graphic Grid */}
      <div className="absolute inset-0 bg-radial from-neutral-900/60 to-neutral-950 pointer-events-none" />
      {is3D ? (
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #059669 1px, transparent 1px), linear-gradient(to bottom, #059669 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
      ) : (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      )}

      {/* Main Kinematic / Athletic Vector Stage */}
      <div className="relative flex-1 flex items-center justify-center p-2">
        <svg
          viewBox="0 0 200 150"
          className="w-full h-full max-h-[170px] drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
          aria-label={`${asset.title} visual movement guide`}
        >
          {/* Ground Plane */}
          <line
            x1="20"
            y1="130"
            x2="180"
            y2="130"
            stroke={is3D ? '#059669' : '#525252'}
            strokeWidth="1.5"
            strokeDasharray={is3D ? '4 2' : undefined}
          />

          {/* Biomechanical Push-Up Kinematics */}
          {isPush && (
            <g className="transition-all duration-75">
              {/* Floor contact points */}
              <circle cx="50" cy="130" r="3" fill="#10b981" />
              <circle cx="150" cy="130" r="3" fill="#10b981" />

              {/* Legs / Lower Body line */}
              <line
                x1="150"
                y1="130"
                x2="110"
                y2={pushY}
                stroke={is3D ? '#10b981' : '#f5f5f5'}
                strokeWidth={is3D ? '3' : '4'}
                strokeLinecap="round"
              />

              {/* Torso / Spine line */}
              <line
                x1="110"
                y1={pushY}
                x2="65"
                y2={pushY - 10}
                stroke={is3D ? '#34d399' : '#f5f5f5'}
                strokeWidth={is3D ? '4' : '4.5'}
                strokeLinecap="round"
              />

              {/* Head */}
              <circle
                cx="52"
                cy={pushY - 15}
                r="6.5"
                fill={is3D ? '#059669' : '#e5e5e5'}
                stroke={is3D ? '#6ee7b7' : '#ffffff'}
                strokeWidth="1.5"
              />

              {/* Arm & Elbow kinematics */}
              <line
                x1="65"
                y1={pushY - 10}
                x2={pushElbowX}
                y2={pushElbowY}
                stroke={is3D ? '#6ee7b7' : '#d4d4d4'}
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1={pushElbowX}
                y1={pushElbowY}
                x2="50"
                y2="130"
                stroke={is3D ? '#6ee7b7' : '#d4d4d4'}
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Joint Nodes (3D Mode) */}
              {is3D && (
                <>
                  <circle cx="65" cy={pushY - 10} r="2.5" fill="#a7f3d0" />
                  <circle cx={pushElbowX} cy={pushElbowY} r="2.5" fill="#a7f3d0" />
                  <circle cx="110" cy={pushY} r="2.5" fill="#a7f3d0" />

                  {/* Muscle tension indicator */}
                  <path
                    d={`M 60 ${pushY - 5} Q 68 ${pushY + 5} 75 ${pushY - 2}`}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="2 1"
                    opacity={phase * 0.8 + 0.2}
                  />
                </>
              )}
            </g>
          )}

          {/* Biomechanical Squat Kinematics */}
          {isSquat && (
            <g className="transition-all duration-75">
              {/* Floor contact */}
              <circle cx="90" cy="130" r="3" fill="#10b981" />
              <circle cx="110" cy="130" r="3" fill="#10b981" />

              {/* Shins */}
              <line
                x1="100"
                y1="130"
                x2={squatKneeX}
                y2="105"
                stroke={is3D ? '#10b981' : '#f5f5f5'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Thighs / Femur */}
              <line
                x1={squatKneeX}
                y1="105"
                x2="80"
                y2={squatHipY}
                stroke={is3D ? '#34d399' : '#f5f5f5'}
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Torso */}
              <line
                x1="80"
                y1={squatHipY}
                x2={80 + squatTorsoAngle}
                y2={squatHipY - 35}
                stroke={is3D ? '#6ee7b7' : '#f5f5f5'}
                strokeWidth="4"
                strokeLinecap="round"
              />

              {/* Head */}
              <circle
                cx={82 + squatTorsoAngle}
                cy={squatHipY - 43}
                r="6"
                fill={is3D ? '#059669' : '#e5e5e5'}
                stroke={is3D ? '#6ee7b7' : '#ffffff'}
                strokeWidth="1.5"
              />

              {/* Arms extended for balance */}
              <line
                x1={80 + squatTorsoAngle}
                y1={squatHipY - 28}
                x2={115 + squatTorsoAngle}
                y2={squatHipY - 26}
                stroke={is3D ? '#a7f3d0' : '#d4d4d4'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {is3D && (
                <>
                  <circle cx={squatKneeX} cy="105" r="2.5" fill="#a7f3d0" />
                  <circle cx="80" cy={squatHipY} r="2.5" fill="#a7f3d0" />
                </>
              )}
            </g>
          )}

          {/* Biomechanical Plank / Bridge / General Kinematics */}
          {!isPush && !isSquat && (
            <g className="transition-all duration-75">
              {/* Floor contact points */}
              <circle cx="45" cy="120" r="3" fill="#10b981" />
              <circle cx="155" cy="120" r="3" fill="#10b981" />

              {/* Full body rigid alignment line */}
              <line
                x1="45"
                y1={isBridge ? 120 - phase * 25 : 100}
                x2="155"
                y2="120"
                stroke={is3D ? '#10b981' : '#f5f5f5'}
                strokeWidth={is3D ? '3.5' : '4'}
                strokeLinecap="round"
              />

              {/* Forearm or Support Arm */}
              <line
                x1="45"
                y1="120"
                x2="45"
                y2={isBridge ? 120 - phase * 25 : 100}
                stroke={is3D ? '#6ee7b7' : '#d4d4d4'}
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Head */}
              <circle
                cx="35"
                cy={isBridge ? 120 - phase * 20 : 95}
                r="6"
                fill={is3D ? '#059669' : '#e5e5e5'}
                stroke={is3D ? '#6ee7b7' : '#ffffff'}
                strokeWidth="1.5"
              />

              {is3D && (
                <circle
                  cx="95"
                  cy={isBridge ? 120 - phase * 25 : 108}
                  r="3.5"
                  fill="#ef4444"
                  className="animate-pulse"
                />
              )}
            </g>
          )}
        </svg>

        {/* Live Vector Model Cues & Angle Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 z-20">
          <span className="px-2 py-0.5 rounded bg-neutral-900/90 border border-neutral-800 text-[10px] font-mono text-neutral-300 flex items-center gap-1 shadow-sm">
            <Eye className="w-3 h-3 text-emerald-400" />
            <span>{activeAngle} VIEW</span>
          </span>
        </div>
      </div>

      {/* Bottom Technical Cue Strip */}
      <div className="bg-neutral-950/80 border-t border-neutral-850/80 px-3 py-1.5 flex items-center justify-between text-[11px] font-mono text-neutral-300">
        <div className="flex items-center gap-2 truncate">
          <span className="text-emerald-400 font-semibold uppercase shrink-0">Tempo: {tempo}</span>
          {focalCues.length > 0 && (
            <span className="text-neutral-400 truncate hidden sm:inline">• {focalCues[0]}</span>
          )}
        </div>
        <div className="text-[10px] text-neutral-500 shrink-0">
          {is3D ? 'Biomechanical Rig' : 'Athletic Motion'}
        </div>
      </div>
    </div>
  );
};
