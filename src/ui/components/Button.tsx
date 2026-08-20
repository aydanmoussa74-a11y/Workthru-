import React from 'react';
import { classNames } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  id,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 disabled:opacity-50 disabled:pointer-events-none select-none rounded-xl active:scale-[0.98] cursor-pointer';

  const variantClasses = {
    primary: 'bg-neutral-100 text-neutral-950 hover:bg-neutral-200 active:bg-neutral-300 font-semibold shadow-sm',
    secondary: 'bg-neutral-800 text-neutral-100 hover:bg-neutral-700 active:bg-neutral-650 border border-neutral-700',
    outline: 'border border-neutral-700 text-neutral-200 hover:bg-neutral-800/60 active:bg-neutral-800',
    ghost: 'text-neutral-300 hover:bg-neutral-800/50 active:bg-neutral-800 text-neutral-200',
  }[variant];

  const sizeClasses = {
    sm: 'text-xs h-9 px-3 py-1.5 gap-1.5',
    md: 'text-sm h-11 px-4 py-2 gap-2 min-h-[44px]', // Mobile friendly 44px min height
    lg: 'text-base h-13 px-6 py-3 gap-2.5 min-h-[48px]',
  }[size];

  return (
    <button
      id={id}
      disabled={disabled}
      className={classNames(
        baseClasses,
        variantClasses,
        sizeClasses,
        fullWidth ? 'w-full' : '',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
