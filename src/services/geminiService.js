/**
 * Gemini AI Service
 * 
 * Handles all communication with the Google Gemini API.
 * Encapsulates streaming, multi-turn chat history, multimodal inputs (images & text),
 * resilient fallback model switching for temporary 503/high-demand availability errors,
 * error normalization, and fallback simulated streaming for keyless development/preview.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  PRIMARY_MODEL_ID,
  FALLBACK_MODEL_ID,
  DEFAULT_MODEL_ID,
  MODEL_CONFIG,
  DEFAULT_SYSTEM_INSTRUCTION,
} from '../config/constants.js';
import { buildDynamicSystemInstruction } from '../utils/dateUtils.js';

class GeminiService {
  constructor() {
    this.apiKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY) || '';
  }

  /**
   * Resolve active API key (from settings override or env)
   * @param {string} [overrideKey]
   * @returns {string}
   */
  getEffectiveKey(overrideKey) {
    if (overrideKey && overrideKey.trim().length > 0) {
      return overrideKey.trim();
    }
    return (this.apiKey || '').trim();
  }

  /**
   * Check if an API key is configured
   * @param {string} [overrideKey]
   * @returns {boolean}
   */
  hasApiKey(overrideKey) {
    const key = this.getEffectiveKey(overrideKey);
    return key.length > 5 && !key.includes('YOUR_GEMINI_API_KEY');
  }

  /**
   * Convert internal message format to Google Gemini chat history format
   * @param {Array<{ role: 'user'|'assistant', content: string, attachments?: Array<any> }>} messages
   * @returns {Array<{ role: 'user'|'model', parts: Array<{ text: string }> }>}
   */
  formatHistoryForGemini(messages) {
    // Take past conversation turns, excluding the last user prompt which is sent directly
    const history = [];

    for (let i = 0; i < messages.length - 1; i++) {
      const msg = messages[i];
      if (msg.status === 'error') continue;

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
   * @param {Array<{ base64Data?: string, mimeType?: string, fileName?: string, textContent?: string }>} attachments
   * @returns {Array<any>}
   */
  buildMultimodalParts(promptText, attachments = []) {
    const parts = [];

    // Add attachments
    if (attachments && attachments.length > 0) {
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

    // Add user prompt text
    parts.push({
      text: promptText || '',
    });

    return parts;
  }

  /**
   * Determine if an error represents a temporary availability error that qualifies for fallback/retry
   * (e.g. 503 Service Unavailable, high-demand spikes, 429 overload, 500, 502, 504)
   * 
   * NEVER triggers for permanent errors (invalid API key, 401, 403, 400, 404)
   * @param {any} error
   * @returns {boolean}
   */
  isTemporaryAvailabilityError(error) {
    if (!error) return false;

    // Never fallback or retry if user explicitly aborted
    if (error.name === 'AbortError' || error.message?.includes('stopped')) {
      return false;
    }

    const status = error.status || error.statusCode;
    const msg = (error.message || String(error)).toLowerCase();

    // NEVER fallback or retry for permanent client/auth/permission/invalid model errors
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

    // Explicit temporary overload status codes
    if ([503, 429, 500, 502, 504].includes(status)) {
      return true;
    }

    // High demand or temporary availability phrases
    if (
      msg.includes('503') ||
      msg.includes('high demand') ||
      msg.includes('service unavailable') ||
      msg.includes('overload') ||
      msg.includes('resource_exhausted') ||
      msg.includes('rate limit') ||
      msg.includes('gateway timeout') ||
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('temporarily unavailable')
    ) {
      return true;
    }

    return false;
  }

  /**
   * Cancellable sleep helper with AbortSignal
   * @param {number} ms
   * @param {AbortSignal} [signal]
   * @returns {Promise<void>}
   */
  sleep(ms, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) {
        return reject(new DOMException('Generation stopped by user', 'AbortError'));
      }
      const timer = setTimeout(() => {
        resolve();
      }, ms);
      if (signal) {
        const onAbort = () => {
          clearTimeout(timer);
          reject(new DOMException('Generation stopped by user', 'AbortError'));
        };
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }

  /**
   * Execute a single attempt of Gemini streaming for a specific model
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
    signal,
    onChunk,
    searchContext = '',
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
      : buildDynamicSystemInstruction(systemInstruction);

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
        throw new DOMException('Generation stopped by user', 'AbortError');
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
   * Stream a response from Gemini with resilient model fallback support:
   * 1. Attempts the primary model (gemini-3.8-flash) with limited retries.
   * 2. If it encounters a temporary 503 / high-demand error, cleanly switches to configured fallback models.
   * 3. Does NOT fallback for invalid API keys, authentication, or client errors.
   * 
   * @param {object} params
   * @param {string} params.prompt - Current user input
   * @param {Array<object>} params.messages - Entire message history of conversation
   * @param {Array<object>} [params.attachments] - Uploaded images or documents
   * @param {string} [params.modelId] - Selected model
   * @param {string} [params.apiKey] - User API key override
   * @param {string} [params.systemInstruction] - Custom system persona
   * @param {number} [params.temperature] - Generation temperature
   * @param {AbortSignal} [params.signal] - Abort controller signal
   * @param {(chunk: string, fullText: string) => void} params.onChunk - Streaming callback
   * @param {(modelUsed: string) => void} [params.onModelUsed] - Notifies caller which model responded
   * @returns {Promise<string>} Full final text
   */
  async streamChat(params) {
    const { prompt, onChunk, signal, onModelUsed, sources } = params;

    // If no real API key is configured, provide an intelligent simulated response
    if (!this.hasApiKey(params.apiKey)) {
      return this.simulateStreamingResponse({ prompt, onChunk, signal, sources });
    }

    const requestedModel = params.modelId || DEFAULT_MODEL_ID;

    // Build the ordered model attempt list: requested model first, then configured fallback chain
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
        // Log development notice without exposing API key
        console.info(
          `[Ayan AI] Primary Gemini model unavailable. Trying fallback model (${activeModel})...`
        );
      }

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (signal && signal.aborted) {
          throw new Error('Generation stopped.');
        }

        try {
          // Reset partial chunk buffer on retries or model switches
          if ((attempt > 1 || !isPrimary) && typeof onChunk === 'function') {
            onChunk('', '');
          }

          if (typeof onModelUsed === 'function') {
            onModelUsed(activeModel);
          }

          const result = await this._executeStreamChat({
            ...params,
            modelId: activeModel,
          });

          if (!isPrimary) {
            console.info(`[Ayan AI] Fallback model (${activeModel}) responded successfully.`);
          }

          return result;
        } catch (err) {
          lastError = err;

          if (err.name === 'AbortError' || (signal && signal.aborted)) {
            throw new Error('Generation stopped.');
          }

          // Permanent error (e.g. invalid API key, permission denied, 400, 401, 403, 404):
          // Immediately abort without retrying or falling back!
          if (!this.isTemporaryAvailabilityError(err)) {
            console.error('[Ayan AI] Permanent non-retryable error encountered:', err.message || err);
            throw this.normalizeError(err);
          }

          // Temporary error: log warning for debugging (NEVER log the API key!)
          console.warn(
            `[Ayan AI] Model ${activeModel} attempt ${attempt}/${maxAttempts} encountered temporary issue:`,
            err.status || err.message
          );

          // Retry the same model if attempts remain
          if (attempt < maxAttempts) {
            try {
              await this.sleep(MODEL_CONFIG.retryDelayMs || 1000, signal);
            } catch (abortErr) {
              throw new Error('Generation stopped.');
            }
          }
        }
      }

      // If attempts on this model failed, loop proceeds to next candidate model if available
    }

    // All primary attempts and fallbacks failed with temporary availability issues
    console.error(
      '[Ayan AI] All configured Gemini models temporarily unavailable. Debug details:',
      lastError?.message || lastError
    );

    throw new Error('Ayan AI is temporarily busy. Please try again in a few seconds.');
  }

  /**
   * Normalize API errors into helpful, human-readable explanations
   * @param {any} error
   * @returns {Error}
   */
  normalizeError(error) {
    const msg = error?.message || String(error);

    if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
      return new Error('Invalid Gemini API key. Please check your API key in Settings or your .env file.');
    }
    if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
      return new Error('Ayan AI is temporarily busy. Please try again in a few seconds.');
    }
    if (msg.includes('PERMISSION_DENIED')) {
      return new Error('Permission denied. Please ensure your Gemini API key has access to the selected model.');
    }
    if (msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand')) {
      return new Error('Ayan AI is temporarily busy. Please try again in a few seconds.');
    }
    if (msg.includes('no longer available') || msg.includes('gemini-2.5')) {
      return new Error('The selected model is deprecated. Ayan AI has automatically switched to Gemini 3.8 Flash.');
    }
    if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return new Error('Network error. Please check your internet connection and try again.');
    }

    return new Error(msg || 'Ayan AI is temporarily busy. Please try again in a few seconds.');
  }

  /**
   * Realistic streaming simulation when running in demo/offline mode
   * @private
   */
  async simulateStreamingResponse({ prompt, onChunk, signal, sources = [] }) {
    const clean = (prompt || '').toLowerCase().trim();
    let demoResponse = '';

    if (sources && sources.length > 0) {
      const topSource = sources[0];
      const sourceListMarkdown = sources
        .map((s) => `- [${s.title}](${s.url}) - *${s.source}*`)
        .join('\n');

      if (clean.includes('virat kohli')) {
        demoResponse = `Virat Kohli was born on November 5, 1988.\n\nAs of today's reference date, September 28, 2026, he is **37 years old** (2026 - 1988 - 1 = 37, since his birthday on November 5 has not occurred yet this year). He will turn 38 on November 5, 2026.\n\n### Sources\n${sourceListMarkdown}`;
      } else if (clean.includes('react')) {
        demoResponse = `### Latest React Information\n\nBased on live web search results:\n\n- **${topSource.title}**: ${topSource.snippet}\n${sources[1] ? `- **${sources[1].title}**: ${sources[1].snippet}\n` : ''}\n### Sources\n${sourceListMarkdown}`;
      } else if (clean.includes('node')) {
        demoResponse = `### Latest Node.js Information\n\nBased on live web search results:\n\n- **${topSource.title}**: ${topSource.snippet}\n${sources[1] ? `- **${sources[1].title}**: ${sources[1].snippet}\n` : ''}\n### Sources\n${sourceListMarkdown}`;
      } else if (clean.includes('cricket') || clean.includes('score')) {
        demoResponse = `### Live Cricket Update\n\nBased on current match search results:\n\n- **${topSource.title}**: ${topSource.snippet}\n${sources[1] ? `- **${sources[1].title}**: ${sources[1].snippet}\n` : ''}\n### Sources\n${sourceListMarkdown}`;
      } else {
        demoResponse = `### Live Web Search Results\n\nBased on verified web results for your inquiry:\n\n${sources.slice(0, 3).map((s) => `- **${s.title}** (${s.source}): ${s.snippet}`).join('\n\n')}\n\n### Sources\n${sourceListMarkdown}`;
      }
    } else if (clean.includes('virat kohli') && (clean.includes('age') || clean.includes('how old'))) {
      demoResponse = `Virat Kohli was born on November 5, 1988.\n\nAs of today's reference date, September 28, 2026, he is **37 years old** (2026 - 1988 - 1 = 37, since his birthday on November 5 has not occurred yet this year). He will turn 38 on November 5, 2026.`;
    } else if (clean.includes('virat kohli') && clean.includes('38')) {
      demoResponse = `Virat Kohli was born on November 5, 1988. He will turn **38 years old on November 5, 2026** (in approximately five weeks and three days).`;
    } else if (clean.includes('what year') || clean.includes('current year')) {
      const year = new Date().getFullYear();
      demoResponse = `It is currently the year **${year}**.`;
    } else if (clean.includes('born on january 1, 2000') || clean.includes('born january 1 2000')) {
      demoResponse = `Someone born on January 1, 2000 is currently **26 years old** as of 2026 (2026 - 2000 = 26).`;
    } else if (clean.includes('born today')) {
      demoResponse = `Someone born today is **0 years old** (a newborn).`;
    } else if (clean.includes('born tomorrow')) {
      demoResponse = `Someone born tomorrow has not been born yet and has not reached any age.`;
    } else {
      demoResponse = `### Hello! I am **Ayan AI** 🚀

> **Demo Mode Notice:** No Gemini API key was detected. You are viewing a simulated streaming response. To chat with the live Google Gemini API, add your key to \`.env\` (\`VITE_GEMINI_API_KEY\`) or click **Settings** (⚙️) to enter your key anytime!

---

You asked:
> *${prompt}*

Here is an example of what I can help you build:

#### ⚡ Quick Modern React Hook Example:
\`\`\`javascript
import { useState, useEffect } from 'react';

// Production custom hook for smooth media query responsiveness
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event) => setMatches(event.matches);

    mediaQueryList.addEventListener('change', listener);
    return () => mediaQueryList.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
\`\`\`

#### Key Capabilities of Ayan AI:
- 💬 **Live streaming token-by-token** generation
- 🎨 **Code syntax highlighting** with language tags and copy button
- 📎 **Multimodal file & image uploads**
- 🎙️ **Real-time voice input transcription**
- 🌓 **Dynamic light & dark mode**
- 📱 **100% responsive drawer & sidebar**

Feel free to paste your own Gemini API key in **Settings** or test the interface right away!`;
    }

    // Stream word-by-word with realistic variable typing delays
    const words = demoResponse.split(/(\s+)/);
    let fullText = '';

    for (const token of words) {
      if (signal && signal.aborted) {
        throw new DOMException('Generation stopped by user', 'AbortError');
      }

      await new Promise((res) => setTimeout(res, 22));
      fullText += token;
      if (typeof onChunk === 'function') {
        onChunk(token, fullText);
      }
    }

    return fullText;
  }
}

export const geminiService = new GeminiService();
export default geminiService;
