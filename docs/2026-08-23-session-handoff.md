# Session handoff — 2026-08-23

Two things to pick up next session. Neither needs solving tonight.

## 1. The plan/ticket document degrades as it goes

**Observation:** The tickets doc is understandable at step 1 of a ticket but gets worse/less usable further down. Claude's own plan-making output is unusable ~95% of the time.

**Idea to explore:** Build a **skill** that produces plans in a consistent, reliable structure — instead of relying on ad-hoc plan generation. A plan-building template with three layers:

1. **"Claude instructions for future sessions"** — how Claude should behave when working this plan.
2. **A general plan structure** — the fixed skeleton every phase/ticket follows.
3. **Per-session/per-plan fleshing** — use the session prompt to expand one plan step at a time, rather than writing all steps up front.

**Relevant finding:** There's already an agreed ticket structure from a prior session (the "blend"): Goal → Shape of work → Inputs/outputs → Parts table (Part | Exact form | From | Verify) → Skeleton with blanks → Steps → Done when. It works for the *first* part of a ticket but doesn't hold up deeper in. That's the gap the skill should close.

## 2. Need more factory-pattern practice

**Observation:** The factory pattern (a function that returns a function) was the hardest part of ticket 1.2 and still isn't solid.

**What landed this session:**
- A factory returns a function. `createStreamHandler` = outer (runs once, at startup, bakes in the key); inner `async event => {}` = runs per request.
- SvelteKit calls the inner function automatically via file routing — `export const POST = createStreamHandler({ apiKey })` in the route file.
- "Call" just means running a function with `()`; unrelated to the factory concept.

**Want next:** More worked examples and hands-on practice with the pattern, beyond this one use case — so it generalizes.

---

*Note: working-style preferences (keep responses short, TypeScript explanation approach) are saved in Claude's persistent memory and load automatically — no need to restate them.*
