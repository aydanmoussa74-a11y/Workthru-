import React, { useState } from 'react';
import { Card } from '../../../ui/components/Card';
import { Badge } from '../../../ui/components/Badge';
import { Button } from '../../../ui/components/Button';
import {
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers,
  Sparkles,
  Info,
  Check,
} from '../../../ui/icons';
import { MovementLadder } from '../../../domain/progression/types';
import { Exercise } from '../../../domain/exercises/types';

interface ProgressionLadderCardProps {
  ladder: MovementLadder;
  onAcceptProgression: (familyId: string, targetVariationId: string) => Promise<void>;
  onKeepCurrent: (familyId: string, currentVariationId: string) => Promise<void>;
  onSelectVariation: (familyId: string, selectedVariationId: string) => Promise<void>;
}

export const ProgressionLadderCard: React.FC<ProgressionLadderCardProps> = ({
  ladder,
  onAcceptProgression,
  onKeepCurrent,
  onSelectVariation,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { evaluation, activeExercise, activeExerciseIndex, totalLevels, exercises, familyName, familyId } = ladder;
  const { recommendation, confidence, explanation, evidence, targetExerciseName, targetExerciseId } = evaluation;

  const handleAction = async (action: () => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action();
    } finally {
      setIsProcessing(false);
    }
  };

  const renderRecommendationBadge = () => {
    switch (recommendation) {
      case 'PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
            <ArrowUpRight className="w-3.5 h-3.5" />
            Progression Ready
          </span>
        );
      case 'REGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/80">
            <ArrowDownRight className="w-3.5 h-3.5" />
            Regression Option
          </span>
        );
      case 'NO_PROGRESSION_AVAILABLE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/80">
            <Sparkles className="w-3.5 h-3.5" />
            Highest Variation
          </span>
        );
      case 'MAINTAIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800 text-neutral-300 border border-neutral-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
            Maintaining Rhythm
          </span>
        );
      case 'INSUFFICIENT_DATA':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-neutral-800/60 text-neutral-400 border border-neutral-700/50">
            <Info className="w-3.5 h-3.5" />
            Building Baseline
          </span>
        );
    }
  };

  return (
    <Card
      id={`ladder-card-${familyId}`}
      padding="md"
      className="bg-neutral-900/90 border-neutral-800 hover:border-neutral-700 transition-colors space-y-4"
    >
      {/* Header & Active Variation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Movement Ladder
            </span>
            <span className="text-xs text-neutral-400">•</span>
            <span className="text-xs font-mono text-neutral-400">
              Level {activeExerciseIndex + 1} of {totalLevels}
            </span>
          </div>
          <h4 className="text-base font-bold text-neutral-100">{familyName}</h4>
        </div>
        <div>{renderRecommendationBadge()}</div>
      </div>

      {/* Stepped Visual Ladder Meter */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>Foundational</span>
          <span>Advanced</span>
        </div>
        <div className="grid grid-flow-col auto-cols-fr gap-1.5 h-2">
          {exercises.map((ex, idx) => {
            const isActive = idx === activeExerciseIndex;
            const isCompleted = idx < activeExerciseIndex;
            return (
              <div
                key={ex.id}
                title={`Level ${idx + 1}: ${ex.name}`}
                className={`h-full rounded-xs transition-all ${
                  isActive
                    ? 'bg-emerald-400 ring-2 ring-emerald-400/30'
                    : isCompleted
                    ? 'bg-neutral-600'
                    : 'bg-neutral-800'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Active Exercise Detail */}
      <div className="bg-neutral-950/60 rounded-lg p-3 border border-neutral-800/60 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-emerald-400 font-semibold">
                Current Active:
              </span>
              <Badge variant="outline" size="sm">
                {activeExercise.experienceLevel}
              </Badge>
              {activeExercise.equipment !== 'NONE' && (
                <Badge variant="neutral" size="sm">
                  {activeExercise.equipment}
                </Badge>
              )}
            </div>
            <p className="text-sm font-semibold text-neutral-100 mt-0.5">
              {activeExercise.name}
            </p>
          </div>
        </div>
        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
          {activeExercise.description}
        </p>
      </div>

      {/* Recommendation Evaluation Card */}
      <div
        className={`rounded-lg p-3.5 text-xs space-y-3 ${
          recommendation === 'PROGRESS'
            ? 'bg-emerald-950/40 border border-emerald-800/60'
            : recommendation === 'REGRESS'
            ? 'bg-amber-950/40 border border-amber-800/60'
            : 'bg-neutral-950/40 border border-neutral-800/60'
        }`}
      >
        <p className="text-neutral-200 leading-relaxed font-sans">{explanation}</p>

        {/* Evidence Data Pill Row */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-neutral-400 pt-1 border-t border-neutral-800/40">
          <span>
            Window History:{' '}
            <strong className="text-neutral-200">
              {evidence.completedExposures} completed
            </strong>{' '}
            / {evidence.totalExposures} sessions
          </span>
          <span>•</span>
          <span>
            Consecutive:{' '}
            <strong className="text-neutral-200">
              {evidence.consecutiveCompleted}
            </strong>
          </span>
        </div>

        {/* Action Decision Buttons for User Choice */}
        {recommendation === 'PROGRESS' && targetExerciseId && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              id={`accept-progression-btn-${familyId}`}
              variant="primary"
              size="sm"
              disabled={isProcessing}
              onClick={() => handleAction(() => onAcceptProgression(familyId, targetExerciseId))}
              className="text-xs"
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              Switch to {targetExerciseName}
            </Button>
            <Button
              id={`keep-current-btn-${familyId}`}
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              onClick={() => handleAction(() => onKeepCurrent(familyId, activeExercise.id))}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              Keep {activeExercise.name}
            </Button>
          </div>
        )}

        {recommendation === 'REGRESS' && targetExerciseId && (
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              id={`accept-regression-btn-${familyId}`}
              variant="secondary"
              size="sm"
              disabled={isProcessing}
              onClick={() => handleAction(() => onAcceptProgression(familyId, targetExerciseId))}
              className="text-xs border-amber-800/80 text-amber-300"
            >
              <ArrowDownRight className="w-3.5 h-3.5 mr-1" />
              Switch to {targetExerciseName}
            </Button>
            <Button
              id={`keep-current-regress-btn-${familyId}`}
              variant="ghost"
              size="sm"
              disabled={isProcessing}
              onClick={() => handleAction(() => onKeepCurrent(familyId, activeExercise.id))}
              className="text-xs text-neutral-400 hover:text-neutral-200"
            >
              Keep Current
            </Button>
          </div>
        )}
      </div>

      {/* Expandable Full Ladder Breakdown */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-xs text-neutral-400 hover:text-neutral-200 py-1 transition-colors"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            {isExpanded ? 'Hide Ladder Steps' : `View All ${totalLevels} Ladder Steps`}
          </span>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2 pt-2 border-t border-neutral-800">
            {exercises.map((ex, idx) => {
              const isSelected = ex.id === activeExercise.id;
              return (
                <div
                  key={ex.id}
                  className={`p-2.5 rounded-md text-xs flex items-center justify-between gap-3 transition-colors ${
                    isSelected
                      ? 'bg-neutral-800/90 border border-emerald-500/40 text-neutral-100'
                      : 'bg-neutral-950/40 border border-neutral-800/60 text-neutral-400'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-neutral-400">
                        Step {idx + 1}
                      </span>
                      <span className="font-semibold text-neutral-200 truncate">
                        {ex.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        ({ex.experienceLevel.toLowerCase()})
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {ex.description}
                    </p>
                  </div>

                  <div>
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 font-mono">
                        <Check className="w-3.5 h-3.5" />
                        Active
                      </span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isProcessing}
                        onClick={() => handleAction(() => onSelectVariation(familyId, ex.id))}
                        className="text-[11px] py-1 px-2 text-neutral-300 hover:text-white"
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};
