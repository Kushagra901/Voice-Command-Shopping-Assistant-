# Approach

A voice-controlled shopping list built with React, Express, TypeScript, and Turso (libSQL). Three workspaces (`shared/`, `server/`, `client/`) share a single `ParsedCommand` contract governing the entire voice-to-action pipeline.

**Voice recognition**: Native Web Speech API powers STT and TTS without external API dependencies. A real-time `AnalyserNode` canvas waveform provides live feedback, with full keyboard/text fallback parity.

**NLU parser**: Deterministic pipeline: normalizes text → strips fillers → resolves Hinglish aliases → extracts intent and entities via pattern matching. Modular design allows drop-in LLM substitution.

**Recommendations**: Combines purchase frequency, recency, seasonal picks, and category substitutes derived from seeded history.

**Data model**: Three SQLite tables (`shopping_items`, `products`, `purchase_history`) via Drizzle ORM. Duplicate items automatically merge by quantity. Turso enables identical local and production behavior over HTTP.

**Error handling**: Zod validates every mutation. The UI surfaces distinct states for mic permissions, silence, network drops, and unsupported browsers.

**Deployment**: Vercel (frontend) + Render (backend) + Turso (database), all on zero-cost tiers with strict CORS whitelisting.

**Trade-offs**: Prioritized deterministic speed, Hinglish aliases, and zero-cost hosting over auth, live payment catalogs, or paid LLM/STT APIs.
