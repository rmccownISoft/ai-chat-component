# AI Chat Component — Implementation Tickets

**Companion to:** `2026-05-30-ai-chat-component-design.md`

---

## How to Use This Document

- **Each ticket targets ~30 minutes** of focused work. Some will be shorter, a few longer — adjust as you go.
- **"Done when" is your success criterion.** Hit it and you can stop, even if the ticket feels unfinished. Future you (or future tickets) will polish.
- **Tickets are ordered.** Dependencies are mostly linear within a phase. Doing them out of order is fine but harder.
- **You write the code.** The "Steps" are pointers, not tutorials. When stuck, ask Claude — but try first. The stuck moments are where you learn.
- **Tweak freely.** When you discover a better way, change the upcoming tickets. The list serves you, not the other way around.
- **Phase detail is just-in-time.** Phases 3–10 are one-liners on purpose. When you finish Phase 2, we flesh out Phase 3 with what you've actually learned.

---

## Repo Layout (Actual — Read This First)

**This repo is a single SvelteKit _library project_ (the `@sveltejs/package` template), not a pnpm monorepo.** The tickets below were originally written for a monorepo (`packages/` + `apps/`), but the repo was built the simpler way. Same end goal — a component other apps import — with less plumbing.

- `src/lib/` is the **published surface**: `svelte-package` compiles it to `dist/`, and that's what other projects import.
- `src/routes/` is a **built-in demo/playground app**. It consumes the library through the `$lib` alias and stands in for a real consumer app while you develop. It is never published.

Wherever a ticket names a monorepo path, translate it with this table:

| Ticket/spec says (monorepo)                   | This repo (single library project)                                                           |
| --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `packages/ai-chat/` (the library)             | repo **root**                                                                                |
| `packages/ai-chat/src/lib/...`                | `src/lib/...` (published to `dist/`)                                                         |
| `packages/ai-chat/src/lib/server/...`         | `src/lib/server/...`                                                                         |
| `apps/demo/` (consumer app)                   | `src/routes/` (the built-in dev app)                                                         |
| `apps/demo/.env` and `.env.example`           | `.env` and `.env.example` at repo **root**                                                   |
| `apps/demo/src/routes/...`                    | `src/routes/...`                                                                             |
| demo import `from '@your-org/ai-chat/server'` | dev-app import `from '$lib/server'` (external consumers use the published `./server` export) |
| `pnpm --filter @your-org/ai-chat dev`         | `pnpm dev`                                                                                   |
| `"@your-org/ai-chat": "workspace:*"` dep      | not needed — it's one project                                                                |

---

## Phase Map

| Phase | Name                   | Goal                                                                                     |
| ----- | ---------------------- | ---------------------------------------------------------------------------------------- |
| 0     | Foundation             | Empty but working library project with a built-in demo playground + Bootstrap + env keys |
| 1     | First Conversation     | End-to-end streaming chat with Claude, hardcoded model                                   |
| 2     | Multi-Provider         | OpenAI added, provider/model dropdowns, switch confirmation                              |
| 3     | Typed Content Blocks   | Migrate from string messages to typed blocks with stable IDs                             |
| 4     | Context Injection      | Baseline + route + manual context, system prompt assembly, memory badge                  |
| 5     | Session Persistence    | Save/load/list sessions via parent app callbacks, history UI                             |
| 6     | Multimodal Input       | Image, PDF, text/code file attachments                                                   |
| 7     | Rich Block Rendering   | Image, sandboxed HTML, Vega-Lite chart, tool call blocks                                 |
| 8     | MCP Support            | Connect one configured MCP server, pass tools to streamText                              |
| 9     | Styling Polish         | Style props, theming verification, streaming cursor, autoscroll                          |
| 10    | Testing Infrastructure | Vitest + Playwright setup, first unit and component tests, smoke tests                   |

---

## Phase 0: Foundation

> **Layout note:** Tickets 0.1–0.5 were completed as a single library project, not the monorepo their steps describe. The steps are kept as the original plan; see **Repo Layout** above for how the paths map. Only the paths differ — the outcomes are the same.

### Ticket 0.1 — Initialize monorepo skeleton _==DONE==_

**Goal:** Empty monorepo with workspace config and git.

