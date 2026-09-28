/**
 * Web Search Service
 * 
 * Provides live web search capability for Ayan AI.
 * Implements a multi-provider abstraction:
 * 1. Third-party providers via WEB_SEARCH_API_KEY (Tavily, Serper, Brave) if configured.
 * 2. Zero-config DuckDuckGo web search engine fallback (no API key required).
 * 3. Graceful degradation: handles timeouts, network drops, and parse errors safely.
 * 
 * JavaScript only - No TypeScript.
 */

import dotenv from 'dotenv';
dotenv.config();

const MAX_RESULTS_DEFAULT = 5;
const SNIPPET_MAX_LENGTH = 300;
const FETCH_TIMEOUT_MS = 8000;

/**
 * Clean and truncate snippet text
 * @param {string} text
 * @returns {string}
 */
function cleanSnippet(text) {
  if (!text) return '';
  const cleaned = text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length > SNIPPET_MAX_LENGTH) {
    return cleaned.slice(0, SNIPPET_MAX_LENGTH) + '...';
  }
  return cleaned;
}

/**
 * Clean and decode titles
 * @param {string} text
 * @returns {string}
 */
function cleanTitle(text) {
  if (!text) return 'Web Result';
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract clean domain name from URL
 * @param {string} urlString
 * @returns {string}
 */
function extractDomain(urlString) {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'web';
  }
}

/**
 * Helper to fetch with timeout
 * @param {string} url
 * @param {object} options
 * @param {number} [timeoutMs]
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * DuckDuckGo HTML search (Zero-configuration fallback)
 * @param {string} query
 * @param {number} [maxResults]
 * @returns {Promise<Array<object>>}
 */
export async function searchDuckDuckGo(query, maxResults = MAX_RESULTS_DEFAULT) {
  try {
    const postBody = new URLSearchParams({
      q: query,
      b: '',
      kl: 'us-en',
    }).toString();

    let response = await fetchWithTimeout('https://html.duckduckgo.com/html/', {
      method: 'POST',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: 'https://html.duckduckgo.com',
        Referer: 'https://html.duckduckgo.com/',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      body: postBody,
    });

    if (!response.ok) {
      // Fallback to GET
      response = await fetchWithTimeout(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
    }

    const html = await response.text();
    const resultBlocks = html.split('<div class="result results_links');
    const results = [];

    for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
      const block = resultBlocks[i];

      const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch) {
        const rawUrl = titleMatch[1];
        let actualUrl = rawUrl;

        // Resolve real destination URL from DuckDuckGo redirect link
        try {
          if (rawUrl.includes('uddg=')) {
            const uddg = rawUrl.match(/uddg=([^&]+)/);
            if (uddg && uddg[1]) {
              actualUrl = decodeURIComponent(uddg[1]);
            }
          } else if (rawUrl.startsWith('//')) {
            actualUrl = 'https:' + rawUrl;
          }
        } catch {
          actualUrl = rawUrl;
        }

        const title = cleanTitle(titleMatch[2]);
        const snippet = snippetMatch ? cleanSnippet(snippetMatch[1]) : '';
        const source = extractDomain(actualUrl);

        if (actualUrl && title) {
          results.push({
            title,
            url: actualUrl,
            snippet,
            source,
            publishedAt: null,
          });
        }
      }
    }

    return results;
  } catch (err) {
    console.warn('[webSearchService] DuckDuckGo search error:', err.message);
    return [];
  }
}

/**
 * Wikipedia Reference Search Fallback
 * Provides reliable, never-rate-limited knowledge and current events lookup.
 * @param {string} query
 * @param {number} [maxResults]
 * @returns {Promise<Array<object>>}
 */
export async function searchWikipedia(query, maxResults = MAX_RESULTS_DEFAULT) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      query
    )}&format=json&utf8=&origin=*`;
    const response = await fetchWithTimeout(url, {
      headers: {
        'User-Agent': 'AyanAI/1.0 (ayan-ai@assistant.local)',
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    const items = data.query?.search || [];

    return items.slice(0, maxResults).map((item) => ({
      title: cleanTitle(item.title),
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/\s+/g, '_'))}`,
      snippet: cleanSnippet(item.snippet),
      source: 'wikipedia.org',
      publishedAt: item.timestamp || null,
    }));
  } catch (err) {
    console.warn('[webSearchService] Wikipedia search error:', err.message);
    return [];
  }
}

/**
 * Tavily AI Search Provider
 * @param {string} query
 * @param {string} apiKey
 * @param {number} [maxResults]
 * @returns {Promise<Array<object>>}
 */
export async function searchTavily(query, apiKey, maxResults = MAX_RESULTS_DEFAULT) {
  try {
    const response = await fetchWithTimeout('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily responded with status ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data.results)) return [];

    return data.results.slice(0, maxResults).map((item) => ({
      title: cleanTitle(item.title),
      url: item.url,
      snippet: cleanSnippet(item.content),
      source: extractDomain(item.url),
      publishedAt: item.published_date || null,
    }));
  } catch (err) {
    console.warn('[webSearchService] Tavily search error:', err.message);
    throw err;
  }
}

/**
 * Serper (Google Search) Provider
 * @param {string} query
 * @param {string} apiKey
 * @param {number} [maxResults]
 * @returns {Promise<Array<object>>}
 */
export async function searchSerper(query, apiKey, maxResults = MAX_RESULTS_DEFAULT) {
  try {
    const response = await fetchWithTimeout('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: maxResults,
      }),
    });

    if (!response.ok) {
      throw new Error(`Serper responded with status ${response.status}`);
    }

    const data = await response.json();
    const organic = data.organic || [];

    return organic.slice(0, maxResults).map((item) => ({
      title: cleanTitle(item.title),
      url: item.link,
      snippet: cleanSnippet(item.snippet),
      source: extractDomain(item.link),
      publishedAt: item.date || null,
    }));
  } catch (err) {
    console.warn('[webSearchService] Serper search error:', err.message);
    throw err;
  }
}

