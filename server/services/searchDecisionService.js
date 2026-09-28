/**
 * Search Decision & Grounding Service
 * 
 * Determines whether a user question requires live web search,
 * isolates clean search queries, and constructs grounded context prompts for Gemini.
 * 
 * JavaScript only - No TypeScript.
 */

import { getCurrentDateInfo } from '../utils/dateUtils.js';

/**
 * Determine whether a query requires live web search
 * @param {string} text - User prompt
 * @param {boolean} [forceSearch=false] - Explicit override
 * @returns {{ shouldSearch: boolean, reason: string, searchQuery: string }}
 */
export function shouldSearch(text, forceSearch = false) {
  if (!text || typeof text !== 'string') {
    return { shouldSearch: false, reason: 'empty_query', searchQuery: '' };
  }

  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // If user explicitly forced search via UI button or flag
  if (forceSearch) {
    const cleaned = cleanExtractedQuery(trimmed);
    return {
      shouldSearch: true,
      reason: 'user_forced_search',
      searchQuery: cleaned || trimmed,
    };
  }

  // 1. Explicit search commands from user
  const explicitPatterns = [
    /^(?:please\s+)?(?:search\s+the\s+web\s+for|search\s+online\s+for|search\s+the\s+internet\s+for|search\s+for|look\s+up|google|find\s+online\s+for|find\s+online|find\s+info\s+on)\s+(.+)$/i,
    /^(?:can\s+you\s+)?(?:search\s+the\s+web\s+for|search\s+online\s+for|search\s+the\s+internet\s+for|search\s+for|look\s+up|find)\s+(.+)$/i,
    /^(?:search)\s+(.+)$/i,
  ];

  for (const pattern of explicitPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extracted = cleanExtractedQuery(match[1]);
      if (extracted.length > 1) {
        return {
          shouldSearch: true,
          reason: 'explicit_search_request',
          searchQuery: extracted,
        };
      }
    }
  }

  // 2. Greetings and conversational remarks (never search)
  const conversationalRegex =
    /^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|night)|howdy|sup|yo|thank\s+you|thanks|who\s+are\s+you|what\s+can\s+you\s+do|help|bye|goodbye)[.!?]*$/i;
  if (conversationalRegex.test(lower)) {
    return { shouldSearch: false, reason: 'conversational_bypass', searchQuery: trimmed };
  }

  // 3. Coding and purely conceptual programming queries bypass
  // (unless accompanied by time-sensitive release/news terms)
  const isAskingTimeSensitive =
    /\b(latest|current|recent|new|upcoming|release|version|news|update|today|2025|2026)\b/i.test(lower);

  if (!isAskingTimeSensitive) {
    const codeConceptPatterns = [
      /^(?:what\s+is|explain|how\s+does|write|create|implement|give\s+me\s+an\s+example\s+of)\s+(?:a\s+|an\s+|the\s+)?(?:linked\s+list|binary\s+tree|hash\s+map|stack|queue|algorithm|recursion|hoisting|closure|promise|async\/await|generator|react\s+hook|component|css|html|javascript|typescript|python|c\+\+|java|sql|regex)/i,
      /^(?:what\s+is|explain)\s+(?:javascript|python|react|vue|angular|docker|kubernetes|git|html|css|json|node\.?js|express)/i,
      /^(?:write|code|create)\s+(?:a\s+|an\s+)?(?:function|script|component|app|program|class|method|hook|loop|test|query)/i,
      /^(?:how\s+to|how\s+do\s+i)\s+(?:sort|reverse|filter|map|reduce|iterate|loop|parse|convert|calculate|center|style|align)/i,
      /^(?:difference\s+between|compare)\s+/i,
    ];

    for (const pat of codeConceptPatterns) {
      if (pat.test(lower)) {
        return { shouldSearch: false, reason: 'coding_conceptual_bypass', searchQuery: trimmed };
      }
    }
  }

  // 4. Time-sensitive, current events, and live information queries
  const timeSensitiveTriggers = [
    /\b(latest\s+news|breaking\s+news|current\s+news|recent\s+news)\b/i,
    /\b(today'?s?|tonight'?s?|yesterday'?s?|tomorrow'?s?)\b/i,
    /\b(score|match|game|tournament|standings|ipl|world\s+cup|olympics|champions\s+league|premier\s+league)\b/i,
    /\b(how\s+old\s+is|current\s+age|age\s+of)\b/i,
    /\b(who\s+is\s+the\s+current|current\s+ceo|current\s+president|current\s+prime\s+minister|current\s+leader)\b/i,
    /\b(stock\s+price|market\s+price|crypto\s+price|bitcoin\s+price|weather\s+in|weather\s+forecast)\b/i,
    /\b(latest\s+release|latest\s+version|release\s+date|what'?s\s+new\s+in)\b/i,
    /\b(what\s+is\s+the\s+latest|who\s+won\s+the\s+latest|who\s+won\s+today)\b/i,
    /\b(current\s+date|current\s+year|what\s+date\s+is\s+it)\b/i,
  ];

  for (const trigger of timeSensitiveTriggers) {
    if (trigger.test(lower)) {
      const cleaned = cleanExtractedQuery(trimmed);
      return {
        shouldSearch: true,
        reason: 'time_sensitive_query',
        searchQuery: cleaned || trimmed,
      };
    }
  }

  // Default: no web search needed
  return {
    shouldSearch: false,
    reason: 'general_knowledge',
    searchQuery: trimmed,
  };
}