**Steps:**

- Create the project directory and `cd` into it
- `pnpm init` at the root
- In root `package.json`, set `"private": true` (workspaces require this) and add a `"name"` like `ai-chat-monorepo`
- Create `pnpm-workspace.yaml`:
  ```yaml
  packages:
    - 'packages/*'
    - 'apps/*'
  ```
- Create `.gitignore` with: `node_modules`, `.env`, `.env.local`, `.svelte-kit`, `build`, `dist`, `.DS_Store`
- `git init` and make the first commit

**Done when:** `pnpm-workspace.yaml` exists and `git log` shows one commit.

---

### Ticket 0.2 — Initialize the library package _==DONE==_

**Goal:** `packages/ai-chat` is a working SvelteKit library project.

**Steps:**

- `mkdir packages && cd packages`
- `pnpm create svelte@latest ai-chat` — choose **Library project**, **TypeScript** yes, **ESLint + Prettier** yes
- `cd ai-chat && pnpm install`
- Open `packages/ai-chat/package.json` and change `"name"` to your scoped package name (e.g., `@your-org/ai-chat`)
- Commit

**Done when:** `pnpm --filter @your-org/ai-chat dev` boots the library playground without errors.

**Notes:** Library projects expose a Vite playground at `/` for local development; that's where you'll iterate on the component before the demo app is wired up.

---

### Ticket 0.3 — Initialize the demo app _==DONE==_

**Goal:** `apps/demo` is a working SvelteKit app.

**Steps:**

- From repo root: `mkdir apps && cd apps`
- `pnpm create svelte@latest demo` — choose **Skeleton project**, **TypeScript** yes, **ESLint + Prettier** yes
- `cd demo && pnpm install`
- Commit

**Done when:** `pnpm --filter demo dev` opens the skeleton app on localhost.

---

### Ticket 0.4 — Wire the workspace dependency (first dopamine win) _==DONE==_

**Goal:** The demo app imports a component from the library.

**Steps:**

- In `apps/demo/package.json` dependencies, add: `"@your-org/ai-chat": "workspace:*"`
- Run `pnpm install` from repo root
- In `packages/ai-chat/src/lib/index.ts`, export a placeholder Svelte component (create `HelloChat.svelte` that renders `<div>Hello from the chat library</div>`, then `export { default as HelloChat } from './HelloChat.svelte'`)
- In `apps/demo/src/routes/+page.svelte`, import and render `<HelloChat />`
- Commit

**Done when:** The demo app shows "Hello from the chat library" in the browser.

**Notes:** This is your first real win — the whole monorepo plumbing works. Celebrate it. The rest of the project is just adding capability to this skeleton.

---

### Ticket 0.5 — Add Bootstrap 5 to the demo app _==DONE==_

**Goal:** BS5 is loaded so future styling has a real environment.

**Steps:**

- In `apps/demo/src/app.html`, add the Bootstrap 5 CSS CDN link in `<head>` (use the version your team uses)
- Set `<html data-bs-theme="light" data-bs-version="5">` on the root tag
- In `+page.svelte`, wrap your `<HelloChat />` in a Bootstrap container: `<div class="container mt-4"><h1>AI Chat Demo</h1><HelloChat /></div>`
- Confirm in the browser that Bootstrap typography (the heading) and spacing (the margin) look applied

**Done when:** The "AI Chat Demo" heading and container look like Bootstrap, not browser default.

---

### Ticket 0.6 — Set up env keys _==DONE==_

**Goal:** API keys load from a root `.env`, and a temporary endpoint proves it.

**New concepts in this ticket** — look each up as you reach it; learning to _find_ these is the point:

