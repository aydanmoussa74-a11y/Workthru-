import React from 'react';
import { classNames } from '../../lib/utils';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const IconButton: React.FC<IconButtonProps> = ({
  id,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-50 disabled:pointer-events-none rounded-xl active:scale-[0.96] cursor-pointer';

  const variantClasses = {
    primary: 'bg-neutral-100 text-neutral-950 hover:bg-neutral-200',
    secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700',
    ghost: 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800/60',
    outline: 'border border-neutral-800 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100',
  }[variant];

  const sizeClasses = {
    sm: 'w-8 h-8 min-w-[32px] min-h-[32px]',
    md: 'w-11 h-11 min-w-[44px] min-h-[44px]', // Mobile friendly min-target
    lg: 'w-13 h-13 min-w-[52px] min-h-[52px]',
  }[size];

  return (
    <button
      id={id}
      aria-label={ariaLabel}
      className={classNames(baseClasses, variantClasses, sizeClasses, className)}
      {...props}
    >
      {children}
    </button>
  );
};
