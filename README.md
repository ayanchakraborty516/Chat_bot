# Ayan AI 🚀

> **Production-Quality Advanced AI Chatbot Web Application** powered by Google Gemini, built entirely with modern React and JavaScript/JSX.

---

## 🌟 Key Features

- 🌐 **Live Web Search & Grounding**: Real-time backend search capability via Express. Automatically detects time-sensitive queries ("latest news", "cricket score", "how old is...", "who is current CEO", "release date") and explicit search requests ("search the web for..."). Grounded responses include clickable source citations and a dedicated **"Web Sources"** card drawer!
- 🔍 **Multi-Provider Search Abstraction**: Supports third-party search APIs (Tavily, Serper, Brave) via `WEB_SEARCH_API_KEY` on the backend, with an automatic zero-configuration DuckDuckGo and Wikipedia search fallback.
- ⚡ **Real-Time Token Streaming**: Smooth, responsive token-by-token streaming powered by Google Gemini API (`gemini-3.8-flash` primary with automatic `gemini-3.1-flash-lite` fallback).
- 💾 **MongoDB Full Persistence**: Permanent storage for conversations and messages (including user attachments and web search citations) using Express and Mongoose.
- 🎨 **Markdown & Code Highlighting**: Rich formatted markdown including tables, blockquotes, lists, and syntax-highlighted code blocks with one-click **"Copy Code"** and language badges.
- 🎙️ **Voice-to-Text Transcription**: Native browser Web Speech API voice input with animated microphone wave pulse.
- 📎 **Multimodal File Attachments**: Upload and preview images (PNG, JPG, WEBP) and text/code documents with instant thumbnail chips, drag-and-drop, and clipboard paste support.
- 🌓 **Dark & Light Mode**: Seamless theme switching with OS system preference synchronization and persistent memory (zero FOUC).
- 📱 **100% Fully Responsive**: Desktop collapsible sidebar and mobile slide-over drawer with backdrop overlay. Flawless layout on 320px, 375px, 768px, 1024px, and 1440px displays with zero horizontal overflow.
- 💬 **Conversation Management**:
  - New chat generation
  - Auto-generated conversation titles
  - Chronological groupings (*Today, Yesterday, Previous 7 Days, Older*)
  - Live search across titles and message contents
  - Inline rename and safe delete confirmations
- 🔄 **Message Controls**:
  - Copy full response text
  - Regenerate AI response
  - Thumbs up / Thumbs down feedback states
  - Stop generation mid-stream
  - Actionable error banners with one-click retry
- ⚙️ **In-App Settings & Model Selector**:
  - Switch between `Gemini 3.8 Flash`, `Gemini Flash Latest`, and `Gemini 3.1 Flash Lite`
  - In-app custom API key override (stored locally in browser)
  - Temperature slider (0.0 to 1.0)
  - Custom system persona / instructions
  - Offline / Keyless fallback simulator so anyone reviewing the portfolio can immediately experience full streaming and markdown!

---

## 📁 Architecture & File Structure

```text
ayan-ai/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/            # Reusable buttons, modals, tooltips
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Tooltip.jsx
│   │   │   └── SettingsModal.jsx
│   │   ├── layout/            # Layout wrappers
│   │   │   └── AppLayout.jsx
│   │   ├── chat/              # Chat interface components
│   │   │   ├── AttachmentPreview.jsx
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── CodeBlock.jsx
│   │   │   ├── ErrorBanner.jsx
│   │   │   ├── MarkdownRenderer.jsx
│   │   │   ├── MessageItem.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── ThinkingIndicator.jsx
│   │   │   └── WelcomeScreen.jsx
│   │   └── sidebar/           # Sidebar & drawer components
│   │       ├── ConversationItem.jsx
│   │       ├── ConversationList.jsx
│   │       ├── SearchInput.jsx
│   │       ├── Sidebar.jsx
│   │       ├── SidebarFooter.jsx
│   │       └── SidebarHeader.jsx
│   ├── pages/                 # High-level views
│   │   └── ChatPage.jsx
│   ├── layouts/               # Responsive layout shell
│   │   └── MainLayout.jsx
│   ├── services/              # Decoupled business logic
│   │   ├── geminiService.js   # Gemini API streaming & multimodal service
│   │   ├── storageService.js  # Persistence adapter (ready for DB swap)
│   │   └── speechService.js   # Web Speech API wrapper
│   ├── hooks/                 # Custom React hooks
│   │   ├── useChatScroll.js   # Smart auto-scrolling
│   │   ├── useResponsive.js   # Breakpoint detection
│   │   └── useSpeechToText.js # Microphone hook
│   ├── context/               # Global state contexts
│   │   ├── ChatContext.jsx
│   │   ├── SettingsContext.jsx
│   │   └── ThemeContext.jsx
│   ├── utils/                 # Pure helper functions
│   │   ├── formatters.js
│   │   └── helpers.js
│   ├── config/                # App constants & models
│   │   └── constants.js
│   ├── App.jsx                # Application root
│   ├── main.jsx               # React DOM entrypoint
│   └── index.css              # Tailwind + Custom Design System
├── .env.example               # Environment variables template
├── .gitignore                 # Protected secrets
├── package.json
└── README.md
```

---

## 🔮 Extending to Future Features

The application has been decoupled specifically so advanced capabilities can be plugged in without refactoring the UI:

1. **MongoDB / Firebase Cloud Storage**:
   Update `src/services/storageService.js` to execute API requests to your database instead of `localStorage`. All methods (`getConversations`, `saveConversations`, etc.) are decoupled from the UI.
2. **User Authentication**:
   Wrap `App.jsx` with an `AuthProvider` and pass user credentials into `storageService.js` and `geminiService.js`.
3. **Retrieval-Augmented Generation (RAG) & Document Analysis**:
   Expand `geminiService.buildMultimodalParts()` to query vector embeddings or your vector database (Pinecone, Chroma, etc.) before invoking the model.
4. **Web Search & Tool Calling**:
   Add tools config to `geminiService.js` using the Gemini Function Calling API (`tools: [{ googleSearch: {} }]`).

---

## 🛠️ Getting Started

### 1. Prerequisites
- Node.js `v18+` or `v22+`
- npm `v9+` or `v11+`

### 2. Installation
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your free Google Gemini API key:
```env
VITE_GEMINI_API_KEY=AIzaSy...
```
*(Note: You can also launch the app and paste your API key directly into the in-app Settings modal!)*

### 4. Run Development Server
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## 🔒 Code Quality Rules Enforced

- **Pure JavaScript + JSX**: 100% JavaScript. Zero TypeScript (`.ts`/`.tsx`).
- **No Hardcoded Secrets**: All API keys configured through environment variables or secure browser storage.
- **Accessible & High-Contrast**: Accessible contrast ratios, keyboard navigation (ESC dialogs, Enter/Shift+Enter messaging), touch-target minimums (>= 44px).
