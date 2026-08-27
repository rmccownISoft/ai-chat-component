# Phase 2a — Provider Registry

**Goal:** Send a `provider` + `model` with each message, and have the server pick Claude _or_ OpenAI to stream the reply. Same chat box, two brains behind it.

**From the log (ground truth):** provider adapters are `createAnthropic({ apiKey })` / `createOpenAI({ apiKey })` — never the bare exports (they ignore your key). Stream with `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`. Client never imports a provider SDK — it sends a `provider` string, the server maps it.

**What changes:** all three phase-1 files.
`src/lib/server/index.ts` (the factory) · `src/routes/api/ai-chat/stream/+server.ts` (the mount) · `src/lib/AIChat.svelte` (the client).

---

> ⚠️ **Layout changed under this phase (Phase 2c ran first).** The factory that these steps
> call `src/lib/server/index.ts` **no longer exists** — it was split into a host-neutral
> `src/lib/server/core.ts` plus `sveltekit.ts` / `express.ts` adapters. Map the steps below like this:
>
> | Step says… | Now do it in… | Why |
> | --- | --- | --- |
> | edit `index.ts` factory / build the provider **registry** (2a.3–2a.4 model pick) | **`core.ts`** (`createChatStream`) | provider selection + `streamText` are host-neutral |
> | read `provider` + `model` off the request (2a.4 destructure) | **each adapter** (`sveltekit.ts` reads `event.request.json()`; `express.ts` reads `req.body`) | request-reading is host-specific |
> | pass the keys to the factory (2a.5 `$env/static/private`) | the **SvelteKit** mount only | Express hosts pass `process.env` instead; core just takes the config arg |
>
> Net: `createChatStream` grows from `({ apiKey })` → `(messages)` into `({ anthropicApiKey, openaiApiKey })` → `(messages, provider, model)`, and both adapters forward `provider`/`model` through. See [phase-02c-host-portable-server.md](phase-02c-host-portable-server.md) and the decisions log's Active section.

---

### 2a.1 — Install the OpenAI adapter · ~5 min

1. [ ] **Add the package.** Match the major version of the anthropic adapter you already have (`@ai-sdk/anthropic` is `4.x`), so they agree with `ai@7`:

   ```
   pnpm add @ai-sdk/openai@4
   ```

- Look up: `@ai-sdk/openai npm`
- **Done when:** `node_modules/@ai-sdk/openai/package.json` shows a `4.x` version.

---

### 2a.2 — Add the second key · ~5 min

