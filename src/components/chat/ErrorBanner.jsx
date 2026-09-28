import React from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import { Button } from '../common/Button';

export function ErrorBanner({ errorBanner, onRetry, onDismiss }) {
  if (!errorBanner) return null;

  const isStorageError = Boolean(errorBanner.isStorageError);
  const title = errorBanner.title || (isStorageError ? 'Storage Notice' : 'Request Failed');

  return (
    <div
      className={`mx-4 my-2 p-3.5 rounded-xl border flex items-start justify-between gap-3 text-xs animate-fade-in ${
        isStorageError
          ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-300'
          : 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-300'
      }`}
    >
      <div className="flex items-start gap-2.5 overflow-hidden">
        <AlertCircle
          className={`w-4 h-4 shrink-0 mt-0.5 ${
            isStorageError ? 'text-amber-500' : 'text-red-500'
          }`}
        />
        <div className="space-y-1">
          <p
            className={`font-semibold ${
              isStorageError
                ? 'text-amber-800 dark:text-amber-200'
                : 'text-red-800 dark:text-red-200'
            }`}
          >
            {title}
          </p>
          <p
            className={`leading-relaxed ${
              isStorageError
                ? 'text-amber-600 dark:text-amber-300'
                : 'text-red-600 dark:text-red-300'
            }`}
          >
            {errorBanner.message ||
              'Ayan AI is temporarily busy. Please try again in a few seconds.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {!isStorageError && onRetry && (
          <Button
            size="sm"
            variant="danger"
            leftIcon={RotateCcw}
            onClick={() => onRetry()}
            className="!py-1 !px-2.5 text-xs"
          >
            Retry
          </Button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`p-1 rounded-lg transition-colors ${
              isStorageError
                ? 'text-amber-400 hover:text-amber-600 dark:hover:text-amber-200 hover:bg-amber-500/10'
                : 'text-red-400 hover:text-red-600 dark:hover:text-red-200 hover:bg-red-500/10'
            }`}
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorBanner;
