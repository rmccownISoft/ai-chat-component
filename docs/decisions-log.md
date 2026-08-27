# Decisions & gotchas

## Active (ground truth — read before planning anything)

- **Convention for superseding a decision (do this every time).** When something here or in the
  spec/phase docs becomes wrong, **do not silently diverge** — that's what causes bad plan
  expansion. Instead: (1) update/add the Active bullet here so this log is the current truth, and
  (2) leave a one-line `⚠️ Superseded (Phase N) — see decisions-log Active` marker **at the exact
  stale spot** in the spec/plan, keeping the original text as historical record. The contradiction
  must be visible from *either* doc, not just this one. Examples in place: [design spec line 25 and
  the Repository Structure note](2026-05-30-ai-chat-component-design.md);
  [phase-02a top note](phase-02a-provider-registry.md).

- **Single library project, NOT a monorepo.** Built with the `@sveltejs/package`
  template. Paths: library = `src/lib/`, server = `src/lib/server/`, demo app =
  `src/routes/`, env files at repo root. Run with plain `pnpm dev`. Ignore any
  monorepo / `packages/` / `apps/` / `workspace:*` phrasing from the old tickets.
  (The `@sveltejs/package` build tooling is unchanged and fine — it's how we
  develop the library. That is separate from what *hosts* the component; see next.)

- **Server is host-portable: neutral core + thin adapters (as of Phase 2c).**
  The streaming logic lives in `src/lib/server/core.ts` — `createChatStream({ apiKey })`
  turns `messages` into a UI-message stream with **no host imports**. Two adapters wrap it:
  `src/lib/server/sveltekit.ts` (`createStreamHandler`, returns a Web `Response`) and
  `src/lib/server/express.ts` (`createExpressHandler`, pipes into a Node `res`). Package
  exports: `./server` (core), `./server/sveltekit`, `./server/express`.
  - **Consumption target is BOTH stacks.** Most company web apps are Svelte + Express +
    `abstract-state-router`; only a few are SvelteKit. This supersedes the design spec's
    "reusable across multiple internal SvelteKit apps" (spec line 25) — read it as
    "reusable across Express+ASR **and** SvelteKit hosts."
  - **Planning rule:** the old single `src/lib/server/index.ts` is **gone**. Never write a
    step that edits it or assumes a SvelteKit `RequestHandler` is the only server shape.
    Host-neutral logic (provider selection, `streamText`) goes in `core.ts`; anything that
    reads the HTTP request or writes the response goes in the per-host adapter.

- **AI SDK is v5-shaped.** Confirmed against installed versions:
  - Client uses the `Chat` class from `@ai-sdk/svelte` — there is NO `useChat`.
  - Component keeps its own `$state` input; call `chat.sendMessage({ text })`.
  - Both server hosts build the stream the same way — `toUIMessageStream({ stream: result.stream })`
    (from `ai`) — then **emit it differently per host**:
    - SvelteKit/fetch host (`sveltekit.ts`): `createUIMessageStreamResponse({ stream })` → Web `Response`.
    - Express/Node host (`express.ts`): `pipeUIMessageStreamToResponse({ response: res, stream })` → writes the Node `res`.
    NOT `result.toUIMessageStreamResponse()` — that helper is `@deprecated` in v7. Also NOT `toDataStreamResponse`.
  - Wrap incoming messages with `convertToModelMessages(messages)` before `streamText`.
  - Provider adapters: use `createAnthropic({ apiKey })` / `createOpenAI({ apiKey })`,
    not the bare `anthropic` export (which ignores your key and reads env only).
  - The SDK moves fast — treat any named method as "verify against installed version."

- **Env / keys:** env vars only in v1, server-side. Keys never sent to the client. The server
  **core takes `apiKey` as a config arg** — it does not read env itself, so each host supplies the
  key its own way: SvelteKit via `$env/static/private`, Express via `process.env`. Don't write a plan
  that assumes `$env/static/private` is the only source — that's just the SvelteKit adapter's choice.

- **Styling:** stock Bootstrap 5 utility classes in markup, BS5 only. Use
  `bg-body-secondary` / `bg-body-tertiary`, not `bg-light`.

- **Architecture invariant:** every `ContentBlock` gets a stable `id`. Needed so
  v2's side-panel can reference blocks. Cheap now, painful to add later.

## History (why things changed — reference only)

- Phase 0 close-out: project was planned as a pnpm monorepo but built as a single
  library project. Original tickets kept a monorepo→library translation table as a
  patch; that patch is retired — this log is now the source of truth for paths.
- Phase 1: old tickets were written against a pre-v5 AI SDK and guessed the API
  (`useChat`, `toDataStreamResponse`, raw messages). Corrected against the installed
  v5 packages during 1.5; corrections recorded in Active above so later phases inherit
  them instead of repeating the old guesses.
- Phase 1 close-out: the Active streaming line said `result.toUIMessageStreamResponse()`,
  but the shipped handler (`src/lib/server/index.ts`) uses
  `createUIMessageStreamResponse` + `toUIMessageStream` because the one-liner is
  `@deprecated` in the installed `ai@7.0.77`. Fixed Active to match the real code so
  Phase 2's OpenAI handler copies the correct pattern.
- Phase 2c (done ahead of finishing 2a): a "can we drop this into pro-web?" spike revealed
  that most target apps are Svelte + Express + `abstract-state-router`, not SvelteKit — the
  design spec had assumed SvelteKit consumers. Refactored the SvelteKit-only
  `src/lib/server/index.ts` into a host-neutral `core.ts` plus `sveltekit.ts` / `express.ts`
  adapters, and made the client endpoint an `api` prop. Both paths verified streaming a real
  reply (the SvelteKit demo route + a Node/Express smoke test). Recorded in Active so the 2a/2b
  provider-registry work targets `core.ts`, not the deleted file. See
  [phase-02c-host-portable-server.md](phase-02c-host-portable-server.md).
