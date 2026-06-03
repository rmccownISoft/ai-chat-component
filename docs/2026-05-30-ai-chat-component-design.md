# AI Chat Component — Design Spec

**Date:** 2026-05-30
**Status:** Approved for implementation planning
**Suggested location in repo:** `docs/specs/2026-05-30-ai-chat-component-design.md`

---

## Overview

A reusable Svelte / SvelteKit library component (`@your-org/ai-chat`) that provides a multi-provider AI chat interface for embedding in the company's various web apps. Built as a SvelteKit library in a pnpm monorepo with a demo app.

## Project Goals

**Primary:** Honing TypeScript, SvelteKit, and AI skills through hands-on implementation. Code is written by hand wherever practical; AI assistance is used for unblocking and learning, not generating large blocks of unread code.

**Secondary:** Produce a portfolio-quality project that demonstrates these skills.

**Tertiary:** Produce something genuinely useful that can be adopted by the employer.

**Implementation style:** ADHD-friendly. Tickets are scoped to ~30 minutes of work. Each ticket has a clear "done" criterion that produces something visibly working, so progress is rewarding and easy to resume.

## Goals (Functional)

- Reusable across multiple internal SvelteKit apps
- Support both Anthropic (Claude) and OpenAI providers via the Vercel AI SDK
- Provider and model selection via dropdowns
- Multimodal input (images, PDFs, text files)
- Static + dynamic context injection (route-aware system prompts)
- Session memory with parent-app persistence callbacks; session resume from history
- MCP server support (one configurable server in v1)
- Inline rendering of typed content blocks (text, code, image, html, chart, tool_call)
- Architected so v2 side-panel artifacts can be added without a rewrite
- Bootstrap 5 styling using stock utility classes; minimal opinionated CSS

## Non-Goals (v1)

- Side-panel artifact view (v2)
- Long-term memory implementation (data slot ready, no retrieval logic)
- Audio/video input (v2)
- Multi-MCP-server UI (v2)
- Bootstrap 4 compatibility
- Default storage adapter (parent owns persistence end-to-end)

---

## Architecture

### Repository Structure

```
your-ai-chat/
├── packages/
│   └── ai-chat/                # SvelteKit library
│       ├── src/
│       │   ├── lib/            # Components, stores, types, utils
│       │   └── routes/api/     # Server endpoints the library ships
│       ├── package.json
│       └── svelte.config.js
├── apps/
│   └── demo/                   # SvelteKit app demoing the library
│       ├── src/
│       └── package.json
├── package.json                # Root workspace config
└── pnpm-workspace.yaml
```

Built with `npm create svelte@latest` library template for the package, standard SvelteKit app for the demo. The demo imports the library via workspace protocol (`"@your-org/ai-chat": "workspace:*"`).

### High-Level Components

**Client-side library exports:**
- `<AIChat />` — main component (header, message list, composer)
- `createChatSession()` — factory for session state and lifecycle
- Type exports: `Message`, `ContentBlock`, `ChatSession`, `ContextEntry`, `Provider`, `StorageCallbacks`, etc.

**Server-side (SvelteKit routes the library ships):**
- `POST /api/ai-chat/stream` — streams LLM responses via Vercel AI SDK
- `POST /api/ai-chat/upload` — placeholder for v1; built only if inline base64 proves insufficient

**Provider layer (server-side):**
- Thin abstraction over `@ai-sdk/anthropic` and `@ai-sdk/openai`
- Selected per-request based on the `provider` field
- The client never imports provider SDKs directly

---

## Data Model

```ts
type Provider = 'claude' | 'openai'

type ContentBlock =
  | { type: 'text';      id: string; text: string }
  | { type: 'code';      id: string; language: string; code: string }
  | { type: 'image';     id: string; url: string; alt?: string }
  | { type: 'html';      id: string; html: string }       // sandboxed iframe in v1
  | { type: 'chart';     id: string; spec: unknown }      // vega-lite spec
  | { type: 'tool_call'; id: string; name: string; args: unknown; result?: unknown }

type Attachment = {
  id: string
  filename: string
  mimeType: string
  size: number
  data: string            // base64 in v1
}

type Message = {
  id: string
  role: 'user' | 'assistant' | 'system'
  blocks: ContentBlock[]
  provider?: Provider     // which provider generated this (assistant only)
  model?: string
  createdAt: number
  attachments?: Attachment[]
}

type ContextEntry = {
  id: string
  source: 'baseline' | 'route' | 'manual'
  content: string
  priority?: number       // higher = appears earlier in system prompt
}

type ChatSession = {
  id: string
  title?: string          // auto-generated from first message, editable
  messages: Message[]
  context: ContextEntry[]
  provider: Provider
  model: string
  memoryHints: string[]   // v2 populates; v1 leaves empty
  createdAt: number
  updatedAt: number
}

type SessionSummary = {
  id: string
  title: string
  provider: Provider
  model: string
  messageCount: number
  updatedAt: number
}
```

