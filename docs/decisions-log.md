# Decisions & gotchas

## Active (ground truth — read before planning anything)

- **Single library project, NOT a monorepo.** Built with the `@sveltejs/package`
  template. Paths: library = `src/lib/`, server = `src/lib/server/`, demo app =
  `src/routes/`, env files at repo root. Run with plain `pnpm dev`. Ignore any
  monorepo / `packages/` / `apps/` / `workspace:*` phrasing from the old tickets.

- **AI SDK is v5-shaped.** Confirmed against installed versions:
  - Client uses the `Chat` class from `@ai-sdk/svelte` — there is NO `useChat`.
  - Component keeps its own `$state` input; call `chat.sendMessage({ text })`.
  - Server returns `result.toUIMessageStreamResponse()` (not `toDataStreamResponse`).
  - Wrap incoming messages with `convertToModelMessages(messages)` before `streamText`.
  - Provider adapters: use `createAnthropic({ apiKey })` / `createOpenAI({ apiKey })`,
    not the bare `anthropic` export (which ignores your key and reads env only).
  - The SDK moves fast — treat any named method as "verify against installed version."

- **Env / keys:** env vars only in v1, server-side via `$env/static/private`.
  Keys never sent to the client.

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
