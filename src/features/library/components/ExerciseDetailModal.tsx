import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Exercise } from '../../../domain/exercises/types';
import { defaultExerciseRepository } from '../../../domain/exercises/repository';
import { Badge } from '../../../ui/components/Badge';
import { Button } from '../../../ui/components/Button';
import { IconButton } from '../../../ui/components/IconButton';
import { Card } from '../../../ui/components/Card';
import { DemonstrationPanel } from '../../training/components/DemonstrationPanel';
import {
  X,
  Dumbbell,
  CheckCircle2,
  AlertCircle,
  Wind,
  ArrowDownRight,
  ArrowUpRight,
  ShieldCheck,
  Activity,
} from '../../../ui/icons';

interface ExerciseDetailModalProps {
  exercise: Exercise | null;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
}

export const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({
  exercise,
  onClose,
  onSelectExercise,
}) => {
  const [regressionEx, setRegressionEx] = useState<Exercise | null>(null);
  const [progressionEx, setProgressionEx] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!exercise) {
      setRegressionEx(null);
      setProgressionEx(null);
      return;
    }

    const fetchVariations = async () => {
      const { regression, progression } = await defaultExerciseRepository.getRelatedVariations(
        exercise.id
      );
      setRegressionEx(regression);
      setProgressionEx(progression);
    };

    fetchVariations();
  }, [exercise]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && exercise) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [exercise, onClose]);

  if (!exercise) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-neutral-950/80 backdrop-blur-xs"
        />

        {/* Modal Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 260 }}
          className="relative w-full max-w-xl rounded-t-3xl sm:rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl z-10 max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Top Bar / Header */}
          <div className="sticky top-0 bg-neutral-900/95 backdrop-blur-md px-5 py-4 border-b border-neutral-800 flex items-start justify-between gap-3 z-20">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge variant="accent" className="text-[10px] py-0 px-2 uppercase font-mono">
                  {exercise.category}
                </Badge>
                <Badge variant="outline" className="text-[10px] py-0 px-2 uppercase font-mono text-neutral-300">
                  {exercise.experienceLevel}
                </Badge>
                <span className="text-xs text-neutral-400 font-mono flex items-center gap-1">
                  <Dumbbell className="w-3 h-3" />
                  {exercise.equipment === 'NONE' ? 'Bodyweight' : exercise.equipment}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-100">{exercise.name}</h2>
            </div>

            <IconButton
              id="close-exercise-detail-btn"
              aria-label="Close exercise details"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
            {/* Movement Demonstration Panel (Phase 7 Multi-Source Carousel) */}
            <div className="w-full">
              <DemonstrationPanel
                exerciseId={exercise.id}
                exerciseName={exercise.name}
                segmentType="LIBRARY_PREVIEW"
              />
            </div>

            {/* Description & Target Muscles */}
            <div className="space-y-3">
              <p className="text-sm text-neutral-300 leading-relaxed">{exercise.description}</p>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {exercise.primaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="text-xs font-mono bg-neutral-800 text-neutral-200 px-2 py-0.5 rounded border border-neutral-700 capitalize"
                  >
                    Primary: {m.replace('_', ' ')}
                  </span>
                ))}
                {exercise.secondaryMuscles.map((m) => (
                  <span
                    key={m}
                    className="text-xs font-mono bg-neutral-950 text-neutral-400 px-2 py-0.5 rounded border border-neutral-850 capitalize"
                  >
                    Secondary: {m.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-4">
              {/* Setup */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  1. Setup & Starting Position
                </h4>
                <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850">
                  {exercise.instructions.setup.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                      <span className="font-mono text-neutral-400 mt-0.5">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  2. Execution
                </h4>
                <div className="space-y-1.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850">
                  {exercise.instructions.execution.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                      <span className="font-mono text-neutral-400 mt-0.5">{idx + 1}.</span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Breathing Cue */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  3. Breathing Rhythm
                </h4>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850 text-xs text-neutral-200">
                  <Wind className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="leading-relaxed">{exercise.instructions.breathing}</span>
                </div>
              </div>

              {/* Form Cues */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Key Technique Cues
                </h4>
                <div className="space-y-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850">
                  {exercise.instructions.formCues.map((cue, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-neutral-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{cue}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes */}
              {exercise.instructions.commonMistakes.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                    Common Mistakes to Avoid
                  </h4>
                  <div className="space-y-2 p-3 rounded-xl bg-neutral-950/60 border border-neutral-850">
                    {exercise.instructions.commonMistakes.map((mistake, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-300">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="leading-relaxed">{mistake}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Progression & Variation Ladder */}
            <div className="space-y-2 pt-1 border-t border-neutral-800">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Variation Ladder
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {regressionEx ? (
                  <button
                    id="variation-regression-btn"
                    onClick={() => onSelectExercise(regressionEx)}
                    className="flex flex-col text-left p-3 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 mb-0.5">
                      <ArrowDownRight className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Easier Variation</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-200">{regressionEx.name}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl border border-neutral-850/40 bg-neutral-950/20 text-[11px] text-neutral-400">
                    Base foundational variation
                  </div>
                )}

                {progressionEx ? (
                  <button
                    id="variation-progression-btn"
                    onClick={() => onSelectExercise(progressionEx)}
                    className="flex flex-col text-left p-3 rounded-xl border border-neutral-800 bg-neutral-950/50 hover:bg-neutral-800/80 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400 mb-0.5">
                      <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Harder Variation</span>
                    </div>
                    <span className="text-xs font-semibold text-neutral-200">{progressionEx.name}</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl border border-neutral-850/40 bg-neutral-950/20 text-[11px] text-neutral-400">
                    Peak variation in current ladder
                  </div>
                )}
              </div>
            </div>

            {/* Safety Guidance */}
            <div className="space-y-2 pt-1 border-t border-neutral-800">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                Safety Guidance
              </h4>
              <div className="p-3 rounded-xl bg-neutral-950/40 border border-neutral-850 text-xs text-neutral-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-neutral-300 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{exercise.instructions.safetyNotes}</span>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 border-t border-neutral-800 bg-neutral-900/90 flex items-center justify-end">
            <Button
              id="detail-close-bottom-btn"
              variant="secondary"
              size="md"
              fullWidth
              onClick={onClose}
            >
              Back to Catalog
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
