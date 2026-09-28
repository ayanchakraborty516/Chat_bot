import React from 'react';
import { Search, X } from 'lucide-react';

export function SearchInput({ value = '', onChange, placeholder = 'Search conversations...' }) {
  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
        <Search className="w-3.5 h-3.5" />
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 bg-gray-100 dark:bg-surface-dark-card border border-gray-200/80 dark:border-surface-dark-border rounded-xl text-xs text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-500/50 transition-all"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
