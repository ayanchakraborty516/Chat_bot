/**
 * Centralized API Configuration & Network Helpers
 * 
 * Manages the backend API base URL and request timeout safeguards.
 * Pure JavaScript - No TypeScript.
 */

/**
 * Resolve the API base URL from Vite environment variables.
 * In production on Vercel: VITE_API_URL=https://your-backend.onrender.com
 * In local development: VITE_API_URL=http://localhost:5000 (or proxy fallback /api)
 * @returns {string}
 */
export function getApiBase() {
  const raw = import.meta.env?.VITE_API_URL;
  if (raw && typeof raw === 'string' && raw.trim().length > 0) {
    const clean = raw.trim().replace(/\/$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }
  return '/api';
}

export const API_BASE = getApiBase();

/**
 * Standard fetch with configurable timeout safeguard
 * @param {string} url
 * @param {RequestInit} [options]
 * @param {number} [timeoutMs=25000]
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const externalSignal = options.signal;

  if (externalSignal) {
    if (externalSignal.aborted) {
      throw new DOMException('Request aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const timeoutTimer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutTimer);
    return response;
  } catch (err) {
    clearTimeout(timeoutTimer);
    if (err.name === 'AbortError') {
      if (externalSignal && externalSignal.aborted) {
        throw err;
      }
      const timeoutErr = new Error('Request timed out. Please try again.');
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    throw err;
  }
}

export default {
  API_BASE,
  getApiBase,
  fetchWithTimeout,
};
