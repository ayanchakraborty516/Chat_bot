# Ayan AI 🚀

> **Production-Quality Advanced AI Chatbot Web Application** powered by Google Gemini, built with modern React (Vite) and Node.js/Express with MongoDB persistence and live web-grounded search.

---

## 🌟 Key Features

- ⚡ **Real-Time SSE Token Streaming**: Smooth, responsive token-by-token streaming from Google Gemini (`gemini-3.8-flash` primary with automatic `gemini-3.1-flash-lite` fallback and resilient 503 retry handling).
- 🌐 **Live Web Search & Grounding**: Real-time backend search capability via Express. Automatically detects time-sensitive queries ("latest news", "current age", "who is current CEO", "sports score") and explicit search requests ("search the web for..."). Grounded responses include clickable source citations and a dedicated **"Web Sources"** card drawer!
- 🔐 **Full User Authentication & Scoping**: Secure email/password authentication using JWT tokens and bcrypt password hashing. User conversations and messages are strictly scoped to their owner.
- 💾 **MongoDB Full Persistence**: Permanent storage for conversations, messages, user attachments, and web search citations using Express and Mongoose.
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
  - Offline preview fallback simulator for demonstration

---

## 🏛️ System Architecture

```text
┌────────────────────────────────┐         ┌─────────────────────────────────┐
│     Vercel Frontend (SPA)      │  HTTPS  │      Render Backend API         │
│   React 19 + Vite + Tailwind   ├────────►│   Node.js + Express 5 + SSE     │
│   Routes: /login, /signup, /   │         │   Endpoints: /api/*             │
└────────────────────────────────┘         └────┬────────────┬─────────────┬─┘
                                                │            │             │
                                                ▼            ▼             ▼
                                        ┌───────────┐ ┌─────────────┐ ┌──────────┐
                                        │  MongoDB  │ │Google Gemini│ │Live Web  │
                                        │   Atlas   │ │     API     │ │  Search  │
                                        └───────────┘ └─────────────┘ └──────────┘
```

- **Frontend (Vercel)**: Fast React Single Page Application built with Vite. Consumes backend REST endpoints and streams AI responses via Server-Sent Events (`POST /api/chat/stream`). SPA route rewrites configured in `vercel.json`.
- **Backend (Render)**: Node.js/Express service. Securely holds API keys and credentials, manages database operations, executes web search lookups, and proxies streaming AI responses.
- **Database (MongoDB Atlas)**: Cloud document database for users, conversations, and chat history.
- **AI Engine (Google Gemini)**: Streams tokens via server-side `@google/generative-ai`.
- **Web Search**: DuckDuckGo & Wikipedia zero-config engine with optional Serper/Tavily API integration.

---

## 📁 Repository Structure

```text
ayan-ai/
├── public/                    # Static assets & favicon
├── src/                       # React Frontend (Vite)
│   ├── components/
│   │   ├── auth/              # Login, Signup, ProtectedRoute
│   │   ├── chat/              # ChatContainer, MessageList, ChatInput, MarkdownRenderer, etc.
│   │   ├── common/            # Button, Modal, Tooltip, SettingsModal
│   │   ├── layout/            # AppLayout, Responsive wrappers
│   │   └── sidebar/           # Sidebar, ConversationList, SearchInput
│   ├── config/                # API base resolver (api.js), constants
│   ├── context/               # AuthContext, ChatContext, SettingsContext, ThemeContext
│   ├── hooks/                 # Custom React hooks (useChatScroll, useResponsive, useSpeechToText)
│   ├── pages/                 # ChatPage, LoginPage, SignupPage
│   ├── services/              # authService, chatService, geminiService, speechService
│   ├── utils/                 # formatters, helpers
│   ├── App.jsx                # Application router & provider shell
│   ├── main.jsx               # React DOM entrypoint
│   └── index.css              # Tailwind + Custom Design System
├── server/                    # Node.js / Express Backend
│   ├── config/                # db.js (Mongoose connection & timeouts)
│   ├── middleware/            # authMiddleware.js (JWT verify & optionalAuth)
│   ├── models/                # User.js, Conversation.js, Message.js
│   ├── routes/                # authRoutes, conversationRoutes, messageRoutes, searchRoutes, chatRoutes
│   ├── services/              # geminiService.js, webSearchService.js, searchDecisionService.js
│   ├── utils/                 # dateUtils.js (Temporal grounding & prompt injection)
│   ├── .env.example           # Backend environment template (safe placeholders)
│   └── server.js              # Express app entrypoint & SSE handler
├── .env.example               # Frontend environment template (safe placeholders)
├── .gitignore                 # Enforces zero secrets committed
├── package.json               # Shared dependencies & scripts
├── vercel.json                # Vercel SPA route rewrite rules
└── README.md
```

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Node.js**: `v18+` or `v22+`
- **npm**: `v9+` or `v11+`
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` (or MongoDB Atlas connection string)
- **Google Gemini API Key**: Free API key from [Google AI Studio](https://aistudio.google.com/)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

#### Frontend Environment (`.env`)
Create `.env` in the project root:
```env
# Root .env - Frontend configuration
VITE_API_URL=http://localhost:5000
```

#### Backend Environment (`server/.env`)
Create `server/.env`:
```env
# Server environment variables
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/ayan-ai
JWT_SECRET=development_super_secret_jwt_key_12345
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
CLIENT_URL=http://localhost:5173
WEB_SEARCH_API_KEY=
```

### 4. Start Development Servers

Open two terminal windows:

**Terminal 1 — Backend Express Server:**
```bash
npm run server
# Server will run on http://localhost:5000
```

**Terminal 2 — Frontend React App:**
```bash
npm run dev
# Frontend will run on http://localhost:5173
```

Verify backend health at: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🚀 Public Production Deployment Guide

Deploy Ayan AI across **GitHub**, **MongoDB Atlas**, **Render**, and **Vercel** with this step-by-step checklist:

### Step 1: Push Source Code to GitHub
1. Create a new GitHub repository: `ayan-ai`.
2. Commit and push your code:
   ```bash
   git add .
   git commit -m "feat: complete deployment-ready Ayan AI application"
   git push origin main
   ```
   *(Note: `.gitignore` automatically prevents your `.env` and `server/.env` files from being committed.)*

---

### Step 2: Set Up MongoDB Atlas (Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign in.
2. Create a free shared cluster (e.g. `Cluster0` on AWS or GCP).
3. **Database Access**:
   - Go to **Security > Database Access**.
   - Click **Add New Database User**.
   - Choose **Password Authentication**, set username (e.g. `ayan_admin`) and a secure password.
   - Grant role: **Read and write to any database**.
4. **Network Access**:
   - Go to **Security > Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access From Anywhere** (`0.0.0.0/0`) since cloud hosts (like Render) use dynamic outbound IPs.
5. **Get Connection String**:
   - Click **Database > Connect > Drivers**.
   - Copy the connection string format:
     ```text
     mongodb+srv://ayan_admin:<password>@cluster0.abcde.mongodb.net/ayan-ai?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual database user password (ensure any special characters in the password are URL-encoded).

