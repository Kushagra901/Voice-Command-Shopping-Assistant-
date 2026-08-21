---
name: voice-ui-style
description: Enforce the minimalist, mobile-first, voice-first UI/UX rules for the Voice Command Shopping Assistant — apply this before finalizing any component markup.
---

When building or reviewing any UI in this project, enforce all of the following. If a component violates one of these, fix it before considering the task done.

## Layout
- One dominant primary action per screen: the mic button. Everything else is secondary in size and visual weight.
- Single-screen layout by default — no multi-step wizards for core actions (add/remove/search are one voice command away, the UI should never force extra taps to reach them).
- List items grouped by category with a visible category header, not a flat list.

## Voice-specific states
- Listening state: a clearly animated indicator (pulse/waveform), not just a color change — must be perceivable without reading text.
- Interim transcript: rendered in a muted/lower-contrast style; finalized transcript: full contrast. Never show both overlapping.
- Every voice action gets a toast or inline confirmation within 300ms of the action completing, even if the underlying request is still finishing server-side (optimistic UI where safe).
- TTS-speaking state: a distinct visual indicator separate from the listening indicator — a user must be able to tell "the app is talking" vs "the app is listening" at a glance.

## Loading & error states (no exceptions)
- Every async action (STT, LLM parse, DB write, TTS) has its own loading indicator — do not share one global spinner across unrelated actions.
- Every failure mode has a plain-language message and a retry affordance: mic permission denied, network drop, low-confidence parse, LLM timeout. Never fail silently.
- Low-confidence intent parses trigger a clarifying question via TTS/toast, not a silent no-op.

## Accessibility
- Live transcript region uses `aria-live="polite"` (or equivalent) so screen readers announce it.
- List changes (item added/removed) are announced via an `aria-live` region, not just visually.
- All tap targets ≥44×44px — this is a mobile/voice-first app, assume one-handed use.
- Color is never the only signal for state (add an icon or text label alongside any color-coded status).

## Visual restraint
- Max palette: one primary color, one accent, plus neutrals — do not let category icons or suggestion cards introduce new colors.
- Prefer generated icons (consistent style) over mixed stock icon sets — regenerate the whole set together if any icon needs to change, don't patch one icon in a different style.
- Suggestion cards (seasonal/substitute/low-stock) are visually subordinate to the list itself — dismissible, non-blocking, never modal.

## Before marking any UI task complete
1. Check every async action has both a loading and an error state.
2. Check the listening/speaking/idle states are visually distinguishable from a screenshot alone, with no caption.
3. Check a screen reader user could follow the flow (transcript + list changes are both `aria-live`).
4. Take a screenshot at mobile viewport width and confirm nothing is cramped or overflowing.
