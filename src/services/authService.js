/**
 * Auth API Service
 * 
 * Manages REST API communication for user authentication, registration,
 * and session verification with the Node.js/Express backend.
 * Pure JavaScript - No TypeScript.
 */

import { STORAGE_KEYS } from '../config/constants.js';

const API_BASE = (import.meta.env?.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/$/, '') + '/api'
  : '/api');

class AuthService {
  /**
   * Helper for fetch requests with standardized error handling
   * @private
   */
  async _request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        // Response is not JSON
      }

      if (!response.ok) {
        const error = new Error(data?.error || `Request failed with status ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.name === 'TypeError' && err.message?.includes('fetch')) {
        const netErr = new Error('Unable to connect to the authentication server.');
        netErr.status = 0;
        throw netErr;
      }
      throw err;
    }
  }

  /**
   * Register a new user
   * @param {object} params
   * @param {string} params.name
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ token: string, user: { id: string, name: string, email: string } }>}
   */
  async register({ name, email, password }) {
    return this._request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  /**
   * Login an existing user
   * @param {object} params
   * @param {string} params.email
   * @param {string} params.password
   * @returns {Promise<{ token: string, user: { id: string, name: string, email: string } }>}
   */
  async login({ email, password }) {
    return this._request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Verify token and fetch current user profile
   * @param {string} token
   * @returns {Promise<{ user: { id: string, name: string, email: string } }>}
   */
  async getMe(token) {
    if (!token) throw new Error('No token provided');
    return this._request('/auth/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  /**
   * Stored token helpers
   */
  getToken() {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  }

  saveToken(token) {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (err) {
      console.error('Failed to save token to storage:', err);
    }
  }

  removeToken() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (err) {
      console.error('Failed to remove token from storage:', err);
    }
  }
}

export const authService = new AuthService();
export default authService;
