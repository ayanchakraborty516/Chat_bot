/**
 * Chat API Service
 * 
 * Manages REST API communication with the Node.js/Express backend for
 * permanent conversation and message persistence in MongoDB.
 * Pure JavaScript - No TypeScript.
 */

import { authService } from './authService.js';

const API_BASE = (import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
  : '/api');

class ChatService {
  /**
   * Helper for fetch requests with standardized error handling
   * @private
   */
  async _request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const token = authService.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If response body is not JSON, use default status text
        }
        const error = new Error(errorMessage);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        const netErr = new Error('Unable to connect to the server.');
        netErr.status = 0;
        throw netErr;
      }
      throw err;
    }
  }

  /**
   * Verify backend and database health
   * @returns {Promise<{ status: string, mongo: string }>}
   */
  async checkHealth() {
    return this._request('/health', { method: 'GET' });
  }

  /**
   * Fetch all conversations from MongoDB
   * @returns {Promise<Array<object>>}
   */
  async getConversations() {
    return this._request('/conversations', { method: 'GET' });
  }

  /**
   * Create a new conversation in MongoDB
   * @param {object} [data]
   * @param {string} [data.title]
   * @param {string} [data.modelId]
   * @param {string} [data.id]
   * @returns {Promise<object>} Created conversation
   */
  async createConversation(data = {}) {
    return this._request('/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Fetch a single conversation by ID
   * @param {string} id
   * @returns {Promise<object>}
   */
  async getConversation(id) {
    if (!id) throw new Error('Conversation ID is required');
    return this._request(`/conversations/${id}`, { method: 'GET' });
  }

  /**
   * Update conversation title or metadata in MongoDB
   * @param {string} id
   * @param {object} data
   * @returns {Promise<object>} Updated conversation
   */
  async updateConversation(id, data = {}) {
    if (!id) throw new Error('Conversation ID is required');
    return this._request(`/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a conversation and all its messages from MongoDB
   * @param {string} id
   * @returns {Promise<{ success: boolean }>}
   */
  async deleteConversation(id) {
    if (!id) throw new Error('Conversation ID is required');
    return this._request(`/conversations/${id}`, {
      method: 'DELETE',
    });
  }

  /**
   * Fetch all messages for a specific conversation from MongoDB
   * @param {string} conversationId
   * @returns {Promise<Array<object>>}
   */
  async getMessages(conversationId) {
    if (!conversationId) return [];
    return this._request(`/conversations/${conversationId}/messages`, {
      method: 'GET',
    });
  }

  /**
   * Save a completed message (user or completed AI response) to MongoDB
   * @param {string} conversationId
   * @param {object} message
   * @param {string} message.role - 'user' | 'assistant' | 'system'
   * @param {string} message.content - Full message content
   * @param {string} [message.id] - Optional client message UUID
   * @param {string} [message.modelId] - Model used for response
   * @param {Array<object>} [message.attachments] - File or image attachments
   * @param {Array<object>} [message.sources] - Web search source citations
   * @param {string} [message.status] - Status (success, error, etc.)
   * @param {string} [message.feedback] - User feedback
   * @param {number|string} [message.timestamp]
   * @returns {Promise<object>} Saved message
   */
  async saveMessage(conversationId, message) {
    if (!conversationId) throw new Error('Conversation ID is required');
    return this._request(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  /**
   * Perform live web search evaluation and retrieval via backend Express API
   * @param {string} query - User search query
   * @param {boolean} [forceSearch=false] - Optional manual override
   * @returns {Promise<{ searched: boolean, reason?: string, searchQuery?: string, results: Array<object>, sources: Array<object>, contextPrompt?: string, error?: string }>}
   */
  async searchWeb(query, forceSearch = false) {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return { searched: false, results: [], sources: [] };
    }
    try {
      return await this._request('/search', {
        method: 'POST',
        body: JSON.stringify({ query: query.trim(), forceSearch }),
      });
    } catch (err) {
      console.warn('[chatService] Web search request failed:', err.message);
      return {
        searched: false,
        results: [],
        sources: [],
        error: err.message || 'Web search service unavailable',
      };
    }
  }
}

export const chatService = new ChatService();
export default chatService;
