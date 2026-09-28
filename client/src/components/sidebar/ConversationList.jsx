import React from 'react';
import ConversationItem from './ConversationItem';
import { groupConversationsByDate } from '../../utils/formatters';
import { MessageSquareDashed, Loader2 } from 'lucide-react';

export function ConversationList({
  conversations = [],
  activeConversationId,
  searchQuery = '',
  isLoading = false,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}) {
  if (isLoading && conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-gray-500 my-auto select-none">
        <Loader2 className="w-5 h-5 animate-spin text-brand-500 mb-2" />
        <p className="text-xs font-medium">Loading conversations...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 dark:text-gray-500 my-auto select-none">
        <MessageSquareDashed className="w-8 h-8 mb-2 opacity-50 text-gray-400" />
        <p className="text-xs font-medium">
          {searchQuery ? 'No matching conversations' : 'No conversations yet'}
        </p>
        <p className="text-[11px] mt-1 text-gray-400/80">
          {searchQuery ? 'Try searching another keyword' : 'Start a chat to see history'}
        </p>
      </div>
    );
  }

  const grouped = groupConversationsByDate(conversations);
  const categories = ['Today', 'Yesterday', 'Previous 7 Days', 'Previous 30 Days', 'Older'];

  return (
    <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
      {categories.map((category) => {
        const items = grouped[category] || [];
        if (items.length === 0) return null;

        return (
          <div key={category} className="space-y-1">
            <h3 className="px-3 text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider select-none">
              {category}
            </h3>
            <div className="space-y-0.5">
              {items.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onSelect={onSelectConversation}
                  onRename={onRenameConversation}
                  onDelete={onDeleteConversation}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ConversationList;
