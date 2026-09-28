import React from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = 'button',
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/20 active:bg-brand-700',
    secondary:
      'bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-surface-dark-card dark:hover:bg-surface-dark-hover dark:text-gray-200 border border-gray-200/80 dark:border-surface-dark-border',
    outline:
      'bg-transparent border border-gray-300 dark:border-surface-dark-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-surface-dark-hover',
    ghost:
      'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-surface-dark-hover hover:text-gray-900 dark:hover:text-gray-100',
    danger:
      'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 hover:bg-red-500/20 active:bg-red-500/30',
    icon:
      'p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-lg min-w-[36px] min-h-[36px]',
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-3.5 py-2 gap-2',
    lg: 'text-base px-4 py-2.5 gap-2.5',
    icon: 'p-2',
  };

  const chosenSize = variant === 'icon' ? sizes.icon : sizes[size];

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${chosenSize} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        LeftIcon && <LeftIcon className="w-4 h-4 shrink-0" />
      )}
      {children}
      {!isLoading && RightIcon && <RightIcon className="w-4 h-4 shrink-0" />}
    </button>
  );
}

export default Button;
