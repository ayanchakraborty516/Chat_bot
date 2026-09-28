import React, { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import ErrorBanner from './ErrorBanner';
import { useChat } from '../../context/ChatContext';
import { useChatScroll } from '../../hooks/useChatScroll';

export function ChatContainer({ onToggleSidebar }) {
  const {
    messages,
    isGenerating,
    isLoadingMessages,
    sendMessage,
    stopGeneration,
    errorBanner,
    setErrorBanner,
    retryLastMessage,
  } = useChat();

  const [inputPreloadText, setInputPreloadText] = useState('');

  // Use smart scroll hook
  const { containerRef, isAtBottom, scrollToBottom, handleScroll } = useChatScroll([
    messages,
    isGenerating,
  ]);

  const handleSelectStarterPrompt = (promptText) => {
    sendMessage(promptText);
  };

  const handleRetry = () => {
    setErrorBanner(null);
    retryLastMessage();
  };

  return (
    <div className="relative flex flex-col flex-1 h-screen overflow-hidden bg-white dark:bg-[#0c0e14]">
      {/* Top Header */}
      <ChatHeader onToggleSidebar={onToggleSidebar} />

      {/* Error / Notice Banner */}
      <ErrorBanner
        errorBanner={errorBanner}
        onRetry={handleRetry}
        onDismiss={() => setErrorBanner(null)}
      />

      {/* Scrollable Chat Area */}
      <main
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
        role="region"
        aria-label="Conversation messages"
      >
        <MessageList
          messages={messages}
          isLoading={isLoadingMessages}
          onSelectPrompt={handleSelectStarterPrompt}
        />
      </main>

      {/* Floating Scroll-to-Bottom Button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 z-20 p-2 rounded-full bg-white dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border shadow-lg text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 hover:scale-105 active:scale-95 transition-all animate-fade-in"
          aria-label="Scroll to bottom"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}

      {/* Input Area */}
      <div className="shrink-0">
        <ChatInput
          onSendMessage={sendMessage}
          onStopGeneration={stopGeneration}
          isGenerating={isGenerating}
          initialText={inputPreloadText}
        />
      </div>
    </div>
  );
}

export default ChatContainer;
