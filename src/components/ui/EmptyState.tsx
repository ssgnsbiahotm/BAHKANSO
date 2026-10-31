import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && <div className="text-muted mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-primary mb-1">{title}</h3>
      {message && <p className="text-sm text-muted max-w-sm">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Chargement...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-10 h-10 border-3 border-default border-t-success rounded-full animate-spin mb-3" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-12 h-12 bg-danger-soft text-danger rounded-full flex items-center justify-center mb-3 text-xl">!</div>
      <p className="text-sm text-danger mb-3">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="px-4 py-2 text-sm bg-danger text-white rounded-lg hover:bg-danger">
          Réessayer
        </button>
      )}
    </div>
  );
}
