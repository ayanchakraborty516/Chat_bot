import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Square,
  Paperclip,
  Mic,
  MicOff,
  AlertCircle,
} from 'lucide-react';
import AttachmentPreview from './AttachmentPreview.jsx';
import { useSpeechToText } from '../../hooks/useSpeechToText.js';
import { fileToBase64, fileToText } from '../../utils/helpers.js';
import { MAX_FILE_SIZE_BYTES } from '../../config/constants.js';

export function ChatInput({
  onSendMessage,
  onStopGeneration,
  isGenerating = false,
  initialText = '',
}) {
  const [text, setText] = useState(initialText);
  const [prevInitialText, setPrevInitialText] = useState(initialText);
  const [attachments, setAttachments] = useState([]);
  const [fileError, setFileError] = useState(null);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Sync initialText if changed from parent
  if (initialText !== prevInitialText) {
    setPrevInitialText(initialText);
    setText(initialText);
  }

  // Focus textarea when initialText is populated
  useEffect(() => {
    if (initialText && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [initialText]);

  const handleTranscript = useCallback((newTranscript) => {
    if (newTranscript) {
      setText((prev) => {
        const separator = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + separator + newTranscript;
      });
    }
  }, []);

  // Hook for Speech-to-Text
  const {
    isListening,
    isSupported,
    error: speechError,
    startListening,
    stopListening,
  } = useSpeechToText({ onTranscript: handleTranscript });

  // Auto-resize textarea to match content
  const adjustTextareaHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  useEffect(() => {
    adjustTextareaHeight();
  }, [text, adjustTextareaHeight]);

  // Handle file selection
  const handleFiles = async (fileList) => {
    setFileError(null);
    if (!fileList || fileList.length === 0) return;

    const newAttachments = [];

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`"${file.name}" exceeds the 10MB limit.`);
        continue;
      }

      try {
        if (file.type.startsWith('image/')) {
          const base64Info = await fileToBase64(file);
          newAttachments.push(base64Info);
        } else {
          // Read as text
          const textContent = await fileToText(file);
          newAttachments.push({
            fileName: file.name,
            mimeType: file.type || 'text/plain',
            size: file.size,
            textContent,
          });
        }
      } catch (err) {
        console.error('File parsing failed:', err);
        setFileError(`Could not read "${file.name}".`);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments((prev) => [...prev, ...newAttachments]);
    }
  };

  const handleFileInputChange = (e) => {
    handleFiles(e.target.files);
    e.target.value = '';
  };

  const handleRemoveAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Support pasting images or files directly into the textarea
  const handlePaste = (e) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      handleFiles(e.clipboardData.files);
    }
  };

  // Submit message
  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    const clean = text.trim();
    if (!clean && attachments.length === 0) return;
    if (isGenerating) return;

    if (isListening) {
      stopListening();
    }

    onSendMessage(clean, attachments);
    setText('');
    setAttachments([]);
    setFileError(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  // Handle key press (Enter sends, Shift+Enter newlines)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const hasContent = text.trim().length > 0 || attachments.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto px-2 sm:px-4 pb-3 sm:pb-5">
      {/* Speech or file alerts */}
      {(fileError || speechError) && (
        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs animate-fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{fileError || speechError}</span>
        </div>
      )}

      {/* Main input wrapper */}
      <div className="relative rounded-2xl bg-white dark:bg-surface-dark-card border border-gray-200 dark:border-surface-dark-border shadow-lg focus-within:border-brand-500/80 dark:focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all duration-200 overflow-hidden">
        {/* Attachment Previews */}
        <AttachmentPreview
          attachments={attachments}
          onRemove={handleRemoveAttachment}
        />

        {/* Text Area */}
        <div className="flex items-end px-3 py-2.5 sm:px-4">
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={
              isListening
                ? 'Listening to your voice...'
                : 'Message Ayan AI... (Shift + Enter for new line)'
            }
            className="w-full max-h-[200px] resize-none bg-transparent text-sm sm:text-base text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none leading-relaxed py-1"
          />

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.js,.jsx,.py,.html,.css,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {/* Action buttons inside the input */}
          <div className="flex items-center gap-1 ml-2 shrink-0 pb-0.5">
            {/* Attach File Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-dark-hover rounded-xl transition-colors"
              title="Attach images or documents"
              aria-label="Attach files"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Input Button */}
            {isSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-400/50'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-surface-dark-hover'
                }`}
                title={isListening ? 'Stop listening' : 'Voice input'}
                aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}

            {/* Stop or Send Button */}
            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 active:scale-95 transition-all shadow-sm"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!hasContent}
                className={`p-2 rounded-xl transition-all shadow-sm ${
                  hasContent
                    ? 'bg-brand-600 hover:bg-brand-500 text-white active:scale-95 shadow-brand-500/25'
                    : 'bg-gray-100 dark:bg-surface-dark-hover text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
                title="Send message"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer text */}
      <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-gray-400 dark:text-gray-500">
        <span>Ayan AI can make mistakes. Verify important information.</span>
        <span className="hidden sm:inline-block font-mono">Gemini API Ready</span>
      </div>
    </div>
  );
}

export default ChatInput;