**Key invariant:** every `ContentBlock` has a stable `id`. v2's side-panel will reference blocks by ID across re-renders; adding IDs later is painful, adding them now is free.

---

## Server-Side Flow

The `/api/ai-chat/stream` route:

1. Receives `{ messages, context, provider, model, mcpServers?, attachments? }` from the client
2. Assembles the system prompt by concatenating `context` entries sorted by `priority` desc, then `source` order (`baseline` → `route` → `manual`)
3. Picks the provider adapter from a small registry (`{ claude: anthropic(...), openai: openai(...) }`)
4. If `mcpServers` are configured, connects via `experimental_createMCPClient`, pulls tool definitions, passes them into the `streamText` call
5. Streams the response back using the AI SDK's `toDataStreamResponse()`
6. Client uses the AI SDK's Svelte `useChat` hook to consume the stream

The route is responsible for:
- Server-side credential lookup (env vars in v1; pluggable in a later version)
- MCP connection lifecycle (open, pass tools, close on stream end)
- Provider selection
- Never accepting API keys from the client

---

## Provider Selection

UI exposes two dropdowns in the header:
- **Provider** — Claude / OpenAI
- **Model** — filtered by provider

Both populated from a `models` prop on the component, so the parent app controls which providers/models are available based on which keys are configured.

**Switching providers mid-conversation** with existing assistant messages: show a confirm modal with three options:
1. **Continue here** — keep history, send all messages to the new provider
2. **Start new chat** — fresh session, new provider
3. **Cancel** — revert the dropdown

---

## MCP Support

Configured via component prop:

```ts
mcpServers: [
  { name: 'company-graphql', url: 'https://...', auth: { ... } }
]
```

The component passes this through to the server route. The server route connects, pulls tools, includes them in the `streamText` call. The component never talks to MCP servers directly — keeps credentials server-side and centralizes connection management.

**v1 scope:** one configured server. **v2:** UI for multiple servers, per-tool enable/disable.

Tool calls appear in message blocks as `tool_call` blocks. v1 renders them as collapsed indicators ("Called `tool_name`") with an expandable section showing args and result.

---

## Context Injection

The system prompt is assembled at request time by concatenating `ContextEntry` items. Three sources:

- **`baseline`** — set once at component mount via the `systemPrompt` prop or `createChatSession()` config. Persists for the session.
- **`route`** — pushed by parent app on navigation. **Pushing a new `route` entry replaces any existing `route` entry.** This is how route-aware context works.
- **`manual`** — added programmatically by the parent app or by user-facing UI. Persists until explicitly removed.

The component exposes methods (via a controller object returned from `createChatSession()` or bindable on the component):

```ts
pushContext(entry: Omit<ContextEntry, 'id'>): string  // returns id
clearContext(source?: ContextEntry['source']): void
getContext(): ContextEntry[]
```

A **Memory badge** in the header shows the count of active context entries. Clicking opens a small panel listing them with the ability to disable/remove individual entries (for debugging and transparency).

---

## Memory

### Session Memory (v1)

The full `ChatSession` object is the persistence unit. The component fires:

```ts
onSessionUpdate(session: ChatSession): void | Promise<void>
```

…after each message exchange (debounced ~500ms). Parent app persists to its own backend (MySQL/GraphQL/etc.).

Loading prior sessions:
```ts
loadSession(sessionId: string): Promise<ChatSession>
listSessions(): Promise<SessionSummary[]>
```

The component renders a "History" button in the header that opens a list of past sessions when `listSessions` is provided.

### Long-Term Memory (v2)

The `memoryHints: string[]` field on `ChatSession` is included in the assembled system prompt. v1 leaves this empty; v2 will populate it from parent-supplied retrieval.

**Design intel captured during brainstorming:** the target use case is **task-typed memory** — users have preferred formats/tones for specific summary types (inventory item summaries, work order summaries). Likely v2 data shape:

```ts
type MemoryHint = {
  taskType: string         // 'inventory_summary' | 'work_order_summary' | ...
  preferences: string      // free-form text describing the preference
  examples?: string[]      // exemplar outputs the user has approved
}
```

Plus a v2 callback:
```ts
onMemoryCandidate(text: string, context: { taskType?: string }): void
```

Fired when the model indicates something might be worth remembering. The parent app decides whether to persist.

---

## Multimodal Input

**v1 support:**
- **Images** (png, jpg, webp, gif) — sent as attachments, rendered as thumbnails in the user's message bubble
- **PDFs** — sent as attachments; both Claude and OpenAI handle these natively
- **Text/code files** (.txt, .md, .csv, common code extensions) — content embedded inline in the user's message as a code block

**v2:** audio, video.

**Implementation:** all uploads are base64-encoded inline within the message payload for v1 simplicity. If file size becomes a problem in practice, the `/api/ai-chat/upload` endpoint exists as a placeholder for moving to multipart upload + reference-by-URL.

---

## Artifact Rendering (v1)

All content blocks render inline in the message stream:

