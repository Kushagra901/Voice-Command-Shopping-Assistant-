# AGENTS.md — Voice Command Shopping Assistant

> Antigravity reads this file automatically at the start of every session in this workspace.
> Every agent (Manager View, CLI, or single-agent chat) must treat this as binding project law,
> not a suggestion. If any instruction in a chat prompt conflicts with this file, this file wins
> unless the human explicitly overrides it in that message.

## 1. What this project actually is

A voice-controlled shopping-list web app built as a technical assessment for a Software Engineer
role. It will be read by a human reviewer who has seen this exact assignment brief dozens of
times. Generic CRUD-with-a-mic-icon is a fail state even if every checkbox is technically ticked.
The bar is: "this person thought about the problem, not just the checklist."

## 2. Non-negotiable engineering rules

- TypeScript strict mode everywhere. No `any` without a `// justified:` comment explaining why.
- One consistent API envelope for every endpoint:
  ```ts
  type ApiSuccess<T> = { success: true; data: T };
  type ApiError = { success: false; error: { message: string; code: string } };
  ```
- No secrets in code or in git history. All config via `.env`, with `.env.example` checked in
  and `.env` gitignored from the first commit.
- No `console.log` left in shipped code — use a tiny logger util, and only log actual errors.
- Small, named, single-purpose functions. No 200-line handlers.
- Every list-returning endpoint handles the empty-state case explicitly (never assume `[0]` exists).
- Every mutation is validated with Zod (or equivalent) before it touches the data layer.
- Comments explain *why*, never *what* — if a comment restates the code, delete the comment.

## 3. Tech stack (locked — do not silently substitute)

**Frontend:** React + Vite + TypeScript + Tailwind CSS + lucide-react icons + Web Speech API
(`SpeechRecognition` / `SpeechSynthesis`), TanStack Query for server-state/loading/error handling,
Vitest + React Testing Library for tests.

**Backend:** Node.js + Express + TypeScript + Zod, Vitest for unit tests.

**Database:** Drizzle ORM + Turso (libSQL, SQLite-compatible, HTTP-based). This is a deliberate
change from a bare local-SQLite-file approach: Turso gives a genuine always-on free tier with no
ephemeral-disk problem, so the exact same database works identically in local dev and on a
serverless/free-tier host — the original brief flagged this as an open deployment risk; this
closes it. If the candidate is more comfortable with Prisma, Prisma's libSQL driver adapter also
works against the same Turso database — that substitution is allowed, Drizzle is the default.

**Deployment:** Frontend → Vercel. Backend → Render (or Railway) free web service. Database →
Turso free tier. All three have zero-cost tiers as of today; do not introduce a paid dependency
without flagging it to the human first.

**"Track B" (not adopted, do not build unless the human explicitly asks):** there is a second,
heavier master prompt in this workspace's history describing SvelteKit + Cloudflare Workers +
Supabase + Deepgram (STT) + ElevenLabs (TTS) + LLM function-calling for NLU. That is a real,
coherent architecture, but it is a *different project* from this one — it needs external API
keys and accounts this project deliberately avoids. If you ever see that stack referenced, do not
silently blend it with this one (e.g. do not add an LLM call "on top of" the deterministic
parser). Ask the human which track they mean before touching anything.

## 4. Folder structure (simplify only if you state why)

```
voice-shopping-assistant/
  client/  (React/Vite/TS)
    src/{components,pages,hooks,services,types,utils}
  server/  (Express/TS)
    src/{controllers,routes,services,utils,middleware,data}
    drizzle/ (schema, migrations, seed.ts)
  shared/
    types/   <- ParsedCommand and API contract types, imported by BOTH client and server
  README.md
  .env.example
  .gitignore
```

The `shared/types` folder is intentional: define the contract once, import it on both sides,
never hand-duplicate the same type in two places.

## 5. Domain contracts (fixed shape — implement exactly this)

```ts
type ParsedCommand = {
  intent: "ADD_ITEM" | "REMOVE_ITEM" | "UPDATE_ITEM" | "MARK_PURCHASED"
        | "SEARCH_PRODUCT" | "GET_SUGGESTIONS" | "UNKNOWN";
  itemName?: string;
  quantity?: number;
  unit?: string;
  brand?: string;
  maxPrice?: number;
  rawText: string;
  confidence: number;
};
```

Category map (unknown → `"Other"`):
- Dairy: milk, cheese, butter, yogurt, curd
- Produce: apple(s), banana(s), orange(s), tomato, potato, onion
- Bakery: bread, bun, cake
- Beverages: water, juice, coffee, tea, soda
- Snacks: chips, biscuits, cookies, chocolate, popcorn
- Household: detergent, soap, tissue, cleaner
- Personal Care: toothpaste, shampoo, toothbrush

**Hinglish synonym layer (this is the real "Hindi support" answer, see §6):** the normalizer must
resolve common code-switched Hindi shopping words to the same canonical item before category
lookup — e.g. `doodh`/`dudh` → milk, `seb` → apple, `paani`/`pani` → water, `aloo` → potato,
`pyaz` → onion, `tamatar` → tomato, `cheeni` → sugar, `chawal` → rice. Keep this list in one
`hindiAliases.ts` file so it's trivially extensible.