/**
 * Clean extracted query string for optimal search engine performance
 * @param {string} text
 * @returns {string}
 */
export function cleanExtractedQuery(text) {
  if (!text) return '';
  return text
    .replace(/^(?:the\s+web\s+for|online\s+for|the\s+internet\s+for|for|about|on)\s+/i, '')
    .replace(/[?.!]+$/, '')
    .trim();
}

/**
 * Builds the contextual grounding prompt incorporating search results
 * @param {object} params
 * @param {string} params.query - Original or clean search query
 * @param {Array<object>} params.results - Normalized search results
 * @param {Date} [params.referenceDate] - Optional date reference
 * @returns {string} Formatted context prompt
 */
export function buildSearchContextPrompt({ query, results = [], referenceDate }) {
  const dateInfo = getCurrentDateInfo(referenceDate);

  if (!results || results.length === 0) {
    return `CRITICAL TEMPORAL CONTEXT:
The current reference date is: ${dateInfo.humanReadable} (Year: ${dateInfo.year}).
Note: A live web search was attempted for "${query}" but returned no external results. Please state clearly that current external search results were unavailable, and answer using your verified foundational knowledge.`;
  }

  const formattedResults = results
    .map((item, index) => {
      const num = index + 1;
      const snippet = item.snippet ? item.snippet.replace(/\n+/g, ' ') : 'No snippet available';
      return `[Source ${num}]
Title: ${item.title || 'Untitled'}
URL: ${item.url}
Domain: ${item.source || 'web'}
Snippet: ${snippet}`;
    })
    .join('\n\n');

  return `LIVE WEB SEARCH RESULTS FOR: "${query}"
Reference Date: ${dateInfo.humanReadable} (Year: ${dateInfo.year})

${formattedResults}

CRITICAL GROUNDING & SOURCE CITATION INSTRUCTIONS:
1. Primary Source of Truth: Use the supplied live web-search results above as your authoritative source for current factual claims.
2. Accuracy & Hallucination Prevention: Do NOT invent, assume, or extrapolate information that is not supported by these results. If the results do not provide the full answer, explicitly state what is known and what remains unverified.
3. Discrepancy Handling: If sources disagree or present conflicting details, clearly highlight and explain the disagreement.
4. Temporal Reasoning: Align all age, elapsed time, or currency evaluations with today's reference date (${dateInfo.humanReadable}).
5. Source Citations: At the very end of your response, always include a clean "### Sources" section listing the referenced sources as markdown links in this format:
- [Source Title](URL) - Brief context`;
}

export default {
  shouldSearch,
  cleanExtractedQuery,
  buildSearchContextPrompt,
};