| Block type   | v1 rendering |
|--------------|--------------|
| `text`       | Markdown (with sanitization) |
| `code`       | Syntax-highlighted code block, copy button |
| `image`      | `<img>` element, click to enlarge |
| `html`       | Sandboxed `<iframe>` with `sandbox="allow-scripts"`, content via `srcdoc`. **No** `allow-same-origin` — defeats sandboxing when combined with `allow-scripts`. |
| `chart`      | Vega-Lite rendered chart (chosen for spec portability to v2 panel view) |
| `tool_call`  | Collapsed indicator: `"Called `name`"`; expandable to show args and result JSON |

**v2 additions:** side-panel layout, artifact selection, artifact version history within a conversation, full-screen mode.

**The v2-readiness guarantee** is structural: every block has a stable ID, blocks are typed unions, and the message renderer is pure (`blocks → DOM`). v2 wraps the same renderer in a layout that adds a panel slot.

---

## Persistence Callbacks (Parent App Integration)

The library is backend-agnostic. The parent app implements:

```ts
type StorageCallbacks = {
  onSessionUpdate?: (session: ChatSession) => void | Promise<void>
  loadSession?:     (sessionId: string) => Promise<ChatSession>
  listSessions?:    () => Promise<SessionSummary[]>
  deleteSession?:   (sessionId: string) => Promise<void>
}
```

All callbacks are optional. With none provided, the component works as an ephemeral chat (no persistence, no history). With them provided, full session management is available.

---

## Styling

**Approach:** stock Bootstrap 5 utility classes used directly in the markup. No custom BEM, no namespaced classes, no shipped theme.

**Examples:**
- Container: `class="d-flex flex-column h-100"`
- Header: `class="d-flex justify-content-between align-items-center p-2 border-bottom"`
- Message list: `class="flex-grow-1 overflow-auto p-3"`
- Composer: `class="border-top p-2"` with `form-control`, `btn`, etc.
- Theme-aware backgrounds: `bg-body-secondary` / `bg-body-tertiary` (respect parent's BS theme; don't use `bg-light` which is hardcoded)

**Configurable style props** using a locally-defined `ButtonClasses` type (mirroring the company utility, but defined inside the library to avoid coupling):

```ts
type Colors = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark'
type ButtonColors = Colors | 'link'
type ButtonClasses = `btn-${ButtonColors}` | `btn-outline-${Colors}`
```

Component props expose styling decisions parent apps will want to customize:
- `sendButtonStyle: ButtonClasses` — default `'btn-primary'`
- `attachButtonStyle: ButtonClasses` — default `'btn-outline-secondary'`
- `userMessageBgClass: string` — default `'bg-body-secondary'`
- `assistantMessageBgClass: string` — default `'bg-body-tertiary'`

**Minimal scoped CSS** in the component for things Bootstrap doesn't cover: message bubble max-width, streaming cursor animation, attachment chip wrapping, autoscroll smoothness.

**Bootstrap 5 only** in v1. Multi-version compatibility deferred.

---

## Testing

- **Vitest** — unit tests for provider abstraction, message/block parser, context merger, prompt assembler
- **Playwright component tests** — chat UI behaviors (typing, send, streaming, attachment add/remove, provider switch modal, history open)
- **Mock the Vercel AI SDK at its boundary** — no real API calls in CI
- **Demo app contains opt-in smoke tests** that hit real APIs (env-gated, run manually) — useful for catching provider regressions

---

## Open Future Work (Captured for v2+)

- Side-panel artifact view with selection and history
- Long-term memory implementation, keyed to task type
- Audio/video multimodal input
- Multi-MCP-server UI with per-tool toggles
- Bootstrap 4 compatibility (if needed)
- Server-side credential storage pluggable beyond env vars
- Streaming-aware block parser (parse blocks as they arrive, not only on completion)
- Cost/token usage reporting in the UI

---

## Decision Log

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Repo structure | Monorepo, pnpm workspaces, packages/ + apps/ | Matches end goal of reusable package; demo app provides realistic sandbox |
| API key handling (v1) | Env vars only | Simplest; abstracted server-side so runtime keys are easy to add later |
| Parent integration | Callback/event based | Backend-agnostic; matches user's existing pattern |
| Context injection | Static baseline + dynamic per-route + manual | Flexible without overcomplication |
| Message storage shape | Typed content blocks with stable IDs | Enables v2 side-panel artifacts without rewrite |
| Provider switch mid-chat | Confirm modal: continue / new / cancel | User-friendly, avoids surprises |
| MCP scope v1 | One configurable server | Useful, not over-scoped |
| Long-term memory v1 | Slot in data model, no implementation | Defers complex work without painting into a corner |
| Multimodal v1 | Images, PDFs, text/code files; base64 inline | Covers core use cases; upload endpoint deferred |
| Artifact rendering v1 | Inline only, sandboxed iframe for HTML | Ship faster; v2 adds panel layout |
| Chart library | Vega-Lite | Spec portability to future panel view |
| Styling | Stock BS5 utilities, BS5-only | Matches company conventions; team is mid-migration to BS5 |
