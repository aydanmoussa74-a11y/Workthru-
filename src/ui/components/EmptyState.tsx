import React from 'react';
import { classNames } from '../../lib/utils';

export interface EmptyStateProps {
  id?: string;
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      id={id}
      className={classNames(
        'flex flex-col items-center justify-center text-center p-8 rounded-xl border border-neutral-850 bg-neutral-900/40 my-4',
        className
      )}
    >
      {icon && (
        <div className="w-12 h-12 rounded-xl bg-neutral-800/80 border border-neutral-750 flex items-center justify-center text-neutral-400 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-neutral-200 tracking-tight mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-400 max-w-xs leading-relaxed mb-5">{description}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