---

### Step 3: Deploy Backend to Render
1. Sign in to [Render](https://render.com/).
2. Click **New +** and select **Web Service**.
3. Connect your GitHub repository `ayan-ai`.
4. Configure service settings:
   - **Name**: `ayan-ai-backend` (or your choice)
   - **Region**: Choose region closest to your users (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: *(Leave empty / blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Click **Advanced > Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production optimizations & error sanitization |
| `PORT` | `10000` | (Render assigns dynamic port automatically, or 5000/10000) |
| `MONGODB_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
| `JWT_SECRET` | *(Random 32+ char string)* | Secret key for signing user auth tokens |
| `JWT_EXPIRES_IN` | `7d` | Token lifespan |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API key |
| `CLIENT_URL` | `https://*.vercel.app` | Allowed CORS origins (can update to your exact Vercel URL) |
| `WEB_SEARCH_API_KEY` | *(Optional)* | Optional Tavily or Serper key (leave blank for DuckDuckGo) |

6. Click **Create Web Service**.
7. Once deployed, note your Render backend URL (e.g. `https://ayan-ai-backend.onrender.com`).
8. Test the deployment:
   ```bash
   curl https://ayan-ai-backend.onrender.com/api/health
   # Expected response: {"status":"ok","service":"Ayan AI","mongo":"connected",...}
   ```

> [!NOTE]
> On Render's Free tier, the service spins down after 15 minutes of inactivity. When a new request arrives, it may take 30–50 seconds to cold start. The frontend has a 25-second timeout and retry indicator to handle cold starts gracefully.

---

### Step 4: Deploy Frontend to Vercel
1. Sign in to [Vercel](https://vercel.com/).
2. Click **Add New... > Project** and import your `ayan-ai` GitHub repository.
3. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./` *(default)*
   - **Build Command**: `npm run build` *(default)*
   - **Output Directory**: `dist` *(default)*
4. Expand **Environment Variables** and add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://ayan-ai-backend.onrender.com` | **Your deployed Render backend URL** (⚠️ Do NOT include a trailing slash) |

5. Click **Deploy**.
6. When the deployment finishes, open your live application at `https://ayan-ai.vercel.app`!
7. *(Optional)* Return to your Render dashboard and set `CLIENT_URL` to your exact Vercel production URL (e.g., `https://ayan-ai.vercel.app`).

---

## 🔒 Security Best Practices Implemented

- **Zero Client-Side Secret Leakage**: `GEMINI_API_KEY`, `MONGODB_URI`, and `JWT_SECRET` never enter the frontend bundle or client network traffic. All AI streaming and database queries are brokered by the Express backend.
- **No TS/TSX Violations**: Built 100% in pure standard JavaScript and JSX.
- **Password Salting & Hashing**: All passwords securely hashed with `bcryptjs` with salt work factor 10.
- **Environment Scoped CORS**: Restricts cross-origin requests to authorized client domains.
- **Safe Production Logging**: Masks passwords and sensitive tokens in error output.
- **Client Route Protection**: `vercel.json` rewrite configuration handles client-side React Router navigation across `/login`, `/signup`, and `/` without 404 errors on refresh.

---

## 📡 Backend API Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Health & database connectivity check | No |
| `GET` | `/api/date` | Dynamic temporal context & current date | No |
| `POST` | `/api/auth/register` | Register new user account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch active user profile from JWT | Yes (`Bearer <token>`) |
| `GET` | `/api/conversations` | List user's conversations | Optional / Scoped |
| `POST` | `/api/conversations` | Create a new conversation | Optional / Scoped |
| `GET` | `/api/conversations/:id` | Get specific conversation details | Scoped |
| `PATCH`| `/api/conversations/:id` | Rename / update conversation metadata | Scoped |
| `DELETE`| `/api/conversations/:id`| Delete conversation & messages | Scoped |
| `GET` | `/api/conversations/:id/messages` | Get all messages in conversation | Scoped |
| `POST` | `/api/conversations/:id/messages` | Persist a message | Scoped |
| `POST` | `/api/search` | Execute live web search & citation parsing | No |
| `POST` | `/api/chat/stream` | Real-time SSE Gemini streaming response | No (Bearer optional) |

---

## 📄 License

MIT © [Ayan Chakraborty](https://github.com/ayanchakraborty516)
