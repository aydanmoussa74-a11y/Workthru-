import React, { useState } from 'react';
import { Card } from '../../../ui/components/Card';
import { Button } from '../../../ui/components/Button';
import { Badge } from '../../../ui/components/Badge';
import { Workout, WorkoutExercise } from '../../../domain/workouts/types';
import { Exercise } from '../../../domain/exercises/types';
import { ExerciseRepository } from '../../../domain/exercises/repository';
import { ExerciseDetailModal } from '../../library/components/ExerciseDetailModal';
import {
  Clock,
  Dumbbell,
  ShieldCheck,
  RotateCcw,
  Play,
  CheckCircle2,
  Info,
  Layers,
  ChevronRight,
  Flame,
} from '../../../ui/icons';

interface WorkoutPreviewProps {
  workout: Workout;
  exerciseRepo: ExerciseRepository;
  onReconfigure: () => void;
}

export const WorkoutPreview: React.FC<WorkoutPreviewProps> = ({
  workout,
  exerciseRepo,
  onReconfigure,
}) => {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPlayerNotice, setShowPlayerNotice] = useState(false);

  const formatDuration = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins === 0) return `${secs}s`;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const handleExerciseClick = async (exerciseId: string) => {
    const canonical = await exerciseRepo.getById(exerciseId);
    if (canonical) {
      setSelectedExercise(canonical);
      setIsModalOpen(true);
    }
  };

  const handleVariationSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  return (
    <div id="workout-preview" className="space-y-4">
      {/* 1. Workout Header Summary */}
      <Card id="workout-summary-card" className="border-neutral-750 bg-neutral-900">
        <div className="flex items-start justify-between gap-3 mb-2">
          <Badge variant="accent" id="workout-focus-tag">
            {workout.focus.replace(/_/g, ' ')}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-neutral-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-neutral-400" />
            <span>Target: {workout.requestedDurationMin}m</span>
          </div>
        </div>

        <h3 className="text-xl font-bold text-neutral-100 tracking-tight">
          {workout.title}
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5">{workout.subtitle}</p>
        <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
          {workout.description}
        </p>

        {/* Breakdown Badges */}
        <div className="grid grid-cols-3 gap-2 mt-4 p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-850 text-center">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-mono">Total Time</p>
            <p className="text-xs font-bold text-neutral-100 font-mono">
              {formatDuration(workout.estimatedDurationSec)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-mono">Work Time</p>
            <p className="text-xs font-bold text-neutral-100 font-mono">
              {formatDuration(workout.totalWorkSec)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-mono">Rest Time</p>
            <p className="text-xs font-bold text-neutral-100 font-mono">
              {formatDuration(workout.totalRestSec)}
            </p>
          </div>
        </div>

        {/* Metadata items */}
        <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-neutral-800 text-[11px] text-neutral-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-neutral-400" />
            {workout.experienceLevel}
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3 text-neutral-400" />
            {workout.equipment.length > 0 && workout.equipment[0] !== 'NONE'
              ? workout.equipment.join(', ')
              : 'No Equipment'}
          </span>
          <span className="flex items-center gap-1 font-mono">
            {workout.allExercises.length} Movements
          </span>
        </div>
      </Card>

      {/* 2. Structured Workout Sections */}
      <div className="space-y-3">
        {/* Warm-Up Section */}
        {workout.warmupExercises.length > 0 && (
          <section id="section-warmup" className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                Warm-Up Phase ({workout.warmupExercises.length} Movements)
              </h4>
            </div>
            <div className="space-y-1.5">
              {workout.warmupExercises.map((wex) => (
                <WorkoutExerciseRow
                  key={wex.id}
                  wex={wex}
                  onClick={() => handleExerciseClick(wex.exerciseId)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Main Work Section */}
        <section id="section-main" className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
              Main Work Circuit ({workout.mainExercises.length} Movements)
            </h4>
          </div>
          <div className="space-y-1.5">
            {workout.mainExercises.map((wex) => (
              <WorkoutExerciseRow
                key={wex.id}
                wex={wex}
                onClick={() => handleExerciseClick(wex.exerciseId)}
              />
            ))}
          </div>
        </section>

        {/* Cooldown Section */}
        {workout.cooldownExercises.length > 0 && (
          <section id="section-cooldown" className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-400/80" />
                Cooldown Phase ({workout.cooldownExercises.length} Movements)
              </h4>
            </div>
            <div className="space-y-1.5">
              {workout.cooldownExercises.map((wex) => (
                <WorkoutExerciseRow
                  key={wex.id}
                  wex={wex}
                  onClick={() => handleExerciseClick(wex.exerciseId)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 3. Deterministic Explainability Notice */}
      <Card id="generator-explainability" padding="sm" className="bg-neutral-900/40 border-neutral-850">
        <div className="flex items-start gap-2.5">
          <Info className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-neutral-200">
              Deterministic Workout Composition
            </p>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              This routine was generated purely through domain constraints matching your {workout.requestedDurationMin}m budget, {workout.focus.toLowerCase()} emphasis, {workout.experienceLevel.toLowerCase()} variation ladders, and verified equipment allowance.
            </p>
          </div>
        </div>
      </Card>

      {/* 4. Action Controls */}
      <div className="space-y-2 pt-2">
        <Button
          id="preview-start-btn"
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => setShowPlayerNotice(!showPlayerNotice)}
        >
          <Play className="w-4 h-4 fill-current mr-1.5" />
          Start Follow-Along Workout
        </Button>

        {showPlayerNotice && (
          <Card id="player-scheduled-notice" padding="sm" className="bg-neutral-900 border-neutral-750">
            <div className="flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-neutral-200">
                  Player Engine Scheduled for Phase 4
                </p>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  The interactive Training Player with timestamp-based countdown timers, audio cues, pause/resume, and session persistence will be connected in Phase 4.
                </p>
              </div>
            </div>
          </Card>
        )}

        <Button
          id="preview-reconfigure-btn"
          variant="secondary"
          fullWidth
          onClick={onReconfigure}
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Modify Parameters & Re-Generate
        </Button>
      </div>

      {/* Exercise Detail Modal for Form Cues */}
      {selectedExercise && (
        <ExerciseDetailModal
          exercise={selectedExercise}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          exerciseRepo={exerciseRepo}
          onSelectVariation={handleVariationSelect}
        />
      )}
    </div>
  );
};

interface WorkoutExerciseRowProps {
  wex: WorkoutExercise;
  onClick: () => void;
}

const WorkoutExerciseRow: React.FC<WorkoutExerciseRowProps> = ({ wex, onClick }) => {
  return (
    <Card
      id={`wex-row-${wex.id}`}
      padding="sm"
      className="bg-neutral-900/70 hover:bg-neutral-900 border-neutral-850 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-md bg-neutral-800 text-neutral-300 text-[11px] font-mono font-bold flex items-center justify-center shrink-0">
            {wex.order}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h5 className="text-xs font-semibold text-neutral-100">{wex.name}</h5>
              <Badge variant="outline" className="text-[9px] py-0 px-1 font-mono">
                {wex.category}
              </Badge>
            </div>
            {wex.formCueSnippet && (
              <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                {wex.formCueSnippet}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-xs font-bold text-neutral-200 font-mono block">
              {wex.mode === 'timed' ? `${wex.targetDurationSec}s` : `${wex.targetReps} reps`}
            </span>
            {wex.restAfterSec > 0 && (
              <span className="text-[10px] text-neutral-400 font-mono">
                Rest: {wex.restAfterSec}s
              </span>
            )}
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
        </div>
      </div>
    </Card>
  );
};
