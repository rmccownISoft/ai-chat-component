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

## Phase Map

| Phase | Name | Goal |
|-------|------|------|
| 0 | Foundation | Empty but working monorepo with library + demo app + Bootstrap + env keys |
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

### Ticket 0.1 — Initialize monorepo skeleton

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

### Ticket 0.2 — Initialize the library package

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

### Ticket 0.3 — Initialize the demo app

**Goal:** `apps/demo` is a working SvelteKit app.

**Steps:**
- From repo root: `mkdir apps && cd apps`
- `pnpm create svelte@latest demo` — choose **Skeleton project**, **TypeScript** yes, **ESLint + Prettier** yes
- `cd demo && pnpm install`
- Commit

**Done when:** `pnpm --filter demo dev` opens the skeleton app on localhost.

---

### Ticket 0.4 — Wire the workspace dependency (first dopamine win)

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

### Ticket 0.5 — Add Bootstrap 5 to the demo app

**Goal:** BS5 is loaded so future styling has a real environment.

**Steps:**
- In `apps/demo/src/app.html`, add the Bootstrap 5 CSS CDN link in `<head>` (use the version your team uses)
- Set `<html data-bs-theme="light" data-bs-version="5">` on the root tag
- In `+page.svelte`, wrap your `<HelloChat />` in a Bootstrap container: `<div class="container mt-4"><h1>AI Chat Demo</h1><HelloChat /></div>`
- Confirm in the browser that Bootstrap typography (the heading) and spacing (the margin) look applied

**Done when:** The "AI Chat Demo" heading and container look like Bootstrap, not browser default.

---

### Ticket 0.6 — Set up env keys

**Goal:** API keys are loadable from `.env` in the demo app.

**Steps:**
- Create `apps/demo/.env.example` with: `ANTHROPIC_API_KEY=` and `OPENAI_API_KEY=`
- Create `apps/demo/.env` (already gitignored) with your real keys
- Create `apps/demo/src/routes/api/test-env/+server.ts` that imports `ANTHROPIC_API_KEY` from `$env/static/private` and returns `json({ hasKey: !!ANTHROPIC_API_KEY })`
- Visit `http://localhost:5173/api/test-env` in the browser
- Once confirmed, delete the test route

**Done when:** Visiting the test route returns `{"hasKey": true}`.

**Notes:** `$env/static/private` is SvelteKit's typesafe env import — TypeScript will autocomplete the variable names you've declared. This is one of SvelteKit's nicer DX touches.

---

## Phase 1: First Conversation with Claude

### Ticket 1.1 — Install AI SDK packages

**Goal:** Vercel AI SDK installed in the library.

**Steps:**
- `cd packages/ai-chat`
- `pnpm add ai @ai-sdk/anthropic @ai-sdk/svelte`
- Verify no peer dependency warnings; resolve any that appear

**Done when:** `pnpm install` completes cleanly with the three packages in `packages/ai-chat/package.json`.

---

### Ticket 1.2 — Create the streaming handler factory in the library

**Goal:** Library exports a `createStreamHandler` function that returns a SvelteKit `RequestHandler`.

**Steps:**
- Create `packages/ai-chat/src/lib/server/index.ts`
- Write a `createStreamHandler(config: { apiKey: string })` function that returns a `RequestHandler`
- Inside the handler: call `streamText({ model: anthropic('claude-3-5-sonnet-latest'), prompt: 'Say hello in one sentence.' })` for now (hardcoded — we'll make it real in 1.5)
- Return `result.toDataStreamResponse()`
- In `packages/ai-chat/package.json`, add an exports entry so consumers can `import { createStreamHandler } from '@your-org/ai-chat/server'`:
  ```json
  "exports": {
    ".": { "svelte": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./server": { "import": "./dist/server/index.js", "types": "./dist/server/index.d.ts" }
  }
  ```
- Run `pnpm --filter @your-org/ai-chat build` to confirm the build emits `dist/server/index.js`

**Done when:** Build succeeds and the `./server` export resolves.

**Notes:** Library SvelteKit projects don't expose routes themselves — they ship code that the consumer (demo app) mounts. This factory pattern is what makes the route reusable across many parent apps.

---

### Ticket 1.3 — Mount the stream route in the demo app (second dopamine win)

**Goal:** Demo app exposes `/api/ai-chat/stream` using the library handler, and it actually talks to Claude.

**Steps:**
- Create `apps/demo/src/routes/api/ai-chat/stream/+server.ts`
- Import `createStreamHandler` from `@your-org/ai-chat/server`
- Import `ANTHROPIC_API_KEY` from `$env/static/private`
- `export const POST = createStreamHandler({ apiKey: ANTHROPIC_API_KEY })`
- Test from the terminal: `curl -X POST http://localhost:5173/api/ai-chat/stream` (might need to keep the server running in another terminal)

**Done when:** The curl response streams text from Claude.

**Notes:** Second dopamine win — your code just talked to Claude. The architecture is now proven; everything from here is adding features on top.

---

### Ticket 1.4 — Build the minimal `<AIChat />` component shell

**Goal:** An `<AIChat />` component renders a chat UI (no AI wiring yet).

**Steps:**
- In `packages/ai-chat/src/lib/`, create `AIChat.svelte`
- Layout (BS5 utilities): an outer `class="d-flex flex-column"` container with a fixed height (`style="height: 600px"` for now); inside it, a header div, a flex-grow message list div with `overflow-auto p-3`, and a composer div at the bottom with a `<textarea class="form-control">` and `<button class="btn btn-primary">Send</button>`
- Local state: `let messages: { role: string; content: string }[] = []` and `let input = ''`
- On send: push `{ role: 'user', content: input }` to messages, clear input
- Render each message with role label (`<strong>{role}:</strong> {content}`)
- Update `src/lib/index.ts` to export `AIChat` (remove `HelloChat`)
- In demo `+page.svelte`, render `<AIChat />` instead of `<HelloChat />`

**Done when:** The demo app shows a chat UI. Typing in the textarea and clicking Send appends a "user:" message to the list.

---

### Ticket 1.5 — Wire `useChat` to the streaming route (the magic moment)

**Goal:** The component actually talks to Claude. The hardcoded prompt in 1.2 becomes the real conversation.

**Steps:**
- Update `createStreamHandler` to read `messages` from the request body and pass them to `streamText` (instead of the hardcoded prompt). The shape: `const { messages } = await request.json(); ... streamText({ model: anthropic(...), messages })`
- In `AIChat.svelte`, import `useChat` from `@ai-sdk/svelte`
- Initialize: `const { input, messages, handleSubmit } = useChat({ api: '/api/ai-chat/stream' })`
- Replace your local state bindings with the ones from `useChat`
- Bind the textarea to `$input` and wire the form to `handleSubmit`
- Render `$messages` instead of your local array

**Done when:** You type a message, hit send, and watch Claude stream a response into the message list, character by character. This is the magic moment — a real AI chat in a Svelte component you built.

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
