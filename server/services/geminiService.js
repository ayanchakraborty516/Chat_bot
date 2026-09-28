/**
 * Backend Gemini AI Service
 * 
 * Handles all communication with the Google Gemini API on the Node/Express backend.
 * Protects GEMINI_API_KEY from exposure to the frontend.
 * Preserves primary model gemini-3.8-flash, fallback chain (gemini-flash-latest, gemini-3.1-flash-lite),
 * retry logic, multimodal inputs, and 503 high-demand handling.
 * 
 * Pure JavaScript - No TypeScript.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCurrentDateInfo, buildDateSystemInstruction } from '../utils/dateUtils.js';

export const PRIMARY_MODEL_ID = 'gemini-3.8-flash';
export const FALLBACK_MODEL_ID = 'gemini-flash-latest';
export const SECONDARY_FALLBACK_MODEL_ID = 'gemini-3.1-flash-lite';
export const DEFAULT_MODEL_ID = PRIMARY_MODEL_ID;

export const MODEL_CONFIG = {
  primary: PRIMARY_MODEL_ID,
  fallback: FALLBACK_MODEL_ID,
  fallbackChain: [FALLBACK_MODEL_ID, SECONDARY_FALLBACK_MODEL_ID],
  maxPrimaryAttempts: 2,
  maxFallbackAttempts: 2,
  retryDelayMs: 1000,
};

export const DEFAULT_SYSTEM_INSTRUCTION =
  'You are Ayan AI, a production-grade, highly capable, helpful, and empathetic AI assistant. You provide clear, concise, well-structured, and accurate responses. You format code blocks with proper syntax highlighting, cite steps methodically, and tailor your tone to the user.';

class BackendGeminiService {
  /**
   * Resolve active API key:
   * Prioritizes client-supplied personal key (if user set one in Settings),
   * otherwise uses server process.env.GEMINI_API_KEY.
   * @param {string} [clientKey]
   * @returns {string}
   */
  getEffectiveKey(clientKey) {
    if (clientKey && typeof clientKey === 'string' && clientKey.trim().length > 5) {
      return clientKey.trim();
    }
    return (process.env.GEMINI_API_KEY || '').trim();
  }

  /**
   * Check if a valid API key is configured
   * @param {string} [clientKey]
   * @returns {boolean}
   */
  hasApiKey(clientKey) {
    const key = this.getEffectiveKey(clientKey);
    return key.length > 5 && !key.includes('replace_with_gemini_api_key');
  }

  /**
   * Format history for Gemini chat session
   * @param {Array<object>} messages
   * @returns {Array<object>}
   */
  formatHistoryForGemini(messages = []) {
    const history = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (!msg || msg.status === 'error') continue;

      const role = msg.role === 'user' ? 'user' : 'model';
      const parts = [{ text: msg.content || '' }];

      history.push({
        role,
        parts,
      });
    }

    return history;
  }

  /**
   * Prepare contents for multimodal requests
   * @param {string} promptText
   * @param {Array<object>} attachments
   * @returns {Array<object>}
   */
  buildMultimodalParts(promptText, attachments = []) {
    const parts = [];

    if (attachments && Array.isArray(attachments)) {
      for (const att of attachments) {
        if (att.base64Data && att.mimeType && att.mimeType.startsWith('image/')) {
          parts.push({
            inlineData: {
              data: att.base64Data,
              mimeType: att.mimeType,
            },
          });
        } else if (att.textContent) {
          parts.push({
            text: `[Attached File: ${att.fileName || 'Document'}]\n\`\`\`\n${att.textContent}\n\`\`\`\n`,
          });
        }
      }
    }

    parts.push({
      text: promptText || '',
    });

    return parts;
  }

  /**
   * Check if error qualifies for automatic retry or fallback
   * @param {any} error
   * @returns {boolean}
   */
  isTemporaryAvailabilityError(error) {
    if (!error) return false;

    if (error.name === 'AbortError' || error.message?.includes('stopped')) {
      return false;
    }

    const status = error.status || error.statusCode;
    const msg = (error.message || String(error)).toLowerCase();

    // Never retry permanent client/auth/permission errors
    if (
      status === 400 ||
      status === 401 ||
      status === 403 ||
      status === 404 ||
      msg.includes('api_key_invalid') ||
      msg.includes('api key not valid') ||
      msg.includes('permission_denied') ||
      msg.includes('not found') ||
      msg.includes('no longer available')
    ) {
      return false;
    }

    // Temporary overload status codes
    if ([503, 429, 500, 502, 504].includes(status)) {
      return true;
    }

    // Availability error keywords
    if (
      msg.includes('503') ||
      msg.includes('high demand') ||
      msg.includes('service unavailable') ||
      msg.includes('overload') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit') ||
      msg.includes('gateway timeout') ||
      msg.includes('temporarily unavailable')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Cancellable delay
   * @param {number} ms
   * @param {AbortSignal} [signal]
   * @returns {Promise<void>}
   */
  sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) {
        return reject(new Error('Generation stopped.'));
      }
      const timer = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(new Error('Generation stopped.'));
          },
          { once: true }
        );
      }
    });
  }

  /**
   * Execute single attempt of streaming
   * @private
   */
  async _executeStreamChat({
    prompt,
    messages = [],
    attachments = [],
    modelId = DEFAULT_MODEL_ID,
    apiKey = '',
    systemInstruction = DEFAULT_SYSTEM_INSTRUCTION,
    temperature = 0.7,
    searchContext = '',
    signal,
    onChunk,
  }) {
    const effectiveKey = this.getEffectiveKey(apiKey);
    const genAI = new GoogleGenerativeAI(effectiveKey);

    const modelOptions = {
      model: modelId,
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.7,
      },
    };

    let effectiveInstruction = systemInstruction?.includes('CRITICAL TEMPORAL CONTEXT')
      ? systemInstruction
      : buildDateSystemInstruction(systemInstruction);

    if (searchContext && searchContext.trim().length > 0) {
      effectiveInstruction = `${effectiveInstruction}\n\n${searchContext.trim()}`;
    }

    if (effectiveInstruction) {
      modelOptions.systemInstruction = effectiveInstruction;
    }

    const model = genAI.getGenerativeModel(modelOptions);
    const formattedHistory = this.formatHistoryForGemini(messages);

    const chat = model.startChat({
      history: formattedHistory,
    });

    const parts = this.buildMultimodalParts(prompt, attachments);
    const result = await chat.sendMessageStream(parts);

    let accumulatedText = '';

    for await (const chunk of result.stream) {
      if (signal && signal.aborted) {
        throw new Error('Generation stopped.');
      }

      const chunkText = chunk.text();
      accumulatedText += chunkText;

      if (typeof onChunk === 'function') {
        onChunk(chunkText, accumulatedText);
      }
    }

    return accumulatedText;
  }

  /**
   * Stream a response from Gemini with resilient fallback model switching
   * @param {object} params
   * @returns {Promise<string>}
   */
  async streamChat(params) {
    const { prompt, onChunk, signal, onModelUsed, apiKey } = params;

    if (!this.hasApiKey(apiKey)) {
      throw new Error(
        'Gemini API key is not configured on the backend. Please add GEMINI_API_KEY in server environment variables or Settings.'
      );
    }

    const requestedModel = params.modelId || DEFAULT_MODEL_ID;
    const candidateModels = [requestedModel];
    const configuredFallbacks = MODEL_CONFIG.fallbackChain || [FALLBACK_MODEL_ID];

    for (const fb of configuredFallbacks) {
      if (fb && !candidateModels.includes(fb)) {
        candidateModels.push(fb);
      }
    }

    let lastError = null;

    for (let modelIndex = 0; modelIndex < candidateModels.length; modelIndex++) {
      const activeModel = candidateModels[modelIndex];
      const isPrimary = modelIndex === 0;
      const maxAttempts = isPrimary
        ? MODEL_CONFIG.maxPrimaryAttempts || 2
        : MODEL_CONFIG.maxFallbackAttempts || 2;

      if (!isPrimary) {
        console.info(`[Backend Gemini] Trying fallback model (${activeModel})...`);
      }

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (signal && signal.aborted) {
          throw new Error('Generation stopped.');
        }

        try {
          if (typeof onModelUsed === 'function') {
            onModelUsed(activeModel);
          }

          const result = await this._executeStreamChat({
            ...params,
            modelId: activeModel,
          });

          if (!isPrimary) {
            console.info(`[Backend Gemini] Fallback model (${activeModel}) succeeded.`);
          }

          return result;
        } catch (err) {
          lastError = err;

          if (err.name === 'AbortError' || (signal && signal.aborted)) {
            throw new Error('Generation stopped.');
          }

          if (!this.isTemporaryAvailabilityError(err)) {
            console.error('[Backend Gemini] Permanent error:', err.message);
            throw err;
          }

          console.warn(
            `[Backend Gemini] Model ${activeModel} attempt ${attempt}/${maxAttempts} temporary error:`,
            err.message
          );

          if (attempt < maxAttempts) {
            await this.sleep(MODEL_CONFIG.retryDelayMs || 1000, signal);
          }
        }
      }
    }

    console.error('[Backend Gemini] All models temporarily unavailable:', lastError?.message);
    throw new Error('Ayan AI is temporarily busy. Please try again in a few seconds.');
  }
}

export const backendGeminiService = new BackendGeminiService();
export default backendGeminiService;
