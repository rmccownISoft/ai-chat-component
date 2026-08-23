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

| Ticket/spec says (monorepo) | This repo (single library project) |
|---|---|
| `packages/ai-chat/` (the library) | repo **root** |
| `packages/ai-chat/src/lib/...` | `src/lib/...` (published to `dist/`) |
| `packages/ai-chat/src/lib/server/...` | `src/lib/server/...` |
| `apps/demo/` (consumer app) | `src/routes/` (the built-in dev app) |
| `apps/demo/.env` and `.env.example` | `.env` and `.env.example` at repo **root** |
| `apps/demo/src/routes/...` | `src/routes/...` |
| demo import `from '@your-org/ai-chat/server'` | dev-app import `from '$lib/server'` (external consumers use the published `./server` export) |
| `pnpm --filter @your-org/ai-chat dev` | `pnpm dev` |
| `"@your-org/ai-chat": "workspace:*"` dep | not needed — it's one project |

---

## Phase Map

| Phase | Name | Goal |
|-------|------|------|
| 0 | Foundation | Empty but working library project with a built-in demo playground + Bootstrap + env keys |
| 1 | First Conversation | End-to-end streaming chat with Claude, hardcoded model |
| 2 | Multi-Provider | OpenAI added, provider/model dropdowns, switch confirmation |
| 3 | Typed Content Blocks | Migrate from string messages to typed blocks with stable IDs |
| 4 | Context Injection | Baseline + route + manual context, system prompt assembly, memory badge |
| 5 | Session Persistence | Save/load/list sessions via parent app callbacks, history UI |
| 6 | Multimodal Input | Image, PDF, text/code file attachments |
| 7 | Rich Block Rendering | Image, sandboxed HTML, Vega-Lite chart, tool call blocks |
| 8 | MCP Support | Connect one configured MCP server, pass tools to streamText |
| 9 | Styling Polish | Style props, theming verification, streaming cursor, autoscroll |
| 10 | Testing Infrastructure | Vitest + Playwright setup, first unit and component tests, smoke tests |

---

## Phase 0: Foundation

> **Layout note:** Tickets 0.1–0.5 were completed as a single library project, not the monorepo their steps describe. The steps are kept as the original plan; see **Repo Layout** above for how the paths map. Only the paths differ — the outcomes are the same.

### Ticket 0.1 — Initialize monorepo skeleton *==DONE==*

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

### Ticket 0.2 — Initialize the library package *==DONE==*

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

### Ticket 0.3 — Initialize the demo app *==DONE==*

**Goal:** `apps/demo` is a working SvelteKit app.

**Steps:**
- From repo root: `mkdir apps && cd apps`
- `pnpm create svelte@latest demo` — choose **Skeleton project**, **TypeScript** yes, **ESLint + Prettier** yes
- `cd demo && pnpm install`
- Commit

**Done when:** `pnpm --filter demo dev` opens the skeleton app on localhost.

---

### Ticket 0.4 — Wire the workspace dependency (first dopamine win) *==DONE==*

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

### Ticket 0.5 — Add Bootstrap 5 to the demo app *==DONE==*

**Goal:** BS5 is loaded so future styling has a real environment.

**Steps:**
- In `apps/demo/src/app.html`, add the Bootstrap 5 CSS CDN link in `<head>` (use the version your team uses)
- Set `<html data-bs-theme="light" data-bs-version="5">` on the root tag
- In `+page.svelte`, wrap your `<HelloChat />` in a Bootstrap container: `<div class="container mt-4"><h1>AI Chat Demo</h1><HelloChat /></div>`
- Confirm in the browser that Bootstrap typography (the heading) and spacing (the margin) look applied

**Done when:** The "AI Chat Demo" heading and container look like Bootstrap, not browser default.

---

### Ticket 0.6 — Set up env keys *==DONE==*

**Goal:** API keys load from a root `.env`, and a temporary endpoint proves it.

**New concepts in this ticket** — look each up as you reach it; learning to *find* these is the point:

