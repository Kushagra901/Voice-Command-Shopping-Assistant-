# Voice Command Shopping Assistant

A voice-controlled shopping list web application with natural language understanding, Hinglish (Hindi-English code-switching) support, and smart product recommendations. Built as a technical assessment for a Software Engineer role.

> **⚠️ Demo Data Notice:** The product catalog (28 items) and purchase history (9 records) are **seeded demo data** — not real user activity. They exist to demonstrate the recommendation engine and product search features.

---

## ✨ Features

### Core Shopping List
- **Voice & text commands** — Add, remove, update quantity, mark purchased, search, get suggestions
- **Duplicate merging** — Adding an item already on the list increments its quantity instead of creating a duplicate
- **Category auto-detection** — Items are automatically classified into 8 categories (Dairy, Produce, Bakery, Beverages, Snacks, Household, Personal Care, Other)
- **Real-time sync** — Optimistic UI updates with server reconciliation via TanStack Query

### Voice & Language
- **Web Speech API integration** — Browser-native speech-to-text and text-to-speech (no paid APIs)
- **Hinglish support** — Code-switched Hindi shopping words are resolved to English equivalents (e.g., `doodh` → milk, `seb` → apple, `aloo` → potato, `pyaz` → onion)
- **Hindi numerals** — Spoken Hindi numbers (ek, do, teen, paanch) are parsed correctly
- **Full text fallback** — Identical NLU pipeline for browsers without speech recognition support

### Uniqueness Features (AGENTS.md §6)
1. **Live audio waveform** (§6.1) — Real-time `AnalyserNode` canvas visualization of microphone input amplitude during voice recording (not a pulsing circle)
2. **Editable command-preview chips** (§6.2) — Parsed command fields (intent, item, quantity, unit, brand, price) shown as interactive editable chips before execution
3. **Command history / audit log** (§6.3) — Running timeline of every parsed command with intent badge, confidence %, timestamp, and execution status
4. **Hinglish command support** (§6.4) — Working bilingual code-switch parser as the "multilingual support" answer
5. **"Undo that"** (§6.5) — Voice or text command (`"undo"`, `"undo that"`, `"take that back"`, `"revert"`) that reverts the previous mutation (add, delete, quantity update, or mark-purchased)
6. **Keyboard command palette (Ctrl+K / Cmd+K)** (§6.7) — Modal command palette with search filtering, categorised command templates, full keyboard navigation (`↑`/`↓`/`↵`/`ESC`), and direct natural-language voice-equivalent execution

### Smart Recommendations
- **Frequency-based** — Items purchased most often
- **Recency-based** — Items purchased recently that aren't on the current list
- **Seasonal** — Time-of-year-appropriate suggestions
- **Substitutes** — Healthier or alternative product suggestions with reason badges

### Product Catalog Search
- Full-text search across 28 seeded products
- Category pill filters and price ceiling chips (Under $3, $5, $10)
- Product cards with price, stock status, rating, and 1-click add

---

## 🏗 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + TypeScript + Tailwind CSS v4 + Lucide React + TanStack Query |
| **Backend** | Node.js + Express + TypeScript + Zod validation |
| **Database** | Drizzle ORM + Turso (libSQL/SQLite-compatible, HTTP-based) |
| **Voice** | Web Speech API (`SpeechRecognition` + `SpeechSynthesis`) — zero external APIs |
| **Testing** | Vitest + React Testing Library |
| **Deployment** | Vercel (client) + Render (server) + Turso (database) |

---

## 📐 Architecture

