import React, { useState, useEffect } from 'react';
import { Card } from '../../../ui/components/Card';
import { Button } from '../../../ui/components/Button';
import { Badge } from '../../../ui/components/Badge';
import {
  WorkoutRequest,
  TrainingFocus,
} from '../../../domain/workouts/types';
import {
  ExperienceLevel,
  EquipmentRequirement,
} from '../../../domain/exercises/types';
import { Sliders, Zap, Clock, ShieldCheck, Dumbbell, Layers, RotateCcw } from '../../../ui/icons';
import { defaultPreferencesRepository } from '../../../data/repositories';

interface WorkoutBuilderFormProps {
  onGenerate: (req: WorkoutRequest) => void;
  isGenerating: boolean;
  initialRequest?: WorkoutRequest;
}

const DURATIONS = [5, 8, 10, 15, 20, 30, 45];

const FOCUS_OPTIONS: { label: string; value: TrainingFocus }[] = [
  { label: 'Full Body', value: 'FULL_BODY' },
  { label: 'Push', value: 'PUSH' },
  { label: 'Legs', value: 'LEGS' },
  { label: 'Core', value: 'CORE' },
  { label: 'Mobility', value: 'MOBILITY' },
  { label: 'Cardio', value: 'CARDIO' },
];

const EXPERIENCE_OPTIONS: { label: string; value: ExperienceLevel }[] = [
  { label: 'Beginner', value: 'BEGINNER' },
  { label: 'Intermediate', value: 'INTERMEDIATE' },
  { label: 'Advanced', value: 'ADVANCED' },
];

const EQUIPMENT_OPTIONS: { label: string; value: EquipmentRequirement }[] = [
  { label: 'No Equipment (Bodyweight)', value: 'NONE' },
  { label: 'Wall Support', value: 'WALL' },
  { label: 'Chair / Elevated Surface', value: 'CHAIR' },
];

