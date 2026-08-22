import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../../../ui/components/Card';
import { Button } from '../../../ui/components/Button';
import { Badge } from '../../../ui/components/Badge';
import {
  TrendingUp,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowUpRight,
} from '../../../ui/icons';
import { defaultProgressionRepository } from '../../../domain/progression/repository';
import { MovementLadder } from '../../../domain/progression/types';
import { ProgressionLadderCard } from './ProgressionLadderCard';

interface ProgressionLaddersSectionProps {
  onPreferencesChanged?: () => void;
}

export const ProgressionLaddersSection: React.FC<ProgressionLaddersSectionProps> = ({
  onPreferencesChanged,
}) => {
  const [ladders, setLadders] = useState<MovementLadder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCustomPreferences, setHasCustomPreferences] = useState(false);

  const loadLadders = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allLadders, prefs] = await Promise.all([
        defaultProgressionRepository.getAllMovementLadders(),
        defaultProgressionRepository.getProgressionPreferences(),
      ]);
      setLadders(allLadders);
      setHasCustomPreferences(Object.keys(prefs.preferredVariations).length > 0);
    } catch (err) {
      console.error('Failed to load progression ladders:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLadders();
  }, [loadLadders]);

  const handleAcceptProgression = async (familyId: string, targetVariationId: string) => {
    await defaultProgressionRepository.setPreferredVariation(familyId, targetVariationId, 'ACCEPTED');
    await loadLadders();
    onPreferencesChanged?.();
  };

  const handleKeepCurrent = async (familyId: string, currentVariationId: string) => {
    await defaultProgressionRepository.setPreferredVariation(familyId, currentVariationId, 'DECLINED');
    await loadLadders();
    onPreferencesChanged?.();
  };

  const handleSelectVariation = async (familyId: string, selectedVariationId: string) => {
    await defaultProgressionRepository.setPreferredVariation(familyId, selectedVariationId, 'ACCEPTED');
    await loadLadders();
    onPreferencesChanged?.();
  };

  const handleResetOverrides = async () => {
    await defaultProgressionRepository.resetPreferredVariations();
    await loadLadders();
    onPreferencesChanged?.();
  };

  // Count active recommendations
  const progressReadyCount = ladders.filter((l) => l.evaluation.recommendation === 'PROGRESS').length;
  const regressReadyCount = ladders.filter((l) => l.evaluation.recommendation === 'REGRESS').length;

  if (isLoading) {
    return (
      <div className="py-6 text-center text-xs font-mono text-neutral-500">
        Loading progression engine ladders...
      </div>
    );
  }

  return (
    <section id="progression-engine-section" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-neutral-400">
              Progression Engine
            </span>
            <Badge variant="outline" size="sm">
              Rule v1 • Deterministic
            </Badge>
          </div>
          <h3 className="text-lg font-bold text-neutral-100">Movement Mastery Ladders</h3>
        </div>

        {hasCustomPreferences && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetOverrides}
            className="text-xs text-neutral-400 hover:text-neutral-200 self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Reset Custom Variations
          </Button>
        )}
      </div>

      {/* Overview Status Banner if recommendations exist */}
      {progressReadyCount > 0 && (
        <Card padding="sm" className="bg-emerald-950/40 border-emerald-800/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-emerald-200">
                {progressReadyCount} Progression Recommendation{progressReadyCount === 1 ? '' : 's'} Ready
              </p>
              <p className="text-[11px] text-emerald-400/80">
                You have demonstrated consistent completion in recent workouts. You can choose to upgrade below.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Ladders List */}
      <div className="space-y-4">
        {ladders.map((ladder) => (
          <ProgressionLadderCard
            key={ladder.familyId}
            ladder={ladder}
            onAcceptProgression={handleAcceptProgression}
            onKeepCurrent={handleKeepCurrent}
            onSelectVariation={handleSelectVariation}
          />
        ))}
      </div>
    </section>
  );
};