```
┌─────────────────────┐       ┌─────────────────────┐       ┌──────────────────┐
│   React Frontend    │──────▶│   Express Backend   │──────▶│  Turso (libSQL)  │
│   (Vite + TS)       │ REST  │   (Node + TS)       │ HTTP  │  SQLite-compat   │
│                     │◀──────│                     │◀──────│                  │
│ • Web Speech API    │       │ • Deterministic NLU │       │ • shopping_items │
│ • TanStack Query    │       │ • Zod validation    │       │ • products       │
│ • AudioContext      │       │ • Drizzle ORM       │       │ • purchase_hist  │
│ • Canvas waveform   │       │ • Recommendation    │       │                  │
└─────────────────────┘       └─────────────────────┘       └──────────────────┘
```

**Key architectural decisions:**
- **Shared types** (`shared/types/`) define the `ParsedCommand` contract, API envelopes, category classifier, and Hinglish aliases once — imported by both client and server
- **Deterministic NLU parser** with a clearly swappable seam for a future LLM-based parser
- **Turso libSQL** provides identical behavior in local dev (`file:local.db`) and production (remote HTTP)
- **No paid API keys** required — the app runs fully with browser-native APIs

---

## 📁 Folder Structure

```
voice-shopping-assistant/
├── client/                          # React + Vite + TypeScript frontend
├── server/                          # Express + TypeScript backend
├── shared/                          # Cross-cutting contracts (imported by both sides)
│   └── types/
├── package.json                     # Workspace root with dev/build/test scripts
└── README.md                        # This file
```

---

## 🚀 Local Setup

### Prerequisites
- **Node.js** ≥ 18.x
- **npm** ≥ 9.x

### 1. Clone & Install

```bash
git clone https://github.com/Kushagra901/voice-command-shopping-assistant.git
cd voice-command-shopping-assistant
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Server
PORT=3001
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173

# Database — leave blank for local SQLite fallback (file:local.db)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

> **Local development:** Leaving `TURSO_DATABASE_URL` empty automatically falls back to `file:local.db` (local SQLite). No Turso account needed for local dev.

### 3. Seed the Database

```bash
npm --prefix server run db:seed
```

This populates 28 demo products, 4 starter shopping list items, and 9 purchase history records. All data is **labeled as seeded demo data**.

### 4. Start Development Servers

```bash
# Both servers concurrently (client on :5173, server on :3001)
npm run dev

# Or individually:
npm run dev:server    # Express API on http://localhost:3001
npm run dev:client    # Vite dev server on http://localhost:5173
```

---

## 🔑 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: `3001`) |
| `NODE_ENV` | No | `development` or `production` |
| `CLIENT_ORIGIN` | Yes | Frontend URL for CORS (e.g., `http://localhost:5173` or your Vercel URL) |
| `TURSO_DATABASE_URL` | No | Turso database URL (e.g., `libsql://your-db.turso.io`). Empty = local SQLite |
| `TURSO_AUTH_TOKEN` | No | Turso auth token. Only needed when `TURSO_DATABASE_URL` is set |

---

## 📡 API Documentation

All endpoints return a consistent envelope:

```typescript
// Success
{ "success": true, "data": T }

// Error
{ "success": false, "error": { "message": string, "code": string } }
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Server health + DB connection status |
| `GET` | `/api/shopping-list` | Get all shopping list items |
| `POST` | `/api/shopping-list` | Add item (merges duplicates by quantity) |
| `PATCH` | `/api/shopping-list/:id` | Update item fields |
| `DELETE` | `/api/shopping-list/:id` | Remove item from list |
| `POST` | `/api/shopping-list/parse-command` | Parse natural language → execute command |
| `GET` | `/api/suggestions` | Get smart recommendations |
| `GET` | `/api/products/search` | Search product catalog with filters |
| `GET` | `/api/categories` | List all categories with keyword counts |

### Example: Parse & Execute Voice Command

```bash
curl -X POST http://localhost:3001/api/shopping-list/parse-command \
  -H "Content-Type: application/json" \
  -d '{"text": "Add 2 bottles of water", "execute": true}'
