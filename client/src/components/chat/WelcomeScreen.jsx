import React, { useState } from 'react';
import {
  Sparkles,
  Code,
  Cpu,
  PenTool,
  ArrowRight,
  Mic,
  Paperclip,
  Zap,
} from 'lucide-react';
import { STARTER_PROMPT_CATEGORIES } from '../../config/constants.js';
import { useChat } from '../../context/ChatContext.jsx';

export function WelcomeScreen({ onSelectPrompt }) {
  const { sendMessage } = useChat();
  const [activeCategory, setActiveCategory] = useState(STARTER_PROMPT_CATEGORIES[0].id);

  const currentCategory =
    STARTER_PROMPT_CATEGORIES.find((c) => c.id === activeCategory) ||
    STARTER_PROMPT_CATEGORIES[0];

  const handleCardClick = (promptText) => {
    if (onSelectPrompt) {
      onSelectPrompt(promptText);
    } else {
      sendMessage(promptText);
    }
  };

  const getCategoryIcon = (iconName) => {
    switch (iconName) {
      case 'Code':
        return <Code className="w-3.5 h-3.5" />;
      case 'Cpu':
        return <Cpu className="w-3.5 h-3.5" />;
      case 'PenTool':
        return <PenTool className="w-3.5 h-3.5" />;
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full animate-fade-in select-none my-auto">
      {/* Hero Icon */}
      <div className="relative mb-4">
        <div className="absolute -inset-2 bg-gradient-to-r from-brand-600 to-indigo-600 rounded-2xl blur-lg opacity-40 animate-pulse-subtle" />
        <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-xl">
          <Sparkles className="w-8 h-8" />
        </div>
      </div>

      {/* Hero Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight text-center">
        Welcome to <span className="bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">Ayan AI</span>
      </h1>
      <p className="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
        Your production-grade AI assistant. Ask questions, analyze complex code, upload documents, or brainstorm new ideas.
      </p>

      {/* Feature Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border">
          <Zap className="w-3 h-3 text-amber-500" /> Token Streaming
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border">
          <Code className="w-3 h-3 text-emerald-500" /> Syntax Highlighting
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border">
          <Mic className="w-3 h-3 text-rose-500" /> Voice Input
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border">
          <Paperclip className="w-3 h-3 text-indigo-500" /> Multimodal Attachments
        </span>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border rounded-xl mt-8 mb-4 max-w-full overflow-x-auto">
        {STARTER_PROMPT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              activeCategory === cat.id
                ? 'bg-white dark:bg-surface-dark-hover text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {getCategoryIcon(cat.icon)}
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Suggested Prompt Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {currentCategory.prompts.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleCardClick(item.prompt)}
            className="group flex flex-col justify-between text-left p-4 rounded-2xl bg-white dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border hover:border-brand-400 dark:hover:border-brand-500/60 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.99]"
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {item.title}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-snug line-clamp-2">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default WelcomeScreen;
