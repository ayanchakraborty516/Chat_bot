import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { storageService } from '../services/storageService';
import { chatService } from '../services/chatService';
import { geminiService } from '../services/geminiService';
import { generateId, truncate } from '../utils/helpers';
import { getDynamicDateInfo, buildDynamicSystemInstruction } from '../utils/dateUtils';
import { useSettings } from './SettingsContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { apiKey, selectedModel, systemInstruction, temperature } = useSettings();

  // State: Conversations and active conversation pointer
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(() =>
    storageService.getActiveConversationId()
  );

  // Loading & generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search and error banners
  const [searchQuery, setSearchQuery] = useState('');
  const [errorBanner, setErrorBanner] = useState(null);

  // Reference to abort current in-flight stream
  const abortControllerRef = useRef(null);

  // Track whether initial load has completed
  const isInitializedRef = useRef(false);

  // --- INITIAL DATA LOADING FROM MONGODB / BACKEND ---
  useEffect(() => {
    let isMounted = true;

    async function initializeConversations() {
      setIsLoadingConversations(true);
      try {
        const fetchedList = await chatService.getConversations();
        if (!isMounted) return;

        if (Array.isArray(fetchedList)) {
          setConversations(fetchedList);

          // Determine which conversation should be active
          const savedActiveId = storageService.getActiveConversationId();
          const targetId = fetchedList.some((c) => c.id === savedActiveId)
            ? savedActiveId
            : fetchedList.length > 0
            ? fetchedList[0].id
            : null;

          if (targetId) {
            setActiveConversationId(targetId);
            storageService.saveActiveConversationId(targetId);

            // Fetch messages for the active conversation
            setIsLoadingMessages(true);
            try {
              const msgs = await chatService.getMessages(targetId);
              if (isMounted && Array.isArray(msgs)) {
                setConversations((prev) =>
                  prev.map((c) => (c.id === targetId ? { ...c, messages: msgs } : c))
                );
              }
            } catch (msgErr) {
              console.warn('[Ayan AI] Could not fetch initial messages:', msgErr.message);
            } finally {
              if (isMounted) setIsLoadingMessages(false);
            }
          }
        }
      } catch (err) {
        if (!isMounted) return;
        console.warn('[Ayan AI] Backend not reachable on startup:', err.message);
        // Show friendly notification without crashing
        setErrorBanner({
          title: 'Storage Offline',
          message: 'Unable to save your conversation right now.',
          isStorageError: true,
        });

        // Fallback to local storage cache so user can still chat
        const cachedConvs = storageService.getConversations();
        setConversations(cachedConvs);
        const savedId = storageService.getActiveConversationId();
        if (savedId && cachedConvs.some((c) => c.id === savedId)) {
          setActiveConversationId(savedId);
        }
      } finally {
        if (isMounted) {
          setIsLoadingConversations(false);
          isInitializedRef.current = true;
        }
      }
    }

    initializeConversations();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save active conversation ID to local pointer for browser refreshes
  useEffect(() => {
    storageService.saveActiveConversationId(activeConversationId);
  }, [activeConversationId]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Current messages for the active conversation
  const messages = useMemo(() => {
    return activeConversation?.messages || [];
  }, [activeConversation]);

  // Filtered conversations based on search query
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const query = searchQuery.toLowerCase().trim();
    return conversations.filter((c) => {
      const matchTitle = c.title?.toLowerCase().includes(query);
      const matchMessage = c.messages?.some((m) =>
        m.content?.toLowerCase().includes(query)
      );
      return matchTitle || matchMessage;
    });
  }, [conversations, searchQuery]);

  /**
   * Start a brand new chat session with backend persistence
   * @param {string} [initialTitle]
   * @returns {Promise<string>} New conversation ID
   */
  const createNewChat = useCallback(
    async (initialTitle = 'New Chat') => {
      // If currently streaming, stop first
      if (isGenerating && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsSaving(true);
      const tempId = generateId();

      try {
        const created = await chatService.createConversation({
          title: initialTitle,
          modelId: selectedModel,
        });

        const newConv = {
          ...created,
          id: created.id || created._id || tempId,
          messages: [],
        };

        setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
        setActiveConversationId(newConv.id);
        storageService.saveActiveConversationId(newConv.id);
        setErrorBanner(null);
        return newConv.id;
      } catch (err) {
        console.warn('[Ayan AI] Failed to persist new conversation to backend:', err.message);
        setErrorBanner({
          title: 'Storage Notice',
          message: 'Unable to save your conversation right now.',
          isStorageError: true,
        });

        // Graceful local fallback
        const fallbackConv = {
          id: tempId,
          title: initialTitle,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          modelId: selectedModel,
          messages: [],
        };

        setConversations((prev) => [fallbackConv, ...prev]);
        setActiveConversationId(tempId);
        storageService.saveActiveConversationId(tempId);
        return tempId;
      } finally {
        setIsSaving(false);
      }
    },
    [isGenerating, selectedModel]
  );

  /**
   * Switch active conversation and fetch its messages from MongoDB
   * @param {string} id
   */
  const selectConversation = useCallback(
    async (id) => {
      if (id === activeConversationId) return;

      if (isGenerating && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setActiveConversationId(id);
      storageService.saveActiveConversationId(id);
      setErrorBanner(null);

      // Check if messages need to be fetched from backend
      const conv = conversations.find((c) => c.id === id);
      if (!conv || !conv.messages || conv.messages.length === 0) {
        setIsLoadingMessages(true);
        try {
          const msgs = await chatService.getMessages(id);
          if (Array.isArray(msgs)) {
            setConversations((prev) =>
              prev.map((c) => (c.id === id ? { ...c, messages: msgs } : c))
            );
          }
        } catch (err) {
          console.warn('[Ayan AI] Failed to fetch conversation messages:', err.message);
          setErrorBanner({
            title: 'Storage Notice',
            message: 'Unable to save your conversation right now.',
            isStorageError: true,
          });
        } finally {
          setIsLoadingMessages(false);
        }
      }
    },
    [activeConversationId, conversations, isGenerating]
  );

  /**
   * Delete a conversation permanently from MongoDB
   * @param {string} id
   */
  const deleteConversation = useCallback(
    async (id) => {
      // Optimistically remove from state
      let nextActiveId = null;
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (activeConversationId === id) {
          nextActiveId = remaining.length > 0 ? remaining[0].id : null;
        }
        return remaining;
      });

      if (activeConversationId === id) {
        setActiveConversationId(nextActiveId);
        storageService.saveActiveConversationId(nextActiveId);
        if (nextActiveId) {
          selectConversation(nextActiveId);
        }
      }

      // Persist deletion to backend
      try {
        await chatService.deleteConversation(id);
      } catch (err) {
        console.warn('[Ayan AI] Failed to delete conversation on backend:', err.message);
        setErrorBanner({
          title: 'Storage Notice',
          message: 'Unable to save your conversation right now.',
          isStorageError: true,
        });
      }
    },
    [activeConversationId, selectConversation]
  );

  /**
   * Rename a conversation in MongoDB
   * @param {string} id
   * @param {string} newTitle
   */
  const renameConversation = useCallback(
    async (id, newTitle) => {
      const trimmed = (newTitle || '').trim();
      if (!trimmed) return;

      // Optimistically update UI
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed, updatedAt: Date.now() } : c))
      );

      // Persist to backend
      try {
        await chatService.updateConversation(id, { title: trimmed });
      } catch (err) {
        console.warn('[Ayan AI] Failed to rename conversation on backend:', err.message);
        setErrorBanner({
          title: 'Storage Notice',
          message: 'Unable to save your conversation right now.',
          isStorageError: true,
        });
      }
    },
    []
  );

  /**
   * Clear all conversations
   */
  const clearAllConversations = useCallback(async () => {
    if (isGenerating && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const convsToDelete = [...conversations];
    setConversations([]);
    setActiveConversationId(null);
    storageService.saveActiveConversationId(null);
    storageService.clearAllConversations();
    setErrorBanner(null);

    // Delete all on backend
    try {
      await Promise.all(convsToDelete.map((c) => chatService.deleteConversation(c.id).catch(() => {})));
    } catch {
      // Best-effort cleanup
    }
  }, [conversations, isGenerating]);

  /**
   * Stop in-flight generation
   */
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  /**
   * Toggle or set message feedback (thumbs up / thumbs down)
   * @param {string} messageId
   * @param {'like'|'dislike'|null} feedback
   */
  const setMessageFeedback = useCallback(
    (messageId, feedback) => {
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== activeConversationId) return conv;
          return {
            ...conv,
            messages: conv.messages.map((m) =>
              m.id === messageId ? { ...m, feedback: m.feedback === feedback ? null : feedback } : m
            ),
          };
        })
      );
    },
    [activeConversationId]
  );

  /**
   * Core send message handler:
   * 1. Creates conversation in backend if none exists.
   * 2. Persists user message to MongoDB.
   * 3. Streams AI response token-by-token in local state without saving intermediate chunks.
   * 4. Once streaming completes, persists the final completed AI response to MongoDB.
   * 
   * @param {string} text - User prompt
   * @param {Array<object>} [attachments] - Uploaded files or images
   * @param {object} [options] - Options like isRetry: boolean to prevent duplicate user messages
   */
  const sendMessage = useCallback(
    async (text, attachments = [], options = {}) => {
      const cleanPrompt = (text || '').trim();
      if (!cleanPrompt && (!attachments || attachments.length === 0)) return;

      const isRetry = Boolean(options?.isRetry);
      setErrorBanner(null);

      // Determine or create target conversation
      let targetConvId = activeConversationId;
      let isFirstMessageInConv = false;
      const initialTitle = truncate(cleanPrompt || 'Image Query', 32);

      if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
        try {
          const created = await chatService.createConversation({
            title: initialTitle,
            modelId: selectedModel,
          });
          targetConvId = created.id || created._id;
          const newConv = { ...created, id: targetConvId, messages: [] };
          setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== targetConvId)]);
          setActiveConversationId(targetConvId);
          storageService.saveActiveConversationId(targetConvId);
          isFirstMessageInConv = true;
        } catch (createErr) {
          console.warn('[Ayan AI] Could not persist new conversation to backend:', createErr.message);
          setErrorBanner({
            title: 'Storage Notice',
            message: 'Unable to save your conversation right now.',
            isStorageError: true,
          });
          targetConvId = generateId();
          const fallbackConv = {
            id: targetConvId,
            title: initialTitle,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            modelId: selectedModel,
            messages: [],
          };
          setConversations((prev) => [fallbackConv, ...prev]);
          setActiveConversationId(targetConvId);
          storageService.saveActiveConversationId(targetConvId);
          isFirstMessageInConv = true;
        }
      } else {
        const existingConv = conversations.find((c) => c.id === targetConvId);
        if (existingConv && (!existingConv.messages || existingConv.messages.length === 0)) {
          isFirstMessageInConv = true;
        }
      }

      // Generate IDs
      const assistantMessageId = generateId();
      const now = Date.now();

      // Only generate new user message if this is NOT a retry attempt
      const userMessage = isRetry
        ? null
        : {
            id: generateId(),
            role: 'user',
            content: cleanPrompt,
            attachments: attachments || [],
            timestamp: now,
          };

      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        isStreaming: true,
        isSearching: false,
        searchStatus: null,
        sources: [],
        timestamp: now + 1,
        modelId: selectedModel,
      };

      // Update state with user message (if not retry) and streaming assistant placeholder
      let currentHistorySnapshot = [];

      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id !== targetConvId) return conv;

          let baseMessages = conv.messages || [];
          if (isRetry && baseMessages.length > 0 && baseMessages[baseMessages.length - 1].role === 'assistant') {
            baseMessages = baseMessages.slice(0, -1);
          }

          const updatedMessages = isRetry
            ? [...baseMessages, assistantMessage]
            : [...baseMessages, userMessage, assistantMessage];

          currentHistorySnapshot = updatedMessages;
          return {
            ...conv,
            title: isFirstMessageInConv ? initialTitle : conv.title,
            updatedAt: Date.now(),
            messages: updatedMessages,
          };
        })
      );

      // Persist user message to MongoDB (asynchronously, do not block streaming)
      if (!isRetry && userMessage) {
        chatService
          .saveMessage(targetConvId, {
            id: userMessage.id,
            role: userMessage.role,
            content: userMessage.content,
            attachments: userMessage.attachments,
            modelId: selectedModel,
            timestamp: userMessage.timestamp,
          })
          .catch((saveErr) => {
            console.warn('[Ayan AI] Could not save user message to backend:', saveErr.message);
            setErrorBanner({
              title: 'Storage Notice',
              message: 'Unable to save your conversation right now.',
              isStorageError: true,
            });
          });

        // Update conversation title if first message
        if (isFirstMessageInConv) {
          chatService
            .updateConversation(targetConvId, { title: initialTitle })
            .catch(() => {});
        }
      }

      // Setup abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      setIsGenerating(true);

      let actualModelUsed = selectedModel;
      let finalCompletedText = '';
      let activeSources = [];
      let searchContextPrompt = '';

      try {
        // Step A: Evaluate & execute live web search if question requires external/current facts
        try {
          const searchOutcome = await chatService.searchWeb(cleanPrompt);

          if (abortController.signal.aborted) {
            throw new DOMException('Generation stopped by user', 'AbortError');
          }

          if (searchOutcome?.searched && Array.isArray(searchOutcome.sources) && searchOutcome.sources.length > 0) {
            activeSources = searchOutcome.sources;
            searchContextPrompt = searchOutcome.contextPrompt || '';

            // Update UI with retrieved sources immediately
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                return {
                  ...conv,
                  messages: (conv.messages || []).map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, isSearching: false, searchStatus: null, sources: activeSources }
                      : m
                  ),
                };
              })
            );
          }
        } catch (searchErr) {
          if (searchErr.name === 'AbortError') throw searchErr;
          console.warn('[Ayan AI] Web search check skipped:', searchErr.message);
        }

        const dateInfo = await getDynamicDateInfo();
        const effectiveInstruction = buildDynamicSystemInstruction(systemInstruction, dateInfo);

        finalCompletedText = await geminiService.streamChat({
          prompt: cleanPrompt,
          messages: currentHistorySnapshot,
          attachments,
          modelId: selectedModel,
          apiKey,
          systemInstruction: effectiveInstruction,
          searchContext: searchContextPrompt,
          sources: activeSources,
          temperature,
          signal: abortController.signal,
          onModelUsed: (modelUsed) => {
            actualModelUsed = modelUsed;
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                return {
                  ...conv,
                  messages: (conv.messages || []).map((m) =>
                    m.id === assistantMessageId ? { ...m, modelId: modelUsed } : m
                  ),
                };
              })
            );
          },
          onChunk: (_chunk, accumulatedText) => {
            // Live streaming token-by-token in UI ONLY - NOT SAVED TO DATABASE
            setConversations((prev) =>
              prev.map((conv) => {
                if (conv.id !== targetConvId) return conv;
                return {
                  ...conv,
                  messages: (conv.messages || []).map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: accumulatedText, isStreaming: true, status: null, error: null }
                      : m
                  ),
                };
              })
            );
          },
        });

        // Mark streaming finished in state
        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== targetConvId) return conv;
            return {
              ...conv,
              messages: (conv.messages || []).map((m) =>
                m.id === assistantMessageId
                  ? {
                      ...m,
                      content: finalCompletedText,
                      isStreaming: false,
                      isSearching: false,
                      searchStatus: null,
                      sources: activeSources,
                      status: 'success',
                    }
                  : m
              ),
            };
          })
        );

        // SAVE COMPLETED AI RESPONSE TO MONGODB (ONLY ONCE STREAMING FINISHES)
        try {
          await chatService.saveMessage(targetConvId, {
            id: assistantMessageId,
            role: 'assistant',
            content: finalCompletedText,
            modelId: actualModelUsed,
            sources: activeSources,
            status: 'success',
            timestamp: Date.now(),
          });
        } catch (saveAiErr) {
          console.warn('[Ayan AI] Could not save AI response to backend:', saveAiErr.message);
          setErrorBanner({
            title: 'Storage Notice',
            message: 'Unable to save your conversation right now.',
            isStorageError: true,
          });
        }
      } catch (err) {
        const isAborted = err.name === 'AbortError' || err.message?.includes('stopped');
        if (!isAborted) {
          console.error('[Ayan AI] Message stream error:', err);
        }

        const friendlyErrorMessage =
          err.message || 'Ayan AI is temporarily busy. Please try again in a few seconds.';

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== targetConvId) return conv;
            return {
              ...conv,
              messages: (conv.messages || []).map((m) => {
                if (m.id === assistantMessageId) {
                  return {
                    ...m,
                    isStreaming: false,
                    status: isAborted ? 'aborted' : 'error',
                    error: isAborted ? null : friendlyErrorMessage,
                  };
                }
                return m;
              }),
            };
          })
        );

        if (!isAborted) {
          setErrorBanner({
            title: 'Request Failed',
            message: friendlyErrorMessage,
            retryPrompt: cleanPrompt,
            retryAttachments: attachments,
          });
        }
      } finally {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [
      activeConversationId,
      conversations,
      selectedModel,
      apiKey,
      systemInstruction,
      temperature,
    ]
  );

  /**
   * Retry the last prompt cleanly without duplicating user messages
   */
  const retryLastMessage = useCallback(async () => {
    if (!activeConversation || messages.length === 0 || isGenerating) return;

    setErrorBanner(null);

    // Find the last user message
    let lastUserIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }

    if (lastUserIndex === -1) return;

    const userMsgToRetry = messages[lastUserIndex];

    // Remove any assistant responses after this user message in state
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConversationId) return conv;
        return {
          ...conv,
          messages: (conv.messages || []).slice(0, lastUserIndex + 1),
        };
      })
    );

    // Re-send with isRetry: true so the user message is NOT duplicated!
    await sendMessage(userMsgToRetry.content, userMsgToRetry.attachments, { isRetry: true });
  }, [activeConversation, messages, isGenerating, activeConversationId, sendMessage]);

  /**
   * Regenerate the last AI response
   */
  const regenerateLastResponse = useCallback(async () => {
    await retryLastMessage();
  }, [retryLastMessage]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        isGenerating,
        isLoadingConversations,
        isLoadingMessages,
        isSaving,
        searchQuery,
        setSearchQuery,
        filteredConversations,
        errorBanner,
        setErrorBanner,
        createNewChat,
        selectConversation,
        deleteConversation,
        renameConversation,
        clearAllConversations,
        sendMessage,
        retryLastMessage,
        regenerateLastResponse,
        stopGeneration,
        setMessageFeedback,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