```

Response:
```json
{
  "success": true,
  "data": {
    "command": {
      "intent": "ADD_ITEM",
      "itemName": "water",
      "quantity": 2,
      "unit": "bottle",
      "confidence": 0.95,
      "rawText": "Add 2 bottles of water"
    },
    "executed": true,
    "message": "Added 2 bottle water to your list.",
    "item": { "id": "item-...", "name": "water", "quantity": 2, "unit": "bottle", "category": "Beverages", ... }
  }
}
```

---

## 🗣 Voice Command Examples

### English Commands
| Command | Intent |
|---------|--------|
| "Add milk" | `ADD_ITEM` |
| "I want to buy two bottles of water" | `ADD_ITEM` |
| "Remove apples from my list" | `REMOVE_ITEM` |
| "Change milk quantity to 3" | `UPDATE_ITEM` |
| "Mark bread as purchased" | `MARK_PURCHASED` |
| "Find toothpaste under 5 dollars" | `SEARCH_PRODUCT` |
| "What should I buy?" | `GET_SUGGESTIONS` |

### Hinglish Commands (Hindi-English Code-Switching)
| Command | Resolved To |
|---------|------------|
| "2 packet doodh add karo" | Add 2 packet milk |
| "seb list mein daalo" | Add apple to list |
| "paani khareedna hai" | Buy water |
| "do kilo aloo chahiye" | Add 2 kg potato |
| "pyaz hata do" | Remove onion |
| "tamatar khareed liya" | Mark tomato purchased |
| "teen cheeni la do" | Add 3 sugar |

### Supported Hindi Aliases
`doodh`→milk, `seb`→apple, `paani`→water, `aloo`→potato, `pyaz`→onion, `tamatar`→tomato, `cheeni`→sugar, `chawal`→rice, `chai`→tea, `dahi`→curd, `makkhan`→butter, `paneer`→paneer, `kela`→banana, `adrak`→ginger, `lahsun`→garlic, `palak`→spinach, `sabun`→soap, `atta`→flour, `dal`→lentils, `anda`→egg, `nimbu`→lemon, `mirchi`→chili, `gajar`→carrot, `namak`→salt, `tel`→oil, `roti`→bread, `ghee`→ghee

---

## 🌐 Browser Compatibility & Limitations

| Browser | Speech Recognition (STT) | Speech Synthesis (TTS) | Notes |
|---------|:---:|:---:|-------|
| **Chrome (Desktop/Android)** | ✅ | ✅ | Full support with interim results |
| **Edge (Desktop/Android)** | ✅ | ✅ | Full support |
| **Firefox** | ⚠️ | ✅ | STT requires `media.webspeech.recognition.enable` flag |
| **Safari / iOS** | ⚠️ | ✅ | Limited STT; strict user gesture activation |

**Text-input fallback** provides 100% feature parity for all browsers. When speech recognition is unavailable, the app surfaces a clear informational banner and the text command input processes identical natural language, including Hinglish commands.

---

## 🧪 Testing

### Run All Tests

```bash
# Full monorepo suite (server + client)
npm test

# Individual workspaces
npm run test:server    # 39 tests (parser, services, API integration)
npm run test:client    # 37 tests (ShoppingList, CommandChips, useVoiceRecognition, CommandPalette, useOnlineStatus, App)

