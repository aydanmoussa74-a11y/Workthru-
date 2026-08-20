import React from 'react';
import { classNames } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  id,
  variant = 'default',
  padding = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses = 'rounded-xl border transition-all text-neutral-100';

  const variantClasses = {
    default: 'bg-neutral-900/90 border-neutral-800/80',
    interactive:
      'bg-neutral-900/90 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-900 cursor-pointer active:scale-[0.99]',
    subtle: 'bg-neutral-950 border-neutral-850',
  }[variant];

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3.5',
    md: 'p-5',
    lg: 'p-6',
  }[padding];

  return (
    <div
      id={id}
      className={classNames(baseClasses, variantClasses, paddingClasses, className)}
      {...props}
    >
      {children}
    </div>
  );
};
