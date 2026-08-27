# Phase 2c — Host-portable server

**Goal:** Make the component usable from **both** stacks the company runs — Svelte + Express +
`abstract-state-router` (the majority) and SvelteKit (the few) — instead of only SvelteKit. Same
client component everywhere; each host imports a one-line server adapter.

**Why this phase exists (out of sequence):** a spike into dropping the component into `pro-web`
showed the design spec's "reusable across SvelteKit apps" assumption was wrong — almost all target
apps are Express + ASR. Rather than keep building on a SvelteKit-only server, we fixed the seam
first. Done before finishing 2a; the 2a/2b provider work now targets `core.ts` (see note in that doc).

**From the log (ground truth):** streaming stays `toUIMessageStream({ stream: result.stream })`;
only the *emit* differs per host — `createUIMessageStreamResponse` (SvelteKit) vs
`pipeUIMessageStreamToResponse` (Express, verified in `ai@7.0.77`). The core takes `apiKey` as a
config arg — it never reads env itself.

**The shape:** one host-neutral core, two thin adapters.

```
        createChatStream({ apiKey })        core.ts   (no host imports)
        messages ─► UI-message stream
             ▲                    ▲
      sveltekit.ts            express.ts
   event.request.json()       req.body
   → Web Response             → pipe into Node res
```

---

- [x] **2c.1 — Extract the neutral core** — new `src/lib/server/core.ts`. `createChatStream({ apiKey })`
  builds the Anthropic adapter and returns `messages → toUIMessageStream(...)`. No `@sveltejs/kit` import.

- [x] **2c.2 — SvelteKit adapter** — new `src/lib/server/sveltekit.ts`. Keeps the `createStreamHandler`
  name/behavior from the old `index.ts`, now on top of the core: reads `event.request.json()`, returns
  `createUIMessageStreamResponse({ stream })`.

- [x] **2c.3 — Express adapter** — new `src/lib/server/express.ts`. `createExpressHandler({ apiKey })`
  reads `req.body.messages` (host's `express.json()` already parsed it) and calls
  `pipeUIMessageStreamToResponse({ response: res, stream })`. `res` typed as Node `ServerResponse`, `req`
  typed loosely — so the package never depends on `express`.

- [x] **2c.4 — Client endpoint is a prop** — [AIChat.svelte](../src/lib/AIChat.svelte): `let { api = '/api/ai-chat/stream' } = $props()`,
  read once via `untrack` (it's mount-time config, not reactive). Default keeps Phase 1 behavior.

- [x] **2c.5 — Package exports split** — [package.json](../package.json): `./server` (core),
  `./server/sveltekit`, `./server/express`, so an Express-only host never pulls SvelteKit types in.

- [x] **2c.6 — Retarget the demo route + delete the old file** — [+server.ts](../src/routes/api/ai-chat/stream/+server.ts)
  imports from `./server/sveltekit.js`; old `src/lib/server/index.ts` deleted (its logic moved to core + sveltekit).

---

**Verification (all passed):**

| Check | Result |
|---|---|
| `npm run check` | 0 errors, 0 warnings |
| `npm run build` (`svelte-package` + `publint`) | Built; publint "All good!"; `dist/server/` has core + sveltekit + express |
| SvelteKit path | `POST /api/ai-chat/stream` on the dev server → 200, `text/event-stream`, streamed a real reply |
| Express path | Node `http` stand-in mounting `createExpressHandler` → 200, `text/event-stream`, streamed a real reply |

**Phase 2c done when:** the same client streams from either a SvelteKit route or an Express route,
differing only by which one-line adapter the host imports. ✅

**Not in this phase (the payoff, tracked separately):** actually wiring the component into `pro-web`
— the Express route, the bottom-right overlay, mounting in `App.svelte`. That's the follow-on
integration task, not part of making the component *capable*.
