/**
 * Web Search API Routes
 * 
 * Handles query evaluation, live search execution, and grounding context assembly.
 * Pure JavaScript - No TypeScript.
 */

import express from 'express';
import { shouldSearch, buildSearchContextPrompt } from '../services/searchDecisionService.js';
import { searchWeb } from '../services/webSearchService.js';

const router = express.Router();

/**
 * GET /api/search/status
 * Health and provider diagnostic check
 */
router.get('/status', (req, res) => {
  const hasApiKey = Boolean(
    process.env.WEB_SEARCH_API_KEY ||
    process.env.TAVILY_API_KEY ||
    process.env.SERPER_API_KEY ||
    process.env.BRAVE_API_KEY
  );

  res.json({
    status: 'ok',
    configuredProvider: hasApiKey ? 'custom_api_key' : 'duckduckgo_fallback',
    fallbackAvailable: true,
  });
});

/**
 * POST /api/search
 * Body: { query: string, forceSearch?: boolean }
 */
router.post('/', async (req, res) => {
  try {
    const { query, forceSearch = false } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({
        error: 'Search query string is required',
        searched: false,
        results: [],
        sources: [],
      });
    }

    // Step 1: Query evaluation & decision layer
    const decision = shouldSearch(query, forceSearch);

    if (!decision.shouldSearch) {
      return res.json({
        searched: false,
        reason: decision.reason,
        searchQuery: decision.searchQuery,
        results: [],
        sources: [],
        contextPrompt: null,
      });
    }

    // Step 2: Execute backend web search with multi-provider abstraction
    console.log(`[Search API] Triggering web search for: "${decision.searchQuery}" (Reason: ${decision.reason})`);
    const searchOutcome = await searchWeb(decision.searchQuery);

    const results = searchOutcome.results || [];
    const contextPrompt = buildSearchContextPrompt({
      query: decision.searchQuery,
      results,
    });

    res.json({
      searched: true,
      reason: decision.reason,
      searchQuery: decision.searchQuery,
      provider: searchOutcome.provider || 'unknown',
      results,
      sources: results,
      contextPrompt,
      error: searchOutcome.error || null,
    });
  } catch (error) {
    console.error('[Search API] Unexpected error in search endpoint:', error);
    // Graceful error response so client doesn't crash
    res.status(500).json({
      searched: false,
      error: 'Web search temporarily unavailable.',
      results: [],
      sources: [],
      contextPrompt: null,
    });
  }
});

export default router;
