import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook to handle smart auto-scrolling for chat messages.
 * Automatically pins scroll to the bottom during streaming if user is near bottom,
 * but respects manual scrolling up so user can read past messages.
 */
export function useChatScroll(dependencies = []) {
  const containerRef = useRef(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const isNearBottomRef = useRef(true);

  // Check scroll position
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    // Consider within 120px as "at bottom"
    const atBottom = scrollHeight - scrollTop - clientHeight < 120;
    setIsAtBottom(atBottom);
    isNearBottomRef.current = atBottom;
  }, []);

  // Smooth scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (!containerRef.current) return;
    const target = containerRef.current.scrollHeight;
    if (smooth) {
      containerRef.current.scrollTo({
        top: target,
        behavior: 'smooth',
      });
    } else {
      containerRef.current.scrollTop = target;
    }
  }, []);

  // Auto-scroll when dependencies update (messages / streaming chunks)
  useEffect(() => {
    if (isNearBottomRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return {
    containerRef,
    isAtBottom,
    scrollToBottom,
    handleScroll,
  };
}
