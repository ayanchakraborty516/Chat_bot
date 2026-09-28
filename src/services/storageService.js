/**
 * Storage Service Adapter
 * 
 * Provides an abstracted persistence layer. Currently implements browser localStorage,
 * but designed with async-compatible signatures so it can be swapped to MongoDB,
 * Firebase Firestore, or a custom REST/GraphQL backend with zero UI changes.
 */

import { STORAGE_KEYS } from '../config/constants.js';

class StorageService {
  /**
   * Retrieve all saved conversations
   * @returns {Array<object>}
   */
  getConversations() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to load conversations from storage:', error);
      return [];
    }
  }

  /**
   * Save the entire conversation list
   * @param {Array<object>} conversations
   */
  saveConversations(conversations) {
    try {
      localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(conversations));
    } catch (error) {
      console.error('Failed to persist conversations:', error);
    }
  }

  /**
   * Retrieve active conversation ID
   * @returns {string|null}
   */
  getActiveConversationId() {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch (error) {
      console.error('Failed to get active conversation ID:', error);
      return null;
    }
  }

  /**
   * Persist active conversation ID
   * @param {string|null} id
   */
  saveActiveConversationId(id) {
    try {
      if (id) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_CONVERSATION, id);
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
      }
    } catch (error) {
      console.error('Failed to save active conversation ID:', error);
    }
  }

  /**
   * Retrieve user settings
   * @returns {object}
   */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to retrieve settings:', error);
      return {};
    }
  }

  /**
   * Persist user settings
   * @param {object} settings
   */
  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to persist settings:', error);
    }
  }

  /**
   * Retrieve theme preference ('light' | 'dark' | 'system')
   * @returns {string}
   */
  getTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    } catch {
      return 'dark';
    }
  }

  /**
   * Save theme preference
   * @param {'light'|'dark'|'system'} theme
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  }

  /**
   * Clear all stored conversation data
   */
  clearAllConversations() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATIONS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_CONVERSATION);
    } catch (error) {
      console.error('Failed to clear conversation storage:', error);
    }
  }
}

export const storageService = new StorageService();
export default storageService;
