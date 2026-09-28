/**
 * Date and string formatting utilities for Ayan AI
 */

/**
 * Format a timestamp into clock time (e.g., 4:32 PM)
 * @param {number|string|Date} timestamp
 * @returns {string}
 */
export function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Format a timestamp into a full readable date and time
 * @param {number|string|Date} timestamp
 * @returns {string}
 */
export function formatFullDateTime(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Categorize a conversation timestamp into a user-friendly sidebar section
 * ("Today", "Yesterday", "Previous 7 Days", "Previous 30 Days", "Older")
 * @param {number|string|Date} timestamp
 * @returns {'Today' | 'Yesterday' | 'Previous 7 Days' | 'Previous 30 Days' | 'Older'}
 */
export function getDateBucket(timestamp) {
  if (!timestamp) return 'Older';
  const targetDate = new Date(timestamp);
  const now = new Date();

  // Reset to midnight for clean day comparisons
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffTime = today.getTime() - targetDay.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays <= 7) return 'Previous 7 Days';
  if (diffDays <= 30) return 'Previous 30 Days';
  return 'Older';
}

/**
 * Group an array of conversations by date buckets
 * @param {Array<{ id: string, updatedAt: number }>} conversations
 * @returns {Record<string, Array<any>>}
 */
export function groupConversationsByDate(conversations = []) {
  const groups = {
    Today: [],
    Yesterday: [],
    'Previous 7 Days': [],
    'Previous 30 Days': [],
    Older: [],
  };

  conversations.forEach((conv) => {
    const bucket = getDateBucket(conv.updatedAt || conv.createdAt);
    if (groups[bucket]) {
      groups[bucket].push(conv);
    } else {
      groups.Older.push(conv);
    }
  });

  return groups;
}
