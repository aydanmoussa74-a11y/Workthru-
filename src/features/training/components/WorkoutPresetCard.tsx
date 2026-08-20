import React from 'react';
import { Card } from '../../../ui/components/Card';
import { Badge } from '../../../ui/components/Badge';
import { Clock, Dumbbell, ShieldCheck, ChevronRight } from '../../../ui/icons';
import { WorkoutRequest } from '../../../domain/workouts/types';

interface WorkoutPresetCardProps {
  id: string;
  title: string;
  subtitle: string;
  request: WorkoutRequest;
  onSelect: (req: WorkoutRequest) => void;
}

export const WorkoutPresetCard: React.FC<WorkoutPresetCardProps> = ({
  id,
  title,
  subtitle,
  request,
  onSelect,
}) => {
  return (
    <Card
      id={id}
      padding="sm"
      className="bg-neutral-900/60 hover:bg-neutral-900 border-neutral-800 transition-colors cursor-pointer text-left"
      onClick={() => onSelect(request)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-neutral-100">{title}</h4>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono">
              {request.durationMin}m
            </Badge>
          </div>
          <p className="text-xs text-neutral-400 leading-snug">{subtitle}</p>

          <div className="flex items-center gap-3 pt-1 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-neutral-400" />
              {request.experienceLevel || 'Beginner'}
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-neutral-400" />
              {request.equipment && request.equipment.length > 0 && request.equipment[0] !== 'NONE'
                ? request.equipment.join(', ')
                : 'No Equipment'}
            </span>
          </div>
        </div>

        <div className="w-8 h-8 rounded-lg bg-neutral-850 flex items-center justify-center text-neutral-400 shrink-0">
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>
    </Card>
  );
};
