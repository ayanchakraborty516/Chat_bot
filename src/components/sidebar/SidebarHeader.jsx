import React from 'react';
import { Sparkles, Plus, X, ChevronLeft } from 'lucide-react';
import SearchInput from './SearchInput';

export function SidebarHeader({
  onNewChat,
  onClose,
  searchQuery,
  onSearchChange,
  isMobile = false,
}) {
  return (
    <div className="p-3.5 border-b border-gray-200/80 dark:border-surface-dark-border space-y-3 shrink-0 select-none">
      {/* Brand & Close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/25">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-gray-900 dark:text-white tracking-tight flex items-center gap-1.5">
              Ayan AI
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-300 font-normal">
                v3.8
              </span>
            </h1>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-surface-dark-hover transition-colors"
            aria-label={isMobile ? 'Close navigation drawer' : 'Collapse sidebar'}
          >
            {isMobile ? <X className="w-5 h-5" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* New Chat Primary Button */}
      <button
        onClick={onNewChat}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-sm shadow-brand-500/20 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" />
        <span>New Conversation</span>
      </button>

      {/* Search Input */}
      <SearchInput value={searchQuery} onChange={onSearchChange} />
    </div>
  );
}

export default SidebarHeader;
