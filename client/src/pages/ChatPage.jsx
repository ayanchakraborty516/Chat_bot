import React from 'react';
import ChatContainer from '../components/chat/ChatContainer';

export function ChatPage({ onToggleSidebar }) {
  return <ChatContainer onToggleSidebar={onToggleSidebar} />;
}

export default ChatPage;