## 6. Uniqueness requirements — pick at least 3, note which ones you picked in the README

Do not attempt all of these in 8 hours. Pick based on time left after core features work, and
explicitly list your choice in the README's "Design decisions" section.

1. **Live waveform, not a pulsing circle** — draw the actual mic input amplitude via
   `AnalyserNode` on a canvas while listening. Trivial to build, visually reads as "this person
   understands audio, not just an icon library."
2. **Editable command-preview chips** — before committing a parsed voice command, show it as
   separate editable chips (item / qty / unit), not a wall of JSON or plain text. Demonstrates the
   parser's structure instead of hiding it.
3. **Command history / audit log panel** — a running list of every parsed command with intent +
   confidence + timestamp. Doubles as a debugging tool during the demo.
4. **Hinglish command support** (§5) — a real, working code-switch parser is a stronger answer to
   "multilingual support" than a translated UI string table, and it's genuinely differentiated.
5. **"Undo that"** — a voice/text command that reverts the last mutation. Small to build, reads
   as thoughtful UX.
6. **Offline-aware PWA** — installable, queues commands issued while offline and syncs on
   reconnect. Only attempt if core features are done with time to spare.
7. **Keyboard command palette (Cmd/Ctrl+K)** — full feature parity with voice, for
   accessibility and for reviewers testing without a working mic.

## 7. Definition of done per phase

For every phase, before asking the human to move on:
- Produce an Antigravity **Implementation Plan artifact** before writing code.
- After building, use the built-in browser to load the running app and capture a **screenshot
  artifact** of the actual UI state you just built (not a description of it).
- Run the test suite and report pass/fail counts, not just "tests added."
- On any phase touching the backend, DB, or env vars: **invoke the `security-review` skill**
  (`.agent/skills/security-review/`) and report its PASS/FAIL table. Fix FAILs in the same pass.
- On any phase touching a component or page: **invoke the `voice-ui-style` skill**
  (`.agent/skills/voice-ui-style/`) before calling the UI done.
- Produce a short **Walkthrough artifact**: what changed, how to verify it manually, what's
  deliberately deferred to a later phase.
- Stop and wait for explicit human confirmation before starting the next phase.

## 7a. UI/UX standards (enforced by the `voice-ui-style` skill — summary only, skill is authoritative)

- Interim vs. final Web Speech API transcript get visually distinct treatment (muted vs. full
  contrast) — never shown overlapping.
- Listening indicator and TTS-speaking indicator are visually distinct from each other, not the
  same animation reused.
- Optimistic UI: a voice/text action gets a visible confirmation within ~300ms, even if the
  server write is still in flight.
- All tap targets ≥44×44px. All state changes (list updates, errors) are mirrored in an
  `aria-live` region for screen readers, not just shown visually.

## 8. Testing requirements (minimum bar)

Unit tests, at minimum, for: "Add milk", "I want to buy two bottles of water", "Remove apples
from my list", "Change milk quantity to 3", "Find toothpaste under 5 dollars", one Hinglish
command, one unknown/garbage command, category auto-detection, suggestion generation, and
duplicate-item quantity merging.

## 9. Things you must NOT do

- Do not add authentication unless explicitly asked — out of scope for this assessment.
- Do not call any paid API or require an API key for the app to run and be demoed.
- Do not fabricate purchase history or reviews and present them as real — label all seeded data
  as seeded, in the UI and the README.
- Do not silently change the tech stack in §3 — propose the change and wait for approval.
- Do not skip the empty-state, loading-state, or error-state UI for any list or async action.

## 10. Tools available to you

- Built-in Chrome browser: use it to actually load and click through the app before claiming a
  feature works.
- Terminal: install deps, run dev servers, run test suites.
- Project skills, all under `.agent/skills/` (verify the exact path this Antigravity install
  actually reads and report it back if it differs):
  - `shopping-assistant-conventions/` — the condensed ParsedCommand contract + category map from
    §5–§6. Load before touching the parser or category logic.
  - `security-review/` — invoke per §7 on any backend/env-touching phase.
  - `voice-ui-style/` — invoke per §7 on any UI-touching phase.
- Built-in image generation (Nano Banana 2 / Gemini image model): use this to generate a small,
  consistent icon set (mic idle/listening/speaking states, one icon per category, app logo)
  instead of sourcing mixed stock icons — keeps the "one visual style" rule in `voice-ui-style`
  actually enforceable. Generate the whole set in one prompt/session so the style stays
  consistent; don't patch in one icon later from a different source.
- GitHub MCP server, if connected: fine to use for committing and managing the repo directly.
  Do not connect or use any MCP server for a paid third-party service (Cloudflare, Supabase, a
  speech/LLM provider) without the human explicitly asking — see the Track B note in §3.
- Community skill marketplaces (e.g. skills.sh, third-party GitHub skill repos): may be searched
  for extra skills (frontend polish, testing, security) if the human asks, but these are not
  Google first-party — surface what a skill's source actually does before installing it, the same
  way you would flag a browser extension with broad permissions.
