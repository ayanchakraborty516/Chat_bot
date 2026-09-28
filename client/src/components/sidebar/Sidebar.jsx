import React, { useEffect } from 'react';
import SidebarHeader from './SidebarHeader';
import ConversationList from './ConversationList';
import SidebarFooter from './SidebarFooter';
import { useChat } from '../../context/ChatContext';

export function Sidebar({
  isOpen = true,
  onClose,
  isMobile = false,
}) {
  const {
    filteredConversations,
    activeConversationId,
    isLoadingConversations,
    searchQuery,
    setSearchQuery,
    createNewChat,
    selectConversation,
    renameConversation,
    deleteConversation,
  } = useChat();

  // Close mobile drawer on Escape key
  useEffect(() => {
    if (!isMobile || !isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobile, isOpen, onClose]);

  const handleSelect = (id) => {
    selectConversation(id);
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleNewChat = () => {
    createNewChat();
    if (isMobile && onClose) {
      onClose();
    }
  };

  // --- MOBILE DRAWER RENDERING ---
  if (isMobile) {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex animate-fade-in" role="dialog" aria-modal="true">
        {/* Backdrop Overlay */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Slide-over Drawer */}
        <aside className="relative flex flex-col w-80 max-w-[85vw] h-full bg-white dark:bg-surface-dark-card border-r border-gray-200 dark:border-surface-dark-border shadow-2xl z-10 animate-slide-up">
          <SidebarHeader
            onNewChat={handleNewChat}
            onClose={onClose}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isMobile={true}
          />

          <ConversationList
            conversations={filteredConversations}
            activeConversationId={activeConversationId}
            searchQuery={searchQuery}
            isLoading={isLoadingConversations}
            onSelectConversation={handleSelect}
            onRenameConversation={renameConversation}
            onDeleteConversation={deleteConversation}
          />

          <SidebarFooter />
        </aside>
      </div>
    );
  }

  // --- DESKTOP SIDEBAR RENDERING ---
  return (
    <aside
      className={`h-screen flex flex-col bg-white dark:bg-[#12151e] border-r border-gray-200/80 dark:border-surface-dark-border transition-all duration-300 select-none overflow-hidden shrink-0 ${
        isOpen ? 'w-72' : 'w-0 border-r-0'
      }`}
      aria-label="Conversation history"
    >
      <div className="w-72 flex flex-col h-full">
        <SidebarHeader
          onNewChat={handleNewChat}
          onClose={onClose}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isMobile={false}
        />

        <ConversationList
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          searchQuery={searchQuery}
          isLoading={isLoadingConversations}
          onSelectConversation={handleSelect}
          onRenameConversation={renameConversation}
          onDeleteConversation={deleteConversation}
        />

        <SidebarFooter />
      </div>
    </aside>
  );
}

export default Sidebar;
