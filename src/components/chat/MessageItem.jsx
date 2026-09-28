import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Copy,
  Check,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  FileText,
  AlertTriangle,
  Globe,
  ExternalLink,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import ThinkingIndicator from './ThinkingIndicator';
import { formatTime } from '../../utils/formatters';
import { copyToClipboard } from '../../utils/helpers';
import { useChat } from '../../context/ChatContext';

export function MessageItem({ message, isLastAssistant = false }) {
  const { regenerateLastResponse, retryLastMessage, isGenerating, setMessageFeedback } = useChat();
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isStreaming = Boolean(message.isStreaming);
  const isError = message.status === 'error';

  const handleCopy = async () => {
    const success = await copyToClipboard(message.content);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = () => {
    setMessageFeedback(message.id, 'like');
  };

  const handleDislike = () => {
    setMessageFeedback(message.id, 'dislike');
  };

  // If streaming and no content received yet, show thinking indicator
  if (!isUser && isStreaming && (!message.content || message.content.length === 0)) {
    return (
      <ThinkingIndicator
        status={message.searchStatus || (message.isSearching ? 'Searching the web...' : 'Ayan AI is thinking')}
        isSearching={message.isSearching}
      />
    );
  }

  return (
    <div
      className={`group relative py-4 px-2 sm:px-4 rounded-2xl transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-gray-50/60 dark:bg-surface-dark-card/40 border border-gray-100/80 dark:border-surface-dark-border/40'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-surface-dark-hover flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-sm border border-gray-300/50 dark:border-surface-dark-border">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-sm shadow-brand-500/25">
              <Sparkles className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0 overflow-hidden space-y-1.5">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2 select-none">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-gray-900 dark:text-gray-100">
                {isUser ? 'You' : 'Ayan AI'}
              </span>
              {!isUser && message.modelId && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-300">
                  {message.modelId.replace('gemini-', '')}
                </span>
              )}
              {message.timestamp && (
                <span className="text-[11px] text-gray-400">
                  {formatTime(message.timestamp)}
                </span>
              )}
            </div>

            {/* Top quick copy for user prompts */}
            {isUser && (
              <button
                type="button"
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded"
                aria-label="Copy prompt"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>

          {/* User Attachments (if any) */}
          {isUser && message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map((att, i) => {
                const isImg = att.mimeType?.startsWith('image/');
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-white dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border text-xs shadow-sm max-w-xs"
                  >
                    {isImg && att.base64Data ? (
                      <img
                        src={`data:${att.mimeType};base64,${att.base64Data}`}
                        alt={att.fileName || 'Attachment'}
                        className="w-10 h-10 object-cover rounded-lg"
                      />
                    ) : (
                      <FileText className="w-5 h-5 text-indigo-500 ml-1" />
                    )}
                    <span className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">
                      {att.fileName || 'Attached File'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Message Content */}
          {isUser ? (
            <div className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </div>
          ) : isError ? (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{message.error || 'Ayan AI is temporarily busy. Please try again in a few seconds.'}</span>
              </div>
              <button
                type="button"
                onClick={() => retryLastMessage()}
                disabled={isGenerating}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-500/15 hover:bg-red-500/25 active:bg-red-500/35 text-red-700 dark:text-red-300 font-medium transition-colors shrink-0 disabled:opacity-50"
              >
                <RotateCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="relative">
              <MarkdownRenderer content={message.content} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 align-middle bg-brand-500 animate-pulse rounded-sm" />
              )}
            </div>
          )}

          {/* Web Sources section */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="pt-3 pb-1 border-t border-gray-200/60 dark:border-surface-dark-border/60 mt-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Globe className="w-3.5 h-3.5 text-brand-500" />
                <span>Web Sources ({message.sources.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {message.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/src flex flex-col p-2.5 rounded-xl bg-white dark:bg-surface-dark-card border border-gray-200/80 dark:border-surface-dark-border/80 hover:border-brand-500/50 dark:hover:border-brand-500/50 hover:shadow-sm transition-all text-xs"
                    title={src.snippet || src.title}
                  >
                    <div className="flex items-center justify-between gap-1 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      <span className="font-medium text-brand-600 dark:text-brand-400 truncate">
                        {src.source || 'web'}
                      </span>
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover/src:opacity-100 transition-opacity shrink-0" />
                    </div>
                    <span className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1 group-hover/src:text-brand-600 dark:group-hover/src:text-brand-400">
                      {src.title}
                    </span>
                    {src.snippet && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                        {src.snippet}
                      </p>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assistant Action Bar */}
          {!isUser && !isStreaming && !isError && message.content && (
            <div className="flex items-center gap-1 pt-2 select-none text-gray-400">
              {/* Copy Full Message */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-gray-200/70 dark:hover:bg-surface-dark-hover hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                title="Copy response"
                aria-label="Copy response"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Regenerate (if last response) */}
              {isLastAssistant && (
                <button
                  type="button"
                  onClick={regenerateLastResponse}
                  disabled={isGenerating}
                  className="p-1.5 rounded-lg hover:bg-gray-200/70 dark:hover:bg-surface-dark-hover hover:text-gray-700 dark:hover:text-gray-200 transition-colors disabled:opacity-40"
                  title="Regenerate response"
                  aria-label="Regenerate response"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                </button>
              )}

              {/* Thumbs Up / Like */}
              <button
                type="button"
                onClick={handleLike}
                className={`p-1.5 rounded-lg hover:bg-gray-200/70 dark:hover:bg-surface-dark-hover transition-colors ${
                  message.feedback === 'like'
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="Helpful response"
                aria-label="Like response"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>

              {/* Thumbs Down / Dislike */}
              <button
                type="button"
                onClick={handleDislike}
                className={`p-1.5 rounded-lg hover:bg-gray-200/70 dark:hover:bg-surface-dark-hover transition-colors ${
                  message.feedback === 'dislike'
                    ? 'text-red-500 bg-red-500/10'
                    : 'hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="Unhelpful response"
                aria-label="Dislike response"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MessageItem;