| Concept | What it is (one line) | Where to find it |
|---|---|---|
| `.env` files | Plain `KEY=value` files Vite auto-loads from the project root | Search `sveltekit environment variables`; docs → **Environment variables** |
| `$env/static/private` | SvelteKit's typed import for **secret** (server-only) env vars | docs → **`$env/static/private`**; search `sveltekit $env static private` |
| `+server.ts` endpoint | A server **API route** that returns raw HTTP responses — *not* a component (that's why no component example looks like this) | docs → **Routing**, the **"+server"** section; search `sveltekit +server endpoint` |
| `json()` helper | Builds a JSON `Response` for you; exported from `@sveltejs/kit` | docs → the **`@sveltejs/kit`** reference, entry **`json`**; search `sveltekit json helper` |
| `RequestHandler` type | The TypeScript type for an endpoint handler, auto-generated per route via `./$types` | docs → **Routing** (mentions `./$types`) + **Types**; search `sveltekit RequestHandler $types` |

(All doc pages live under `svelte.dev/docs/kit`.)

**Steps:**
1. Create `.env.example` at the repo root with empty `ANTHROPIC_API_KEY=` and `OPENAI_API_KEY=`. This file **is** committed — it documents which vars exist, without leaking values.
2. Create `.env` at the repo root with your real keys. It's gitignored. Vite reads env vars from the project root (the folder holding `vite.config.ts`), so it must live here, not under `src/`.
3. Create the endpoint `src/routes/api/test-env/+server.ts`. Open the **Routing → "+server"** doc and use its `GET` example as your template. You need to work out three things:
   - **Which function to export** — hint: visiting a URL in a browser is an HTTP **GET**.
   - **How to read the key** — import it via `$env/static/private`, *or* read `env.ANTHROPIC_API_KEY` from `$env/dynamic/private`. Either works.
   - **What to return** — an endpoint returns a `Response`; `json({ hasKey: ... })` builds one. Use `!!yourKey` to collapse the key string into a `true`/`false`, so you report *presence* without ever sending the secret.
4. Start the dev server (`pnpm dev`) and visit `http://localhost:5173/api/test-env`.
5. Once it works, delete the test route.

**Done when:** visiting `/api/test-env` returns `{"hasKey": true}`.

**Why a throwaway route?** It isolates one question — "did my key actually load?" — from everything else. When the real chat route misbehaves later, you'll already trust your env setup, so you can rule it out fast.

---

## Phase 1: First Conversation with Claude

### Ticket 1.1 — Install AI SDK packages

**Goal:** Vercel AI SDK installed in the library.

**New concepts in this ticket:**

| Concept | What it is (one line) | Where to find it |
|---|---|---|
| `ai` (core SDK) | Provider-agnostic functions like `streamText` for talking to any LLM | AI SDK docs at **ai-sdk.dev**; search `ai sdk core streamText` |
| `@ai-sdk/anthropic` | The **provider adapter** that teaches the core SDK how to call Claude | search `ai sdk anthropic provider` |
| `@ai-sdk/svelte` | Svelte UI helpers (the chat hook you'll use in 1.5) | search `ai sdk svelte` |
| peer dependency | A package your dependency expects *you* to install too; a warning means a version mismatch to resolve | search `pnpm peer dependency warning` |

⚠️ **Version note:** the AI SDK moves fast and its API has changed across major versions, so online examples may not match what `pnpm add` installs. When something doesn't line up, check your installed version (`pnpm ls ai`) and read the docs *for that version*. Tickets 1.2 and 1.5 name specific methods — treat those as "verify against my version," not gospel.

**Steps:**
- From the repo root, run `pnpm add ai @ai-sdk/anthropic @ai-sdk/svelte`
- Verify no peer dependency warnings; resolve any that appear

**Done when:** `pnpm install` completes cleanly with the three packages in `package.json`.

---

### Ticket 1.2 — Create the streaming handler factory in the library

**Goal:** Library exports a `createStreamHandler` function that returns a SvelteKit `RequestHandler`.

**New concepts in this ticket:**

| Concept | What it is (one line) | Where to find it |
|---|---|---|
| factory function | A function that *returns* a configured function — here, one that returns a request handler with the API key baked in | search `javascript factory function pattern` |
| `streamText` | The core AI SDK call that sends a prompt/messages and streams tokens back | AI SDK docs → **streamText**; search `ai sdk streamText` |
| provider adapter call | `anthropic('<model-id>')` picks which Claude model runs | search `ai sdk anthropic model` |
| package `exports` map | The `exports` field in `package.json` that defines subpaths (like `/server`) consumers import | SvelteKit docs → **Packaging**; search `package.json exports subpath` |

⚠️ **Version note:** the method that turns a `streamText` result into a streamed HTTP response has been **renamed across AI SDK versions** (`toDataStreamResponse` is the older name). The steps below use the older form — confirm the current name in your installed version's docs before trusting it. Same for the exact `streamText` options and Claude model ids (model names change; look up current ones in the Anthropic/AI SDK docs).

**Steps:**
- Create `src/lib/server/index.ts`.
- Write `createStreamHandler(config: { apiKey: string })` that **returns** a `RequestHandler`. (That's the factory: the outer function captures the key; the inner function handles each request.)
- Inside the handler, call `streamText(...)` with `model: anthropic('<a current Claude model id>')` and a hardcoded `prompt` for now (you make it real in 1.5).
- Return the streamed response — older form: `result.toDataStreamResponse()` (see version note).
- In `package.json`, add a subpath export so consumers can `import { createStreamHandler } from '@your-org/ai-chat/server'`:
  ```json
  "exports": {
    ".": { "svelte": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./server": { "import": "./dist/server/index.js", "types": "./dist/server/index.d.ts" }
  }
  ```
- Run `pnpm build` to confirm the build emits `dist/server/index.js`.

**Done when:** Build succeeds and the `./server` export resolves.

**Why a factory, not a route?** A library SvelteKit project doesn't expose routes itself — it ships code the consumer mounts. Returning a handler (instead of hardcoding one) is what lets every parent app pass its own key and mount the route at its own path.

---

### Ticket 1.3 — Mount the stream route in the demo app (second dopamine win)

**Goal:** Demo app exposes `/api/ai-chat/stream` using the library handler, and it actually talks to Claude.

**New concepts in this ticket:**

| Concept | What it is (one line) | Where to find it |
|---|---|---|
| `$lib` alias | SvelteKit shortcut pointing at `src/lib` — import your own library code without `../../..` paths | SvelteKit docs → **`$lib`**; search `sveltekit $lib alias` |
| assigning a handler to `POST` | An endpoint's `POST`/`GET` export can be *any* `RequestHandler` value — including one your factory returns | SvelteKit docs → **Routing → +server**; search `sveltekit +server POST export` |
| `curl -X POST` | Command-line way to send a POST request to test an endpoint without a browser | search `curl POST request example` |

(You already met `+server.ts` endpoints and `$env/static/private` in 0.6.)

**Steps:**
- Create `src/routes/api/ai-chat/stream/+server.ts`.
- Import `createStreamHandler` from `$lib/server` (dev app is part of this project, so use `$lib`; an external consumer would import from `@your-org/ai-chat/server`).
- Import `ANTHROPIC_API_KEY` from `$env/static/private`.
- Export the handler as `POST`: `export const POST = createStreamHandler({ apiKey: ANTHROPIC_API_KEY })`. Notice you're *assigning* a ready-made handler, not writing a function body — the factory already built it.
- With the dev server running, test: `curl -X POST http://localhost:5173/api/ai-chat/stream` (you may need the server running in a second terminal).

**Done when:** The curl response streams text from Claude.

**Why POST, not GET?** You're *sending* data (the conversation) to the server, and the chat hook in 1.5 sends it as a POST. GET fetches; POST submits. — And this is your second dopamine win: your code just talked to Claude. The architecture is proven; everything from here is features on top.

---

### Ticket 1.4 — Build the minimal `<AIChat />` component shell

**Goal:** An `<AIChat />` component renders a chat UI (no AI wiring yet).

**New concepts in this ticket:**

| Concept | What it is (one line) | Where to find it |
|---|---|---|
| `.svelte` file | A component: `<script>` for logic, markup below, optional `<style>` | Svelte docs → **.svelte files**; search `svelte 5 component structure` |
| `$state` rune | Svelte 5's way to declare **reactive** local state — plain `let` is *not* reactive in runes mode | Svelte docs → **$state**; search `svelte 5 $state rune` |
| `{#each}` block | Loops over an array to render a list (your messages) | Svelte docs → **{#each}**; search `svelte each block` |
| event handler | `onclick={...}` / form `onsubmit` to run code on interaction | Svelte docs → **Basic markup**; search `svelte 5 onclick event` |

⚠️ **Gotcha (Svelte 5):** reactive state must use `$state()` — e.g. `let messages = $state([])`, **not** `let messages = []`. Plain `let` won't re-render the UI when you push to it. If you learned Svelte 4, this is the single biggest change. (Tip: the Svelte MCP tools / autofixer in this repo will catch runes mistakes for you.)

**Steps:**
- In `src/lib/`, create `AIChat.svelte`.
- Layout with BS5 utilities: outer `class="d-flex flex-column"` with a fixed height (`style="height: 600px"` for now); a header div; a flex-grow message list `class="flex-grow-1 overflow-auto p-3"`; a composer at the bottom with `<textarea class="form-control">` and `<button class="btn btn-primary">Send</button>`.
- Reactive state **using `$state`**: a `messages` array of `{ role, content }`, and an `input` string.
- On send: push `{ role: 'user', content: input }` onto `messages`, then clear `input`.
- Render the list with `{#each}`, showing each message's role + content.
- Update `src/lib/index.ts` to export `AIChat` (remove `HelloChat`).
- In `src/routes/+page.svelte`, render `<AIChat />` instead of `<HelloChat />`.

**Done when:** The demo app shows a chat UI. Typing and clicking Send appends a "user:" message to the list.

---

### Ticket 1.5 — Wire `useChat` to the streaming route (the magic moment)

**Goal:** The component actually talks to Claude. The hardcoded prompt in 1.2 becomes the real conversation.

**New concepts in this ticket:**

| Concept | What it is (one line) | Where to find it |
|---|---|---|
| `@ai-sdk/svelte` chat helper | Connects your component to the streaming endpoint and manages message state for you | AI SDK docs → Svelte section; search `ai sdk svelte useChat` (see version note) |
| reading the request body | Server side: `await request.json()` to get the `messages` the client sent | SvelteKit docs → **Routing → +server** ("Receiving data"); search `sveltekit +server request.json` |

⚠️ **Version note (read before starting):** the `@ai-sdk/svelte` chat API has **changed shape across versions**. Older versions export `useChat(...)` returning stores (`$input`, `$messages`, `handleSubmit`); newer versions export a `Chat` **class** you instantiate (`new Chat({...})`). The steps below are written in the older `useChat` style as a *starting reference* — open the `@ai-sdk/svelte` docs for your installed version and adapt. This is the single most likely spot to hit an API mismatch.

**Steps (adapt to your installed version — see note):**
- **Server:** update `createStreamHandler` to read `messages` from the request body and pass them to `streamText` instead of the hardcoded prompt. Shape: `const { messages } = await request.json(); ... streamText({ model: anthropic(...), messages })`.
- **Component:** import the chat helper from `@ai-sdk/svelte` and point it at `/api/ai-chat/stream`. Older form: `const { input, messages, handleSubmit } = useChat({ api: '/api/ai-chat/stream' })`.
- Replace the local `$state` you wrote in 1.4 with the state the helper manages.
- Wire the textarea to the helper's input, and the form's submit to its submit handler.
- Render the helper's messages instead of your local array.

**Done when:** You type a message, hit send, and watch Claude stream a response into the list, character by character. This is the magic moment — a real AI chat in a component you built.

**Notes:** If streaming feels janky, check that you're using `result.toDataStreamResponse()` (not plain text) — the SDK has a specific protocol the Svelte hook expects.

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

## Phase 3: Typed Content Blocks *(detail later)*

Migrate the message model from strings to typed `ContentBlock[]` with stable IDs. Build a parser that converts assistant text into blocks (text + code initially). Replace string rendering with block rendering. This is the architectural change that unlocks v2 side-panel artifacts later.

## Phase 4: Context Injection *(detail later)*

Define `ContextEntry` data model and `pushContext`/`clearContext`/`getContext` controller methods. Build the system prompt assembler (priority-sorted concat). Wire `baseline` context via prop. Add the Memory badge in the header showing entry count, clickable to view/disable.

## Phase 5: Session Persistence *(detail later)*

Define `StorageCallbacks` interface. Fire `onSessionUpdate` on each message exchange (debounced). Wire `loadSession` and `listSessions` callbacks. Build the History UI as a Bootstrap dropdown or modal listing past sessions.

## Phase 6: Multimodal Input *(detail later)*

Build file attachment UI (file picker, attachment chips above the composer). Implement base64 encoding. Image attachments render as thumbnails in the user message. PDF attachments pass through to the SDK. Text/code files get embedded inline as code blocks in the user message.

## Phase 7: Rich Block Rendering *(detail later)*

Add the remaining block renderers: image (with click-to-enlarge), HTML (sandboxed iframe with `sandbox="allow-scripts"` and `srcdoc`), chart (Vega-Lite), tool call (collapsed indicator with expandable details).

## Phase 8: MCP Support *(detail later)*

Install the MCP SDK. Accept `mcpServers` prop on the component. Server-side, connect the MCP client, pull tools, pass them into `streamText`. Manual smoke test against a real MCP server (your company's GraphQL one is the obvious target).

## Phase 9: Styling Polish *(detail later)*

Expose styling props (`sendButtonStyle`, `attachButtonStyle`, message background classes). Verify the component works in both light and dark BS5 themes. Add the streaming cursor animation. Tune autoscroll behavior so it feels good when streaming long responses.

## Phase 10: Testing Infrastructure *(detail later)*

Set up Vitest and write the first unit test (block parser is a good target — pure function with clear inputs/outputs). Set up Playwright component tests and write the first one (the send → stream → render flow). Build a smoke test script that hits real APIs, env-gated, for catching provider regressions.

---

## When You're Ready for Phase 2 Detail

Finish Phase 1, then come back and say something like "I'm done with Phase 1, let's detail Phase 2." I'll flesh it out with the same level of detail as Phase 0/1, incorporating anything you learned along the way.

Same pattern for every subsequent phase. You stay in flow; the ticket list stays right-sized to what you can hold in your head.
