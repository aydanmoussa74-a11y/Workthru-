import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useApp } from '../../app/providers/AppProvider';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Badge } from '../../ui/components/Badge';
import { Flame, Sparkles, Sliders, Zap, CheckCircle2, RotateCcw } from '../../ui/icons';
import { screenTransition } from '../../ui/motion/transitions';
import { Workout, WorkoutRequest } from '../../domain/workouts/types';
import { defaultWorkoutRepository } from '../../domain/workouts/repository';
import { defaultExerciseRepository } from '../../domain/exercises/repository';
import { WorkoutPresetCard } from './components/WorkoutPresetCard';
import { WorkoutBuilderForm } from './components/WorkoutBuilderForm';
import { WorkoutPreview } from './components/WorkoutPreview';

const PRESET_REQUESTS: {
  id: string;
  title: string;
  subtitle: string;
  request: WorkoutRequest;
}[] = [
  {
    id: 'preset-foundation',
    title: 'Full Body Foundation',
    subtitle: 'Balanced calisthenics routine targeting push, legs, core, and mobility.',
    request: {
      durationMin: 15,
      trainingFocus: 'FULL_BODY',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      includeWarmup: true,
      includeCooldown: true,
    },
  },
  {
    id: 'preset-core-stability',
    title: 'Pillar Core & Stability',
    subtitle: 'Anti-extension and anti-rotation stability movements.',
    request: {
      durationMin: 10,
      trainingFocus: 'CORE',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      includeWarmup: true,
      includeCooldown: false,
    },
  },
  {
    id: 'preset-push-power',
    title: 'Upper Body Push',
    subtitle: 'Progressive chest, tricep, and shoulder pressing patterns.',
    request: {
      durationMin: 12,
      trainingFocus: 'PUSH',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      includeWarmup: true,
      includeCooldown: true,
    },
  },
  {
    id: 'preset-joint-mobility',
    title: 'Joint Mobility & Flow',
    subtitle: 'Spine, shoulder, and hip restorative mobility routine.',
    request: {
      durationMin: 8,
      trainingFocus: 'MOBILITY',
      experienceLevel: 'BEGINNER',
      equipment: ['NONE'],
      includeWarmup: false,
      includeCooldown: false,
    },
  },
];

export const TrainingScreen: React.FC = () => {
  const { navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [generatedWorkout, setGeneratedWorkout] = useState<Workout | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerate = async (request: WorkoutRequest) => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const workout = await defaultWorkoutRepository.generateWorkout(request);
      setGeneratedWorkout(workout);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to generate workout plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReconfigure = () => {
    setGeneratedWorkout(null);
  };

  return (
    <motion.div
      id="training-screen"
      {...screenTransition}
      className="flex flex-col gap-5"
    >
      {/* Screen Header */}
      <section id="training-header" className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" id="training-phase-tag">
            Phase 2 • Workout Domain
          </Badge>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-100">
          Training Hub
        </h2>
        <p className="text-sm text-neutral-400">
          Deterministic workout generation tailored to your time, equipment, and focus.
        </p>
      </section>

      {errorMsg && (
        <Card id="training-error-card" padding="sm" className="bg-red-950/40 border-red-800 text-red-200 text-xs">
          <p className="font-semibold">Generation Error</p>
          <p className="text-red-300 mt-0.5">{errorMsg}</p>
        </Card>
      )}

      {/* Main View: Either Generated Workout Preview OR Builder/Presets */}
      {generatedWorkout ? (
        <WorkoutPreview
          workout={generatedWorkout}
          exerciseRepo={defaultExerciseRepository}
          onReconfigure={handleReconfigure}
        />
      ) : (
        <div className="space-y-4">
          {/* Mode Switcher: Presets vs Custom Builder */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-neutral-900 border border-neutral-800" role="tablist">
            <button
              type="button"
              id="tab-presets-btn"
              role="tab"
              aria-selected={activeTab === 'presets'}
              onClick={() => setActiveTab('presets')}
              className={`min-h-[44px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'presets'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Curated Presets
            </button>
            <button
              type="button"
              id="tab-custom-btn"
              role="tab"
              aria-selected={activeTab === 'custom'}
              onClick={() => setActiveTab('custom')}
              className={`min-h-[44px] py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'custom'
                  ? 'bg-neutral-800 text-neutral-100 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Custom Generator
            </button>
          </div>

          {activeTab === 'presets' ? (
            <div id="presets-container" className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Select a Curated Plan
                </h3>
                <span className="text-xs text-neutral-400">Instant Generation</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {PRESET_REQUESTS.map((preset) => (
                  <WorkoutPresetCard
                    key={preset.id}
                    id={preset.id}
                    title={preset.title}
                    subtitle={preset.subtitle}
                    request={preset.request}
                    onSelect={handleGenerate}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div id="custom-builder-container">
              <WorkoutBuilderForm
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
              />
            </div>
          )}

          {/* Training Readiness Guide */}
          <section id="training-readiness-section" className="space-y-2 pt-2">
            <h3 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Training Session Readiness
            </h3>
            <Card id="readiness-card" padding="sm" className="bg-neutral-900/40 border-neutral-850">
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-neutral-300">Clear a 2x2 meter flat space</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-neutral-300">Have drinking water available</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs text-neutral-300">Warm up joints before intense sets</span>
                </div>
              </div>
            </Card>
          </section>
        </div>
      )}
    </motion.div>
  );
};
