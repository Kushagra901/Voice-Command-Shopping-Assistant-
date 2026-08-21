---
name: security-review
description: Run a security review pass against the Voice Command Shopping Assistant's specific threat model before marking any backend-touching phase complete.
---

Run this checklist against whatever was just built or changed. Report each item as PASS/FAIL with the file/line evidence — do not just assert compliance.

## Secrets
- [ ] Grep the client bundle (frontend build output, not just source) for Deepgram, LLM, and ElevenLabs key patterns. None should appear.
- [ ] Confirm all third-party API keys are read only inside the Cloudflare Worker via `wrangler secret`, never via a `PUBLIC_`/`VITE_`-prefixed env var.
- [ ] Confirm `.env` (real values) is gitignored and only `.env.example` (names, no values) is committed.

## LLM output handling
- [ ] Every LLM response that maps to a DB mutation is validated against the Zod intent schema before execution.
- [ ] Confirm there is no code path where raw LLM text is passed to `eval`, a SQL template string, or a shell command.
- [ ] Confirm the LLM system prompt explicitly instructs structured-output-only, and that malformed/off-schema responses are rejected and logged, not silently coerced.

## Data access
- [ ] Every new or modified table has Row-Level Security enabled and a policy scoping rows to `auth.uid()`.
- [ ] Confirm no API route trusts a `user_id` passed from the client — it must be derived from the verified JWT server-side.
- [ ] Confirm rate limiting exists on any endpoint that calls a metered third-party API (Deepgram/LLM/TTS).

## Voice data privacy
- [ ] Confirm raw audio blobs are deleted (or never persisted) once a transcript is returned — check for any code path that writes audio to storage or logs.
- [ ] Confirm transcripts stored in the DB are scoped by RLS the same as other user data.

## Transport & network
- [ ] Confirm CORS on the Worker is locked to the deployed frontend origin, not `*`.
- [ ] Confirm no mixed-content requests (any `http://` calls from an `https://` page).

## Dependencies
- [ ] Confirm CI runs `npm audit` (or equivalent) and fails the build on high/critical findings.
- [ ] Confirm Dependabot (or equivalent) is enabled on the repo.

## Output
Summarize as a short table: item, PASS/FAIL, evidence. Anything FAIL blocks marking the phase complete — fix it in the same pass, don't defer to "a later phase."