| Concept               | What it is (one line)                                                                                                        | Where to find it                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `.env` files          | Plain `KEY=value` files Vite auto-loads from the project root                                                                | Search `sveltekit environment variables`; docs → **Environment variables**                     |
| `$env/static/private` | SvelteKit's typed import for **secret** (server-only) env vars                                                               | docs → **`$env/static/private`**; search `sveltekit $env static private`                       |
| `+server.ts` endpoint | A server **API route** that returns raw HTTP responses — _not_ a component (that's why no component example looks like this) | docs → **Routing**, the **"+server"** section; search `sveltekit +server endpoint`             |
| `json()` helper       | Builds a JSON `Response` for you; exported from `@sveltejs/kit`                                                              | docs → the **`@sveltejs/kit`** reference, entry **`json`**; search `sveltekit json helper`     |
| `RequestHandler` type | The TypeScript type for an endpoint handler, auto-generated per route via `./$types`                                         | docs → **Routing** (mentions `./$types`) + **Types**; search `sveltekit RequestHandler $types` |

(All doc pages live under `svelte.dev/docs/kit`.)

**Steps:**

1. Create `.env.example` at the repo root with empty `ANTHROPIC_API_KEY=` and `OPENAI_API_KEY=`. This file **is** committed — it documents which vars exist, without leaking values.
2. Create `.env` at the repo root with your real keys. It's gitignored. Vite reads env vars from the project root (the folder holding `vite.config.ts`), so it must live here, not under `src/`.
3. Create the endpoint `src/routes/api/test-env/+server.ts`. Open the **Routing → "+server"** doc and use its `GET` example as your template. You need to work out three things:
   - **Which function to export** — hint: visiting a URL in a browser is an HTTP **GET**.
   - **How to read the key** — import it via `$env/static/private`, _or_ read `env.ANTHROPIC_API_KEY` from `$env/dynamic/private`. Either works.
   - **What to return** — an endpoint returns a `Response`; `json({ hasKey: ... })` builds one. Use `!!yourKey` to collapse the key string into a `true`/`false`, so you report _presence_ without ever sending the secret.
4. Start the dev server (`pnpm dev`) and visit `http://localhost:5173/api/test-env`.
5. Once it works, delete the test route.

**Done when:** visiting `/api/test-env` returns `{"hasKey": true}`.

**Why a throwaway route?** It isolates one question — "did my key actually load?" — from everything else. When the real chat route misbehaves later, you'll already trust your env setup, so you can rule it out fast.

---

## Phase 1: First Conversation with Claude

### Ticket 1.1 — Install AI SDK packages _==DONE==_

**Goal:** Vercel AI SDK installed in the library.

**New concepts in this ticket:**

| Concept             | What it is (one line)                                                                                 | Where to find it                                               |
| ------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `ai` (core SDK)     | Provider-agnostic functions like `streamText` for talking to any LLM                                  | AI SDK docs at **ai-sdk.dev**; search `ai sdk core streamText` |
| `@ai-sdk/anthropic` | The **provider adapter** that teaches the core SDK how to call Claude                                 | search `ai sdk anthropic provider`                             |
| `@ai-sdk/svelte`    | Svelte UI helpers (the chat hook you'll use in 1.5)                                                   | search `ai sdk svelte`                                         |
| peer dependency     | A package your dependency expects _you_ to install too; a warning means a version mismatch to resolve | search `pnpm peer dependency warning`                          |

⚠️ **Version note:** the AI SDK moves fast and its API has changed across major versions, so online examples may not match what `pnpm add` installs. When something doesn't line up, check your installed version (`pnpm ls ai`) and read the docs _for that version_. Tickets 1.2 and 1.5 name specific methods — treat those as "verify against my version," not gospel.

**Steps:**

- From the repo root, run `pnpm add ai @ai-sdk/anthropic @ai-sdk/svelte`
- Verify no peer dependency warnings; resolve any that appear

**Done when:** `pnpm install` completes cleanly with the three packages in `package.json`.

---

### Ticket 1.2 — Create the streaming handler factory in the library _==DONE==_

**Goal:** Library exports a `createStreamHandler` function that returns a SvelteKit `RequestHandler`.

**Shape of the work — read before the steps.** You write one function that builds and returns another. The **outer** function is called once, at startup, with your Anthropic key. The **inner** function it returns runs on every HTTP request — it asks Claude for text and streams that back to the browser. The key is captured by the outer call, so the inner one can reach it on every request. Steps 1–2 build the shell, 3 turns the key into a provider, 4–5 do the Claude call, 6–7 type it and ship the export.

**Inputs → outputs:**

- takes: `{ apiKey: string }`
- returns: a `RequestHandler` — a function `(event) => Promise<Response>`

**Parts list — each row is one piece you place:**

| Part     | Exact form                                                                                         | From                  | Verify                                 |
| -------- | -------------------------------------------------------------------------------------------------- | --------------------- | -------------------------------------- |
| provider | `createAnthropic({ apiKey })` — **not** bare `anthropic`, which ignores your key and reads env only | `@ai-sdk/anthropic`   | d.ts:1258 (`apiKey` option)            |
| model    | `anthropic('claude-sonnet-5')` (or `'claude-opus-5'`)                                              | the provider above    | any current id passes straight through |
| call     | `streamText({ model, prompt })`                                                                    | `ai`                  | ai-sdk.dev → streamText                |
| response | `result.toUIMessageStreamResponse()`                                                               | result of `streamText`| `ai` d.ts:2815                         |
| type     | `import type { RequestHandler } from '@sveltejs/kit'` — **not** `./$types` (this file isn't a route)| `@sveltejs/kit`       | hover it in VS Code                    |

**Where each part goes (skeleton — the blanks are yours to fill):**

```ts
import { streamText } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { RequestHandler } from '@sveltejs/kit';

export const createStreamHandler = (config: { apiKey: string }) => {
  // build the provider from config.apiKey  → createAnthropic(...)
  return async (event) => {
    // call streamText with the model + a hardcoded prompt
    // return result.toUIMessageStreamResponse()
  }; // ← this inner function is your RequestHandler
};
```

**Steps — what each one accomplishes:**

1. Open `src/lib/server/index.ts`; you already have `export const createStreamHandler = () => {}`.
2. Add the three imports at the top of the skeleton. _(Hover each in VS Code to see its type.)_
3. Make the factory take `config: { apiKey: string }` and **return** an `async (event) => { … }`. That `return` is the whole point — the returned inner function is what runs on each request.
4. Above the `return`, build the provider: `createAnthropic({ apiKey: config.apiKey })`. Now you can call it like `anthropic('claude-sonnet-5')` to pick a model.
5. Inside the inner function, call `streamText` with that model and a **hardcoded** `prompt` for now, then return `result.toUIMessageStreamResponse()`. (Real messages arrive in 1.5.)
6. Annotate the returned function as `RequestHandler` so TypeScript checks its shape.
7. Add the `./server` subpath to `package.json`, then run `pnpm build` and confirm `dist/server/index.js`:
   ```json
   "exports": {
     ".": { "svelte": "./dist/index.js", "types": "./dist/index.d.ts" },
     "./server": { "import": "./dist/server/index.js", "types": "./dist/server/index.d.ts" }
   }
   ```

**Done when:** Build succeeds and the `./server` export resolves.

**Why a factory, not a route?** A library SvelteKit project doesn't expose routes itself — it ships code the consumer mounts. Returning a handler (instead of hardcoding one) is what lets every parent app pass its own key and mount the route at its own path.

**Stuck? Ask before grinding.** If the factory `return`, closures, or the `RequestHandler` type still feel fuzzy, say so — that's a two-minute unblock, not a failure.

---

### Ticket 1.3 — Mount the stream route in the demo app (second dopamine win)

**Goal:** Demo app exposes `/api/ai-chat/stream` using the library handler, and it actually talks to Claude.

**Shape of the work — read before the steps.** This ticket writes almost no logic. You built the handler in 1.2; here you _mount_ it. A SvelteKit route file (`+server.ts`) exports functions named after HTTP methods — whatever you assign to `POST` handles POST requests. You call `createStreamHandler` once with your real key and assign what it returns to `POST`. Then you prove it works with `curl`.

**Inputs → outputs:**

- takes: your key from the server-only env module (`ANTHROPIC_API_KEY`)
- produces: `src/routes/api/ai-chat/stream/+server.ts`, which exports `POST` — the live endpoint at `/api/ai-chat/stream`

**Parts list — each row is one piece you place:**

| Part           | Exact form                                                | From                  | Verify                                    |
| -------------- | --------------------------------------------------------- | --------------------- | ----------------------------------------- |
| the route file | `src/routes/api/ai-chat/stream/+server.ts`                | you create it         | folder path = the URL path                |
| the factory    | `createStreamHandler`                                     | `$lib/server`         | it's your 1.2 export (`$lib` = `src/lib`) |
| the key        | `ANTHROPIC_API_KEY`                                       | `$env/static/private` | it's in your `.env` (from 0.6)            |
| the mount      | `export const POST = createStreamHandler({ apiKey: … })`  | this file             | SvelteKit maps the `POST` export → POSTs  |

**Where each part goes (skeleton — the blank is yours):**

```ts
// src/routes/api/ai-chat/stream/+server.ts
import { createStreamHandler } from '$lib/server';
import { ANTHROPIC_API_KEY } from '$env/static/private';

export const POST = /* call the factory with { apiKey: ANTHROPIC_API_KEY } */;
```

**Steps — what each one accomplishes:**

1. Create the route file at `src/routes/api/ai-chat/stream/+server.ts`. The folder path becomes the URL — that's SvelteKit's file-based routing.
2. Import your factory from `$lib/server`. `$lib` is SvelteKit's alias for `src/lib`, so you skip `../../..`. (An outside app would import from `@your-org/ai-chat/server`.)
3. Import `ANTHROPIC_API_KEY` from `$env/static/private`. The `private` module is server-only, so the key never ships to the browser.
4. Fill the blank: assign `createStreamHandler({ apiKey: ANTHROPIC_API_KEY })` to `export const POST`. You're _assigning_ a ready-made handler, not writing a function body — 1.2 already built it.
5. Start the dev server (`pnpm dev`), and in a second terminal run: `curl -N -X POST http://localhost:5173/api/ai-chat/stream`. The `-N` turns off buffering so you actually see it stream.

**Heads-up on the output:** because your handler returns `toUIMessageStreamResponse()`, the curl output is a series of `data: {…}` lines (Server-Sent Events), not clean prose. That's _correct_ — it's the streaming protocol the chat UI decodes in 1.5. Seeing `data:` lines means it worked.

**Done when:** The curl response streams text from Claude.

**Why POST, not GET?** You're _sending_ data (the conversation) to the server, and the chat hook in 1.5 sends it as a POST. GET fetches; POST submits. — And this is your second dopamine win: your code just talked to Claude. The architecture is proven; everything from here is features on top.

---

### Ticket 1.4 — Build the minimal `<AIChat />` component shell

**Goal:** An `<AIChat />` component renders a chat UI (no AI wiring yet).

**Shape of the work — read before the steps.** You're building only the _visual shell_ — no network calls yet. A Svelte component holds reactive state (the message list, the textbox value), renders the list, and on send pushes a new message and clears the box. In Svelte 5, "reactive" means declared with the `$state` rune — plain `let` won't update the screen. You'll lay it out with Bootstrap utility classes, then swap `HelloChat` for `AIChat` in the exports and on the demo page.

**Inputs → outputs:**

- takes: nothing yet (no props this ticket)
- produces: `src/lib/AIChat.svelte`, exported from `src/lib/index.ts`, rendered on the demo page

**Parts list — each row is one piece you place:**

| Part          | Exact form                                                                           | Why it's needed             | Verify                |
| ------------- | ------------------------------------------------------------------------------------ | --------------------------- | --------------------- |
| reactive list | `let messages = $state([])`                                                          | plain `let` won't re-render | Svelte docs → $state  |
| reactive box  | `let input = $state('')`                                                             | same                        | —                     |
| the loop      | `{#each messages as m}…{/each}`                                                       | renders each message        | Svelte docs → {#each} |
| send handler  | `onclick={send}` / form `onsubmit={send}`                                            | runs code on click/submit   | Svelte docs → markup  |
| layout        | `d-flex flex-column`, `flex-grow-1 overflow-auto`, `form-control`, `btn btn-primary` | company Bootstrap convention| —                     |

**Where each part goes (skeleton — the blanks are yours):**

```svelte
<script lang="ts">
  let messages = $state<{ role: string; content: string }[]>([]);
  let input = $state('');

  function send() {
    // push { role: 'user', content: input } onto messages, then set input = ''
  }
</script>

<div class="d-flex flex-column" style="height: 600px">
  <!-- header -->
  <div class="flex-grow-1 overflow-auto p-3">
    <!-- {#each messages as m} … render m.role + m.content … {/each} -->
  </div>
  <!-- composer: <textarea class="form-control" bind:value={input}> + Send button -->
</div>
```

**Steps — what each one accomplishes:**

1. Create `src/lib/AIChat.svelte`.
2. In `<script>`, declare two pieces of state with `$state`: `messages` (an array of `{ role, content }`) and `input` (a string). **Gotcha:** it must be `$state([])`, not `[]` — plain `let` is not reactive in Svelte 5, so the UI won't update when you push.
3. Build the layout with Bootstrap utilities: an outer `d-flex flex-column` with a fixed `height`, a header, a scrolling message area (`flex-grow-1 overflow-auto p-3`), and a composer (`<textarea class="form-control">` + `<button class="btn btn-primary">Send</button>`).
4. Bind the textarea to `input` with `bind:value={input}`, and wire the button (or a wrapping `<form>`'s `onsubmit`) to a `send` function.
5. In `send`, push `{ role: 'user', content: input }` onto `messages`, then set `input = ''`. That's the whole behavior for now.
6. Render the list with `{#each messages as m}`, showing `m.role` and `m.content`.
7. In `src/lib/index.ts`, export `AIChat` and remove `HelloChat`. In `src/routes/+page.svelte`, render `<AIChat />` instead of `<HelloChat />`.

**Done when:** The demo app shows a chat UI. Typing and clicking Send appends a "user:" message to the list.

---

### Ticket 1.5 — Wire the chat to the streaming route (the magic moment)

**Goal:** The component actually talks to Claude. The hardcoded prompt in 1.2 becomes the real conversation.

**Shape of the work — read before the steps.** Two edits, one on each side. **Server:** your 1.2 handler reads `messages` from the request body and passes them to `streamText`. It's already close — but it has two bugs from an earlier session that this ticket fixes. **Component:** replace the fake local `messages` state from 1.4 with the AI SDK's `Chat` object. That object sends messages to your endpoint and collects the streamed reply for you. Version catch: your `@ai-sdk/svelte@5` has **no `useChat`** — it exports a `Chat` class you instantiate. All of this is pinned below.

**✅ Pinned API — verified 2026-08-23 against the `.d.ts` files actually in your `node_modules`.**
Installed: **`ai@7.0.77`**, **`@ai-sdk/svelte@5.0.77`**, **`@ai-sdk/anthropic@4.0.41`**. (Earlier drafts of this ticket cited `ai` v5 line numbers — ignore any you see elsewhere. Line numbers below are from `ai@7.0.77/dist/index.d.ts` unless noted.)

| The thing | Correct call for your versions | Verified at |
| --- | --- | --- |
| convert client messages | `await convertToModelMessages(messages)` — **it's `async` in v7**, returns `Promise<ModelMessage[]>` | index.d.ts:5589 |
| feed the model | `streamText({ model, messages })` — `messages` must be the **awaited** `ModelMessage[]`, not the promise | index.d.ts:715 |
| return the stream | `return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })` | index.d.ts:5958 + 6031 |
| chat object | `new Chat({ transport: new DefaultChatTransport({ api }) })` | `Chat` = chat.svelte.d.ts; `DefaultChatTransport` = index.d.ts:5699 |
| transport `api` option | `new DefaultChatTransport({ api: '/api/ai-chat/stream' })` | index.d.ts:5638 (`api?: string`) |
| send a message | `chat.sendMessage({ text: input })` → `Promise<void>` | AbstractChat, index.d.ts:5491+ |
| render the list | `chat.messages` (getter → `UIMessage[]`) | AbstractChat, index.d.ts:5491+ |
| streaming flag | `chat.status` → `'submitted' \| 'streaming' \| 'ready' \| 'error'` | AbstractChat, index.d.ts:5491+ |
| a text part | `part.type === 'text'` → `part.text` (string) | TextUIPart, index.d.ts |

**⚠️ Two bugs already in your `src/lib/server/index.ts` (from an earlier session) — fixing them IS step 1:**

1. `messages: convertToModelMessages(messages)` passes a **`Promise`** where `streamText` wants a `ModelMessage[]`. Add `await`.
2. The return is wired to the wrong function. The pieces `toUIMessageStream({ stream: result.stream })` are correct, but they're passed as an argument to `result.toUIMessageStreamResponse({ ... })` — which is (a) `@deprecated` in v7 (index.d.ts:2811) and (b) ignores that argument entirely. Feed those same pieces to the standalone `createUIMessageStreamResponse({ ... })` instead. That's the non-deprecated helper the SDK's own deprecation note points you to.

**Inputs → outputs:**

- Server takes `{ messages }` from `await event.request.json()`; returns the streamed response.
- Component: `chat.messages` is the live list you render; `chat.sendMessage({ text })` sends one; `chat.status` tells you if it's streaming.

**Where each part goes (skeletons — the blanks are yours):**

```ts
// SERVER — src/lib/server/index.ts, inside the returned handler (fix your existing code)
// imports from 'ai': convertToModelMessages, streamText, toUIMessageStream, createUIMessageStreamResponse
const { messages } = await event.request.json();
const result = streamText({
  model: anthropic('claude-sonnet-5'),
  messages: await convertToModelMessages(messages), // ← note the await (v7 is async)
});
return createUIMessageStreamResponse({
  stream: toUIMessageStream({ stream: result.stream }), // ← non-deprecated path
});
```

```svelte
<!-- COMPONENT — src/lib/AIChat.svelte -->
<script lang="ts">
  import { Chat } from '@ai-sdk/svelte';
  import { DefaultChatTransport } from 'ai';

  const chat = new Chat({
    transport: new DefaultChatTransport({ api: '/api/ai-chat/stream' }),
  });
  let input = $state('');

  function send(event: SubmitEvent) {
    // event.preventDefault(); chat.sendMessage({ text: input }); then input = ''
  }
</script>

<!-- render chat.messages; each message has message.parts — iterate the text parts -->
```

**Steps — what each one accomplishes:**

1. **Server first — fix the two bugs.** In your handler: (a) change `convertToModelMessages(messages)` to `await convertToModelMessages(messages)` — in `ai@7` this function is `async`, so without `await` you hand `streamText` a `Promise` and `svelte-check` will flag the type mismatch. (b) Replace the whole `return result.toUIMessageStreamResponse({ … })` line with `return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`. Make sure both `toUIMessageStream` and `createUIMessageStreamResponse` are imported from `'ai'`. `toUIMessageStream` turns the model's raw text stream into UI-message chunks; `createUIMessageStreamResponse` wraps those chunks into the HTTP `Response` the `Chat` object decodes. (Why not `result.toUIMessageStreamResponse()`? It's `@deprecated` in v7 — the SDK's own note points you to these two helpers.)
2. **Verify the server in isolation** before touching the component: `pnpm check` should pass, then `curl -N -X POST http://localhost:5173/api/ai-chat/stream -H "content-type: application/json" -d '{"messages":[{"role":"user","parts":[{"type":"text","text":"hi"}]}]}'`. You want a stream of `data:` lines back. (This is the same shape the `Chat` object sends, so if curl works, the component will too.)
3. **Component.** Import `Chat` from `@ai-sdk/svelte` and `DefaultChatTransport` from `ai`, then create the `chat` object pointed at your route. Without the transport it defaults to `/api/chat`, which isn't your endpoint.
4. Keep your local `let input = $state('')` from 1.4 — the `Chat` class does **not** manage the textbox for you (the biggest change from the old `useChat`).
5. In `send`, call `chat.sendMessage({ text: input })`, then clear `input`. Delete the manual `messages.push(...)` and your old `messages` `$state` — the chat object owns the list now.
6. Render `{#each chat.messages as message}` instead of your 1.4 array. **Shape changed:** a message carries a `parts` array (typed pieces), not a single `content` string. Each text piece is `{ type: 'text', text: string }`. Iterate `message.parts` and render the ones where `part.type === 'text'`. Run `console.log(chat.messages)` once to see the shape before you render it.

**Done when:** You type a message, hit send, and watch Claude stream a response into the list, character by character. This is the magic moment — a real AI chat in a component you built.

**Notes:** If nothing streams into the UI, confirm the server returns `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })` — the `Chat` class only understands that exact protocol. If messages render blank, it's the `parts` vs `content` shape change from step 6. If TypeScript complains the server `messages` is `unknown`, that's expected from `event.request.json()` — you'll type it properly in Phase 3; for now the `convertToModelMessages` call is what matters.

---

## Phase 2: Multi-Provider (Sketched)

You'll have the Anthropic-only chat working at the end of Phase 1. Phase 2 generalizes it.

### Ticket 2.1 — Install OpenAI adapter

Install `@ai-sdk/openai` in the library. Verify it imports.

### Ticket 2.2 — Provider registry in the handler

Refactor `createStreamHandler` to accept a `providers` config: `{ claude: anthropicAdapter, openai: openaiAdapter }`. Read the requested provider from the request body. Pick the right adapter. Update the demo app to pass both.

### Ticket 2.3 — Model parameter from request body

Read `model` from the request body too. Pass it to the chosen adapter (`anthropic(model)` or `openai(model)`).

### Ticket 2.4 — Provider dropdown in the header

Add a `<select>` in the `AIChat` header bound to a `provider` prop. Default to `'claude'`. Pass it in the request body via `useChat`'s `body` option.

### Ticket 2.5 — Model dropdown with `models` prop

Accept a `models: { claude: string[]; openai: string[] }` prop. Render a second `<select>` filtered by the current provider. Default to the first model in the array.

### Ticket 2.6 — Provider switch confirmation modal

When the provider changes and `$messages.length > 0`, show a Bootstrap modal: "Continue conversation with [new provider]?" with Continue / Start new chat / Cancel buttons. Implement each action.

**Phase 2 done when:** You can chat with Claude, switch the dropdown to GPT-4, get a confirmation modal, choose continue, and see GPT-4 respond to your conversation history.

---

## Phase 3: Typed Content Blocks _(detail later)_

Migrate the message model from strings to typed `ContentBlock[]` with stable IDs. Build a parser that converts assistant text into blocks (text + code initially). Replace string rendering with block rendering. This is the architectural change that unlocks v2 side-panel artifacts later.

## Phase 4: Context Injection _(detail later)_

Define `ContextEntry` data model and `pushContext`/`clearContext`/`getContext` controller methods. Build the system prompt assembler (priority-sorted concat). Wire `baseline` context via prop. Add the Memory badge in the header showing entry count, clickable to view/disable.

## Phase 5: Session Persistence _(detail later)_

Define `StorageCallbacks` interface. Fire `onSessionUpdate` on each message exchange (debounced). Wire `loadSession` and `listSessions` callbacks. Build the History UI as a Bootstrap dropdown or modal listing past sessions.

## Phase 6: Multimodal Input _(detail later)_

Build file attachment UI (file picker, attachment chips above the composer). Implement base64 encoding. Image attachments render as thumbnails in the user message. PDF attachments pass through to the SDK. Text/code files get embedded inline as code blocks in the user message.

## Phase 7: Rich Block Rendering _(detail later)_

Add the remaining block renderers: image (with click-to-enlarge), HTML (sandboxed iframe with `sandbox="allow-scripts"` and `srcdoc`), chart (Vega-Lite), tool call (collapsed indicator with expandable details).

## Phase 8: MCP Support _(detail later)_

Install the MCP SDK. Accept `mcpServers` prop on the component. Server-side, connect the MCP client, pull tools, pass them into `streamText`. Manual smoke test against a real MCP server (your company's GraphQL one is the obvious target).

## Phase 9: Styling Polish _(detail later)_

Expose styling props (`sendButtonStyle`, `attachButtonStyle`, message background classes). Verify the component works in both light and dark BS5 themes. Add the streaming cursor animation. Tune autoscroll behavior so it feels good when streaming long responses.

## Phase 10: Testing Infrastructure _(detail later)_

Set up Vitest and write the first unit test (block parser is a good target — pure function with clear inputs/outputs). Set up Playwright component tests and write the first one (the send → stream → render flow). Build a smoke test script that hits real APIs, env-gated, for catching provider regressions.

---

## When You're Ready for Phase 2 Detail

Finish Phase 1, then come back and say something like "I'm done with Phase 1, let's detail Phase 2." I'll flesh it out with the same level of detail as Phase 0/1, incorporating anything you learned along the way.

Same pattern for every subsequent phase. You stay in flow; the ticket list stays right-sized to what you can hold in your head.
