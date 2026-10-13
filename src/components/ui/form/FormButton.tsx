import React from 'react';

interface FormButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isLoading?: boolean;
}

export function FormButton({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  ...props
}: FormButtonProps) {
  // Base classes
  const baseClasses = 'flex items-center justify-center gap-2';

  // Variant classes
  const variantClasses = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700'
  }[variant];

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg'
  }[size];

  // Loading state classes
  const loadingClasses = isLoading
    ? 'opacity-70 cursor-not-allowed'
    : '';

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${className} ${loadingClasses}
                 rounded-md font-medium transition-colors disabled:opacity-50`}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <span className="flex items-center gap-1 animate-spin">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-13.82 0m0 0A8.003 8.003 0 0017.418 11m0 0h4.582"/>
          </svg>
          <span>Enregistrement...</span>
        </span>
      )}
      {!isLoading && children}
    </button>
  );
}