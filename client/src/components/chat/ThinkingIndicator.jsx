import React from 'react';
import { Sparkles, Globe } from 'lucide-react';

export function ThinkingIndicator({ status = 'Ayan AI is thinking', isSearching = false }) {
  const isSearchState = isSearching || status.toLowerCase().includes('search') || status.toLowerCase().includes('web');

  return (
    <div className="flex items-start gap-3 py-4 animate-fade-in select-none">
      {/* Bot Avatar */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/30 shrink-0">
        {isSearchState ? (
          <Globe className="w-4 h-4 animate-spin text-brand-100" style={{ animationDuration: '4s' }} />
        ) : (
          <Sparkles className="w-4 h-4 animate-spin text-brand-100" style={{ animationDuration: '3s' }} />
        )}
      </div>

      {/* Bubble */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-surface-dark-card border border-gray-200/80 dark:border-surface-dark-border text-gray-500 dark:text-gray-400 text-xs">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          {status}
        </span>
        <div className="flex items-center gap-1 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

export default ThinkingIndicator;