export const WorkoutBuilderForm: React.FC<WorkoutBuilderFormProps> = ({
  onGenerate,
  isGenerating,
  initialRequest,
}) => {
  const [durationMin, setDurationMin] = useState<number>(initialRequest?.durationMin || 15);
  const [focus, setFocus] = useState<TrainingFocus>(initialRequest?.trainingFocus || 'FULL_BODY');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    initialRequest?.experienceLevel || 'BEGINNER'
  );
  const [equipment, setEquipment] = useState<EquipmentRequirement[]>(
    initialRequest?.equipment || ['NONE']
  );
  const [includeWarmup, setIncludeWarmup] = useState<boolean>(
    initialRequest?.includeWarmup !== undefined ? initialRequest.includeWarmup : true
  );
  const [includeCooldown, setIncludeCooldown] = useState<boolean>(
    initialRequest?.includeCooldown !== undefined ? initialRequest.includeCooldown : true
  );

  // Load saved preferences if no explicit initial request is provided
  useEffect(() => {
    if (!initialRequest) {
      defaultPreferencesRepository.getTrainingPreferences().then((prefs) => {
        setDurationMin(prefs.defaultDurationMin);
        setFocus(prefs.trainingFocus);
        setExperienceLevel(prefs.experienceLevel);
        setEquipment(prefs.equipment);
        setIncludeWarmup(prefs.includeWarmup);
        setIncludeCooldown(prefs.includeCooldown);
      });
    }
  }, [initialRequest]);

  const toggleEquipment = (eq: EquipmentRequirement) => {
    if (eq === 'NONE') {
      setEquipment(['NONE']);
      return;
    }

    const withoutNone = equipment.filter((e) => e !== 'NONE');
    if (withoutNone.includes(eq)) {
      const next = withoutNone.filter((e) => e !== eq);
      setEquipment(next.length === 0 ? ['NONE'] : next);
    } else {
      setEquipment([...withoutNone, eq]);
    }
  };

  const handleReset = () => {
    setDurationMin(15);
    setFocus('FULL_BODY');
    setExperienceLevel('BEGINNER');
    setEquipment(['NONE']);
    setIncludeWarmup(true);
    setIncludeCooldown(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate({
      durationMin,
      trainingFocus: focus,
      experienceLevel,
      equipment,
      includeWarmup,
      includeCooldown,
    });
  };

  return (
    <form id="workout-builder-form" onSubmit={handleSubmit} className="space-y-4">
      <Card id="builder-controls-card" className="border-neutral-750 bg-neutral-900/90 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-neutral-300" />
            <h3 className="text-sm font-semibold text-neutral-100">Workout Generator Constraints</h3>
          </div>
          <button
            type="button"
            id="reset-builder-btn"
            onClick={handleReset}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors min-h-[44px] px-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        {/* 1. Duration Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              Target Duration
            </label>
            <span className="text-xs font-semibold text-neutral-100 font-mono">
              {durationMin} minutes
            </span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5" role="radiogroup" aria-label="Duration in minutes">
            {DURATIONS.map((dur) => (
              <button
                key={dur}
                type="button"
                id={`duration-${dur}m-btn`}
                onClick={() => setDurationMin(dur)}
                className={`min-h-[44px] py-2 px-1 text-xs font-mono rounded-lg border transition-all text-center ${
                  durationMin === dur
                    ? 'bg-neutral-100 text-neutral-950 font-bold border-neutral-100'
                    : 'bg-neutral-950/70 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {dur}m
              </button>
            ))}
          </div>
        </div>

        {/* 2. Training Focus */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            Movement Focus
          </label>

          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Movement Focus">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                id={`focus-${f.value.toLowerCase()}-btn`}
                onClick={() => setFocus(f.value)}
                className={`min-h-[44px] py-2 px-2 text-xs rounded-lg border transition-all text-center ${
                  focus === f.value
                    ? 'bg-neutral-100 text-neutral-950 font-bold border-neutral-100'
                    : 'bg-neutral-950/70 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Experience Level */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
            Experience / Difficulty
          </label>

          <div className="grid grid-cols-3 gap-1.5" role="radiogroup" aria-label="Experience Level">
            {EXPERIENCE_OPTIONS.map((lvl) => (
              <button
                key={lvl.value}
                type="button"
                id={`level-${lvl.value.toLowerCase()}-btn`}
                onClick={() => setExperienceLevel(lvl.value)}
                className={`min-h-[44px] py-2 px-2 text-xs rounded-lg border transition-all text-center ${
                  experienceLevel === lvl.value
                    ? 'bg-neutral-100 text-neutral-950 font-bold border-neutral-100'
                    : 'bg-neutral-950/70 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Equipment Requirements */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5 text-neutral-400" />
            Available Equipment
          </label>

          <div className="grid grid-cols-1 gap-1.5">
            {EQUIPMENT_OPTIONS.map((eq) => {
              const isSelected =
                eq.value === 'NONE'
                  ? equipment.includes('NONE')
                  : equipment.includes(eq.value);

              return (
                <button
                  key={eq.value}
                  type="button"
                  id={`equipment-${eq.value.toLowerCase()}-btn`}
                  onClick={() => toggleEquipment(eq.value)}
                  className={`min-h-[44px] py-2.5 px-3 text-xs rounded-lg border transition-all text-left flex items-center justify-between ${
                    isSelected
                      ? 'bg-neutral-850 text-neutral-100 font-medium border-neutral-600'
                      : 'bg-neutral-950/70 text-neutral-400 border-neutral-850 hover:border-neutral-750'
                  }`}
                >
                  <span>{eq.label}</span>
                  <Badge variant={isSelected ? 'accent' : 'outline'} className="text-[10px] py-0">
                    {isSelected ? 'Enabled' : 'Off'}
                  </Badge>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Section Structure Toggles */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800">
          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              id="include-warmup-toggle"
              checked={includeWarmup}
              onChange={(e) => setIncludeWarmup(e.target.checked)}
              className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-xs text-neutral-200">Include Warm-up</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              id="include-cooldown-toggle"
              checked={includeCooldown}
              onChange={(e) => setIncludeCooldown(e.target.checked)}
              className="w-4 h-4 rounded bg-neutral-800 border-neutral-700 text-neutral-100 focus:ring-0 focus:ring-offset-0"
            />
            <span className="text-xs text-neutral-200">Include Cooldown</span>
          </label>
        </div>

        {/* Submit Action */}
        <Button
          id="generate-workout-submit-btn"
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isGenerating}
        >
          <Zap className="w-4 h-4 fill-current mr-1.5" />
          {isGenerating ? 'Generating Workout Plan...' : 'Generate Structured Workout'}
        </Button>
      </Card>
    </form>
  );
};