/**
 * Brave Search Provider
 * @param {string} query
 * @param {string} apiKey
 * @param {number} [maxResults]
 * @returns {Promise<Array<object>>}
 */
export async function searchBrave(query, apiKey, maxResults = MAX_RESULTS_DEFAULT) {
  try {
    const response = await fetchWithTimeout(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${maxResults}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave search responded with status ${response.status}`);
    }

    const data = await response.json();
    const webResults = data.web?.results || [];

    return webResults.slice(0, maxResults).map((item) => ({
      title: cleanTitle(item.title),
      url: item.url,
      snippet: cleanSnippet(item.description),
      source: extractDomain(item.url),
      publishedAt: item.page_age || null,
    }));
  } catch (err) {
    console.warn('[webSearchService] Brave search error:', err.message);
    throw err;
  }
}

/**
 * Master search function with multi-provider abstraction and automatic fallback:
 * 1. Tries configured API provider if WEB_SEARCH_API_KEY / TAVILY_API_KEY / SERPER_API_KEY is present.
 * 2. If provider fails or no key is present, falls back automatically to DuckDuckGo.
 * 3. Never throws unhandled exceptions; returns normalized empty result array on complete failure.
 * 
 * @param {string} query - Clean search query string
 * @param {object} [options]
 * @param {number} [options.maxResults]
 * @returns {Promise<{ results: Array<object>, sources: Array<object>, provider: string, error?: string }>}
 */
export async function searchWeb(query, options = {}) {
  const maxResults = options.maxResults || MAX_RESULTS_DEFAULT;
  const cleanQuery = (query || '').trim().slice(0, 150);

  if (!cleanQuery) {
    return { results: [], sources: [], provider: null };
  }

  const apiKey =
    process.env.WEB_SEARCH_API_KEY ||
    process.env.TAVILY_API_KEY ||
    process.env.SERPER_API_KEY ||
    process.env.BRAVE_API_KEY ||
    '';

  // Attempt configured provider
  if (apiKey && apiKey.trim().length > 5) {
    const trimmedKey = apiKey.trim();

    // Check Tavily
    if (trimmedKey.startsWith('tvly-') || process.env.TAVILY_API_KEY) {
      try {
        console.log(`[webSearchService] Querying Tavily for: "${cleanQuery}"`);
        const results = await searchTavily(cleanQuery, trimmedKey, maxResults);
        if (results.length > 0) {
          return { results, sources: results, provider: 'tavily' };
        }
      } catch (tavilyErr) {
        console.warn('[webSearchService] Tavily failed, falling back to DuckDuckGo:', tavilyErr.message);
      }
    }

    // Check Serper
    if (process.env.SERPER_API_KEY) {
      try {
        console.log(`[webSearchService] Querying Serper for: "${cleanQuery}"`);
        const results = await searchSerper(cleanQuery, trimmedKey, maxResults);
        if (results.length > 0) {
          return { results, sources: results, provider: 'serper' };
        }
      } catch (serperErr) {
        console.warn('[webSearchService] Serper failed, falling back to DuckDuckGo:', serperErr.message);
      }
    }

    // Check Brave
    if (process.env.BRAVE_API_KEY) {
      try {
        console.log(`[webSearchService] Querying Brave for: "${cleanQuery}"`);
        const results = await searchBrave(cleanQuery, trimmedKey, maxResults);
        if (results.length > 0) {
          return { results, sources: results, provider: 'brave' };
        }
      } catch (braveErr) {
        console.warn('[webSearchService] Brave failed, falling back to DuckDuckGo:', braveErr.message);
      }
    }
  }

  // Zero-config default: DuckDuckGo
  try {
    console.log(`[webSearchService] Querying DuckDuckGo for: "${cleanQuery}"`);
    const results = await searchDuckDuckGo(cleanQuery, maxResults);
    if (results.length > 0) {
      return {
        results,
        sources: results,
        provider: 'duckduckgo',
      };
    }

    // If DuckDuckGo yielded 0 results (e.g. rate limit or 202 challenge), fall back to Wikipedia
    console.log(`[webSearchService] DuckDuckGo returned 0 results, trying Wikipedia fallback for: "${cleanQuery}"`);
    const wikiResults = await searchWikipedia(cleanQuery, maxResults);
    if (wikiResults.length > 0) {
      return {
        results: wikiResults,
        sources: wikiResults,
        provider: 'wikipedia',
      };
    }

    return {
      results: [],
      sources: [],
      provider: null,
      error: 'No search results found.',
    };
  } catch (err) {
    console.error('[webSearchService] Search providers failed, trying Wikipedia fallback:', err.message);
    const wikiResults = await searchWikipedia(cleanQuery, maxResults);
    if (wikiResults.length > 0) {
      return {
        results: wikiResults,
        sources: wikiResults,
        provider: 'wikipedia',
      };
    }

    return {
      results: [],
      sources: [],
      provider: null,
      error: 'Web search is temporarily unavailable.',
    };
  }
}

export default {
  searchWeb,
  searchDuckDuckGo,
  searchWikipedia,
  searchTavily,
  searchSerper,
  searchBrave,
};
