import React from 'react';
import { Menu, Plus, Settings, Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { MODELS } from '../../config/constants.js';

export function ChatHeader({ onToggleSidebar }) {
  const { isDark, toggleTheme } = useTheme();
  const { selectedModel, setIsSettingsOpen } = useSettings();
  const { createNewChat, activeConversation } = useChat();

  const currentModelInfo = MODELS.find((m) => m.id === selectedModel) || MODELS[0];

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between h-14 px-3 sm:px-5 bg-white/80 dark:bg-[#0c0e14]/80 backdrop-blur-md border-b border-gray-200/80 dark:border-surface-dark-border select-none">
      {/* Left section: Hamburger for mobile + current title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-hover transition-colors"
          aria-label="Toggle sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
            {activeConversation?.title || 'Ayan AI'}
          </span>

          {/* Model Badge */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-brand-500/10 text-brand-600 dark:text-brand-300 hover:bg-brand-500/20 transition-colors border border-brand-500/20"
            title="Change active model in settings"
          >
            <Sparkles className="w-3 h-3 text-brand-500" />
            <span>{currentModelInfo.name}</span>
          </button>
        </div>
      </div>

      {/* Right section: New Chat, Theme Toggle, Settings */}
      <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
        <button
          onClick={() => createNewChat()}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-surface-dark-card hover:bg-gray-200 dark:hover:bg-surface-dark-hover border border-gray-200/80 dark:border-surface-dark-border rounded-xl transition-all active:scale-95"
          title="Start new conversation"
        >
          <Plus className="w-4 h-4 text-brand-500" />
          <span className="hidden md:inline">New Chat</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-hover transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-surface-dark-hover transition-colors"
          aria-label="Open settings"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}

export default ChatHeader;
