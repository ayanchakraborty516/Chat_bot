import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Edit2, Trash2, Check, X } from 'lucide-react';

export function ConversationItem({
  conversation,
  isActive = false,
  onSelect,
  onRename,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title || 'Untitled Chat');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSaveRename = (e) => {
    if (e) e.stopPropagation();
    const clean = editTitle.trim();
    if (clean) {
      onRename(conversation.id, clean);
    } else {
      setEditTitle(conversation.title);
    }
    setIsEditing(false);
  };

  const handleCancelRename = (e) => {
    if (e) e.stopPropagation();
    setEditTitle(conversation.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSaveRename(e);
    } else if (e.key === 'Escape') {
      handleCancelRename(e);
    }
  };

  const handleConfirmDelete = (e) => {
    e.stopPropagation();
    onDelete(conversation.id);
    setIsConfirmingDelete(false);
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setIsConfirmingDelete(false);
  };

  const messageCount = conversation.messages?.length || 0;

  return (
    <div
      onClick={() => !isEditing && onSelect(conversation.id)}
      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer select-none transition-all ${
        isActive
          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-300 font-medium border border-brand-500/20'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/80 dark:hover:bg-surface-dark-hover border border-transparent'
      }`}
    >
      {/* If inline renaming */}
      {isEditing ? (
        <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-white dark:bg-surface-dark-card border border-brand-500 rounded px-2 py-0.5 text-xs text-gray-900 dark:text-white focus:outline-none"
          />
          <button
            onClick={handleSaveRename}
            className="p-1 text-emerald-500 hover:text-emerald-600 rounded"
            aria-label="Confirm rename"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCancelRename}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded"
            aria-label="Cancel rename"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isConfirmingDelete ? (
        /* If confirming delete */
        <div className="flex items-center justify-between w-full" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] font-medium text-red-500">Delete chat?</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleConfirmDelete}
              className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[10px] font-semibold hover:bg-red-600"
            >
              Delete
            </button>
            <button
              onClick={handleCancelDelete}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* Normal display */
        <>
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <MessageSquare
              className={`w-3.5 h-3.5 shrink-0 ${
                isActive ? 'text-brand-500' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
              }`}
            />
            <span className="truncate">{conversation.title || 'Untitled Chat'}</span>
          </div>

          {/* Action icons shown on hover or when active */}
          <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded hover:bg-gray-200/60 dark:hover:bg-surface-dark-border transition-colors"
              title="Rename conversation"
              aria-label="Rename conversation"
            >
              <Edit2 className="w-3 h-3" />
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsConfirmingDelete(true);
              }}
              className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded hover:bg-gray-200/60 dark:hover:bg-surface-dark-border transition-colors"
              title="Delete conversation"
              aria-label="Delete conversation"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ConversationItem;
