import React from 'react';
import MessageItem from './MessageItem';
import WelcomeScreen from './WelcomeScreen';
import { Loader2 } from 'lucide-react';

export function MessageList({ messages = [], isLoading = false, onSelectPrompt, bottomRef }) {
  if (isLoading && messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-gray-500 my-auto select-none">
        <Loader2 className="w-6 h-6 animate-spin text-brand-500 mb-2" />
        <p className="text-xs font-medium">Loading messages...</p>
      </div>
    );
  }

  if (messages.length === 0) {
    return <WelcomeScreen onSelectPrompt={onSelectPrompt} />;
  }

  // Find index of the last assistant message
  let lastAssistantIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIndex = i;
      break;
    }
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-4 space-y-2">
      {messages.map((message, index) => (
        <MessageItem
          key={message.id || index}
          message={message}
          isLastAssistant={index === lastAssistantIndex}
        />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}

export default MessageList;