1. [ ] **Put an OpenAI key next to the Claude one** in your root `.env` (same place `ANTHROPIC_API_KEY` already lives — that's what [+server.ts:2](../src/routes/api/ai-chat/stream/+server.ts#L2) imports):

   ```
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=...        # ← you: add this line
   ```

   `$env/static/private` (SvelteKit's build-time env import) only sees keys that exist at server start — restart `pnpm dev` after editing `.env`.

- Look up: `sveltekit $env/static/private`
- **Done when:** `pnpm dev` restarts with no "missing export OPENAI_API_KEY" error once 2a.5 imports it.

---

### 2a.3 — Turn the factory config into two keys + a registry · ~20 min

Right now [index.ts:5-7](../src/lib/server/index.ts#L5-L7) takes one key and builds one adapter. Make it take both keys and build a small lookup — a plain object whose keys are provider names.

1. [ ] **Widen the config, build both adapters, put them in a registry** (an object you index by string):

   ```ts
   import { createOpenAI } from '@ai-sdk/openai' // ← you: add next to createAnthropic

   export const createStreamHandler = (config: { anthropicApiKey: string; openaiApiKey: string }): RequestHandler => {
   	const providers = {
   		claude: createAnthropic({ apiKey: config.anthropicApiKey }),
   		openai: createOpenAI({ apiKey: config.openaiApiKey }),
   	} // ← you: keys here ('claude' / 'openai') are the strings the client will send
   ```

   The `Provider` type in the design spec is `'claude' | 'openai'` — these object keys must match it exactly.

- Look up: `ai-sdk createOpenAI`
- **Done when:** the file type-checks with both adapters built (nothing uses `providers` yet — next step).

---

### 2a.4 — Read provider + model from the request, pick the adapter · ~20 min

The client will POST `{ messages, provider, model }`. Line [index.ts:9](../src/lib/server/index.ts#L9) currently pulls only `messages`. Pull all three, look up the adapter, call it with the model id.

1. [ ] **Destructure the two new fields:**

   ```ts
   const { messages, provider, model } = await event.request.json()
   ```

2. [ ] **Look up the adapter and guard a bad value.** If `provider` isn't a key in the registry, `providers[provider]` is `undefined` and `streamText` would crash with a confusing error — fail loud instead:

   ```ts
   const selected = providers[provider as 'claude' | 'openai']
   if (!selected) return new Response(`Unknown provider: ${provider}`, { status: 400 })
   ```

3. [ ] **Feed the chosen model into `streamText`** — replace the hardcoded `anthropic('claude-sonnet-5')` on [index.ts:12](../src/lib/server/index.ts#L12):

   ```ts
   const result = streamText({
   	model: selected(model), // ← you: was anthropic('claude-sonnet-5')
   	messages: await convertToModelMessages(messages),
   })
   ```

   Leave the `createUIMessageStreamResponse(...)` return exactly as it is — the streaming plumbing doesn't change, only which model produced the stream.

- Look up: `ai-sdk streamText model parameter`
- **Done when:** the handler type-checks and no `claude-sonnet-5` string remains in it.

---

### 2a.5 — Hand both keys to the factory at the mount · ~10 min

[+server.ts](../src/routes/api/ai-chat/stream/+server.ts) still calls the old one-key signature. Update it to the new shape from 2a.3.

1. [ ] **Import the second key and pass both:**

   ```ts
   import { ANTHROPIC_API_KEY, OPENAI_API_KEY } from '$env/static/private'

   export const POST = createStreamHandler({
   	anthropicApiKey: ANTHROPIC_API_KEY,
   	openaiApiKey: OPENAI_API_KEY, // ← you: field names must match the config type in 2a.3
   })
   ```

- Look up: `sveltekit named import $env/static/private`
- **Done when:** `pnpm dev` boots clean — a name mismatch here is a build error, so a clean boot proves the wiring.

---

### 2a.6 — Send provider + model from the client · ~20 min

The `Chat` object's `sendMessage` takes a second argument: request options. Its `body` field (verified in `ai@7.0.77`: `ChatRequestOptions.body?: object`) gets merged into the POST JSON — so `{ provider, model }` arrive server-side right next to `messages`. Line [AIChat.svelte:17](../src/lib/AIChat.svelte#L17) currently sends only text.

1. [ ] **Add a temporary hardcoded selection** near your `input` state on [AIChat.svelte:5](../src/lib/AIChat.svelte#L5) — 2b turns these into dropdowns, so a plain value is fine for now:

   ```ts
   let provider = $state<'claude' | 'openai'>('claude') // ← you: flip to 'openai' by hand to test the other side
   let model = $state('claude-sonnet-5')
   ```

2. [ ] **Attach them to the send** — second arg to `sendMessage`:

   ```ts
   chat.sendMessage({ text: input }, { body: { provider, model } })
   ```

   Gotcha: the model id must be one the chosen provider actually serves. `claude-sonnet-5` for Claude; for OpenAI use a current chat model id from their model list (e.g. set `model` to a `gpt-...` id when you flip `provider` to `'openai'`) — `UNVERIFIED`, confirm the exact string against the docs below.

- Look up: `ai-sdk sendMessage ChatRequestOptions body` · `openai model ids` (https://platform.openai.com/docs/models)
- **Done when:** with `provider='claude'` you get a Claude reply; hand-editing to `provider='openai'` (and a valid `gpt-*` model) streams an OpenAI reply into the same box.

---

**Phase 2a done when:** the same chat streams from either provider based on the `provider` string you send — no dropdown yet, you flip it in code. That flip becomes the UI in 2b.

**Close-out reminder:** confirm the OpenAI model id string that actually worked and note it in the log's Active section, so 2b's model dropdown lists real ids instead of guesses.
