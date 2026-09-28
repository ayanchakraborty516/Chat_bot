/**
 * Application Constants and Configuration
 * Production configuration for Ayan AI
 */

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

export const MODELS = [
  {
    id: PRIMARY_MODEL_ID,
    name: 'Gemini 3.8 Flash',
    badge: 'Primary',
    description: 'Next-gen flagship model with high speed, accuracy, and multimodal capabilities.',
    isDefault: true,
  },
  {
    id: FALLBACK_MODEL_ID,
    name: 'Gemini Flash Latest',
    badge: 'High Availability',
    description: 'Official latest available Flash pointer with high uptime and consistent throughput.',
  },
  {
    id: SECONDARY_FALLBACK_MODEL_ID,
    name: 'Gemini 3.1 Flash Lite',
    badge: 'Ultra Fast',
    description: 'Lightweight, ultra-responsive model optimized for low latency and high availability.',
  },
];

export const DEFAULT_SYSTEM_INSTRUCTION =
  'You are Ayan AI, a production-grade, highly capable, helpful, and empathetic AI assistant. You provide clear, concise, well-structured, and accurate responses. You format code blocks with proper syntax highlighting, cite steps methodically, and tailor your tone to the user.';

export const STORAGE_KEYS = {
  THEME: 'ayan_theme',
  CONVERSATIONS: 'ayan_conversations',
  ACTIVE_CONVERSATION: 'ayan_active_conversation_id',
  SETTINGS: 'ayan_user_settings',
  AUTH_TOKEN: 'ayan_auth_token',
};

export const STARTER_PROMPT_CATEGORIES = [
  {
    id: 'coding',
    label: 'Code & Debug',
    icon: 'Code',
    prompts: [
      {
        title: 'High-Performance Debounce',
        description: 'Write a modern JavaScript debounce utility with immediate execution flag.',
        prompt: 'Write a robust, production-quality debounce function in modern JavaScript with an option for immediate execution (leading edge), TypeScript-like JSDoc annotations, and unit test examples.',
      },
      {
        title: 'React Performance Audit',
        description: 'Explain when to use useMemo vs useCallback with practical examples.',
        prompt: 'Explain the nuanced differences between useMemo and useCallback in React with concrete examples showing when each genuinely improves performance versus when it adds overhead.',
      },
    ],
  },
  {
    id: 'architecture',
    label: 'System Design',
    icon: 'Cpu',
    prompts: [
      {
        title: 'Scalable Microservices',
        description: 'Design an event-driven architecture for e-commerce order processing.',
        prompt: 'Design an event-driven microservices architecture for an e-commerce order processing pipeline that handles flash sales, inventory locks, payment webhooks, and idempotent retries.',
      },
      {
        title: 'PostgreSQL vs MongoDB',
        description: 'Compare relational vs document stores for high-throughput SaaS.',
        prompt: 'Provide an in-depth comparison between PostgreSQL and MongoDB for a multi-tenant SaaS application, covering indexing, transactional ACID guarantees, schema evolution, and horizontal scaling.',
      },
    ],
  },
  {
    id: 'writing',
    label: 'Writing & Strategy',
    icon: 'PenTool',
    prompts: [
      {
        title: 'Product Pitch Email',
        description: 'Draft a compelling B2B SaaS cold outreach email to CTOs.',
        prompt: 'Draft a persuasive, authentic, and non-spammy cold email pitching an AI-powered developer tool to CTOs of mid-stage tech startups. Include a clear value proposition and a low-friction call to action.',
      },
      {
        title: 'Executive Summary',
        description: 'Synthesize complex quarterly metrics into an executive briefing.',
        prompt: 'Write a template for an executive engineering summary covering sprint velocity, incident post-mortems, cloud infrastructure costs, and roadmap milestone completion.',
      },
    ],
  },
  {
    id: 'brainstorming',
    label: 'Brainstorm & Ideas',
    icon: 'Sparkles',
    prompts: [
      {
        title: 'Full-Stack Portfolio Projects',
        description: 'Brainstorm 3 unique AI web apps that impress senior recruiters.',
        prompt: 'Brainstorm 3 unique, standout full-stack AI web application ideas that demonstrate senior engineering depth beyond generic wrapper apps. Include key architectural challenges and tech stack recommendations.',
      },
    ],
  },
];

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const ALLOWED_TEXT_TYPES = [
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/json',
  'text/javascript',
  'application/javascript',
  'text/html',
  'text/css',
];
