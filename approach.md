# Approach

This is a voice-controlled shopping list app built with React, Express, TypeScript, and Turso (libSQL). The architecture separates concerns into three workspaces — `shared/` (contracts), `server/` (API), `client/` (UI) — with a single `ParsedCommand` type governing the entire voice-to-action pipeline.

**Voice recognition** uses the browser-native Web Speech API for STT and TTS, avoiding paid API dependencies. A real-time `AnalyserNode` canvas waveform provides audio feedback during recording. Full text-input fallback guarantees feature parity on unsupported browsers.

**The NLU parser** is deterministic: normalize input → strip filler words → resolve Hinglish aliases → extract intent + entities via pattern matching. It's intentionally modular — a single function signature that can be swapped for an LLM-backed parser without changing any downstream code.

**Recommendations** combine purchase frequency, recency, seasonal relevance, and substitute suggestions from seeded purchase history.

**Data model**: three SQLite tables (shopping_items, products, purchase_history) via Drizzle ORM, with Turso providing identical local-dev and production behavior over HTTP. Duplicate items merge by quantity.

**Error handling**: Zod validates every mutation; the UI shows distinct states for mic-denied, no-speech, network errors, and unsupported browsers — never a generic toast.

**Deployment**: Vercel (client) + Render (server) + Turso (DB), all free-tier. CORS is locked to the deployed frontend origin.

**Trade-offs for 8 hours**: No auth, no offline PWA, deterministic parser over LLM, seeded catalog data. Each deferred feature has a clear upgrade path.