# TypeScript type safety check
npm run typecheck
```

### Test Coverage

| Test File | Tests | What It Covers |
|-----------|------:|----------------|
| `nluParser.test.ts` | 12 | Add/remove/update/mark/search/undo intents, Hinglish commands, unknown input |
| `apiIntegration.test.ts` | 9 | All REST endpoints with Zod validation, CRUD lifecycle |
| `categoryClassifier.test.ts` | 8 | Category detection for all 8 categories + unknown items |
| `shoppingListService.test.ts` | 6 | Add, duplicate merge, update, delete, undo mutations, empty state |
| `recommendationEngine.test.ts` | 3 | Frequency, recency, and substitute suggestions |
| `health.test.ts` | 1 | Health endpoint envelope format |
| `CommandPalette.test.tsx` | 11 | Command palette rendering, search filtering, shortcut hooks, keyboard navigation, command execution |
| `ShoppingList.test.tsx` | 6 | Category grouping, empty states, item deletion, status toggling, quantity stepper, status filtering |
| `App.test.tsx` | 6 | React component rendering, tab navigation, manual command input, skeleton loader, offline banner |
| `useOnlineStatus.test.ts` | 6 | Online/offline detection, local mutation queueing, automatic reconnect sync |
| `useVoiceRecognition.test.ts` | 5 | SpeechRecognition unsupported fallback, listening transitions, mic permission errors, interim/final transcripts, TTS speech |
| `CommandChips.test.tsx` | 3 | Parsed command badge preview, interactive inline editing, execute/dismiss callbacks |

---

## 🚢 Deployment

### Architecture (Free Tier)
- **Frontend** → Vercel (free)
- **Backend** → Render (free web service)
- **Database** → Turso (free tier: 9 GB storage, 500M reads/month)

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for step-by-step instructions with exact env vars for each platform.

---

## ⚠️ Known Limitations

1. **No authentication** — Single-user, no login required (out of scope for assessment)
2. **Web Speech API browser dependency** — STT requires Chrome/Edge for full experience; text fallback covers the gap
3. **Deterministic parser** — Handles structured shopping commands well but will misparse complex conversational input (the swappable parser seam supports future LLM upgrade)
4. **Seeded demo data** — Product catalog and purchase history are static seed data, not real user activity
5. **Single language pair** — English + Hinglish only; additional languages require extending the alias map

---

## 🔮 Future Improvements

- [ ] LLM-backed NLU parser (swappable seam already exists)
- [x] "Undo that" voice command (revert last mutation) — Implemented (§6.5)
- [x] Keyboard command palette (Cmd/Ctrl+K) for full keyboard-only operation — Implemented (§6.7)
- [x] Offline-aware PWA with command queue + sync on reconnect — Implemented (§6.6)
- [ ] Multi-user support with authentication
- [ ] Additional language alias maps (Tamil, Telugu, Bengali)
- [ ] Price tracking and deal alerts
- [ ] Recipe integration ("Add ingredients for pasta")

---

## 📝 Design Decisions

**Uniqueness features selected** (from AGENTS.md §6):
1. **Live waveform, not a pulsing circle** (#1) — Web Audio `AnalyserNode` drawn at 60fps on `<canvas>`
2. **Editable command-preview chips** (#2) — Visual badge decomposition before mutation dispatch
3. **Command history / audit log panel** (#3) — Full audit timeline with confidence scores and replay
4. **Hinglish command support** (#4) — Phonetic transliteration layer with 27 canonical Hindi grocery maps
5. **"Undo that" voice mutation revert** (#5) — Reversible mutation history stack with voice trigger
6. **Offline-aware PWA** (#6) — Web App Manifest, Service Worker caching, and offline mutation queue with auto-sync
7. **Keyboard command palette (Cmd/Ctrl+K)** (#7) — Full accessibility and voice parity via keyboard

**Turso over bare SQLite file:** The original brief flagged ephemeral-disk deployment as an open risk. Turso's free tier provides an always-on HTTP-based SQLite database that works identically in local dev and production, closing this gap with zero cost.

**Deterministic parser over LLM:** For an 8-hour scope, a rule-based parser with Hinglish normalization is more reliable and demoable than prompt engineering an LLM — and it ships without needing API keys. The parser module has a clear interface boundary so an LLM implementation can be swapped in later.

**No authentication:** The assignment scopes this as a single-user shopping list demo. Authentication was deliberately omitted to focus build time on the NLU parser, voice UX, and recommendation engine. A production version would add JWT-based auth with per-user list isolation via row-level security on the Turso database.

---

## 📄 License

MIT
