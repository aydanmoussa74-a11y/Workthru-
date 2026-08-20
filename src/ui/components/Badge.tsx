import React from 'react';
import { classNames } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'outline' | 'accent';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  id,
  variant = 'neutral',
  className,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full whitespace-nowrap select-none';

  const variantClasses = {
    neutral: 'bg-neutral-800 text-neutral-300 border border-neutral-700/60',
    success: 'bg-neutral-800 text-emerald-400 border border-emerald-800/40',
    outline: 'border border-neutral-700 text-neutral-300 bg-transparent',
    accent: 'bg-neutral-100 text-neutral-900 font-semibold',
  }[variant];

  return (
    <span
      id={id}
      className={classNames(baseClasses, variantClasses, className)}
      {...props}
    >
      {children}
    </span>
  );
};
