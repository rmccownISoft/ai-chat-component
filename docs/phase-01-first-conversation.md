# Phase 1 — First Conversation with Claude

**Goal:** Type a message, watch Claude stream a reply into a component you built.

**From the log (ground truth):** `Chat` class (no `useChat`) · `createAnthropic({apiKey})` · `convertToModelMessages` · `toUIMessageStreamResponse` · paths are `src/lib` + `src/routes`.

---

- [x] **1.1 — Install AI SDK** — `pnpm add ai @ai-sdk/anthropic @ai-sdk/svelte`
- [x] **1.2 — `createStreamHandler` factory** in `src/lib/server/`
- [x] **1.3 — Mount the route** at `src/routes/api/ai-chat/stream/+server.ts`

---

### 1.4 — Build the `<AIChat />` shell · folded into 1.5

**Status: done (collapsed into 1.5).** This was originally a throwaway step — build a fake shell with a local `messages = $state([])` array and manual `.push()`, then rip it out in 1.5. The actual build skipped the fake stage and went straight to the real `Chat` object, so 1.4's separate deliverable never shipped. Its end state *is* the 1.5 code below. See [AIChat.svelte](../src/lib/AIChat.svelte).

---

### 1.5 — Wire it to the streaming route (the magic moment) · ~25 min

1. [x] **Server: read the real messages.** Edit your 1.2 handler — replace the hardcoded prompt:
   ```js
   const { messages } = await event.request.json();
   const result = streamText({
     model: anthropic('claude-sonnet-5'),
     messages: await convertToModelMessages(messages),  // ← async in v7, must await
   });
   // Non-deprecated form (result.toUIMessageStreamResponse() is @deprecated in v7):
   return createUIMessageStreamResponse({
     stream: toUIMessageStream({ stream: result.stream }),  // ← result.stream, NOT fullStream (deprecated)
   });
   ```
   `convertToModelMessages`, `createUIMessageStreamResponse`, `toUIMessageStream` are from `ai`. Doc: https://ai-sdk.dev/docs/reference/ai-sdk-core/convert-to-model-messages

2. [x] **Component: create the `Chat` object.**
   ```svelte
   <script lang="ts">
     import { Chat } from '@ai-sdk/svelte';
     import { DefaultChatTransport } from 'ai';

     const chat = new Chat({
       transport: new DefaultChatTransport({ api: '/api/ai-chat/stream' }),
     });
     let input = $state('');
   </script>
   ```
   Gotcha: no `transport` → it defaults to `/api/chat` (wrong URL) and nothing streams.

3. [x] **Rewrite `send`** to hand off to the chat object:
   ```js
   function send() {
     chat.sendMessage({ text: input });  // ← then clear input
   }
   ```

4. [x] **Render `chat.messages`.**
   ```svelte
   {#each chat.messages as m}
     <!-- a message has m.parts (array), NOT m.content -->
   {/each}
   ```
   Gotcha: shape is `parts` — an array of typed pieces. Text part = `{ type: 'text', text: string }`.

- Look up: `ai-sdk svelte Chat DefaultChatTransport`
- **Done when:** you type, hit Send, and Claude streams a reply into the list character by character. ✅ implemented & type-checked against `ai@7.0.77`; verify by running the app.

---

**Phase 1 done when:** a real streamed Claude reply appears in your component.

**Close-out reminder:** confirm the `sendMessage` arg and the `parts` shape against your installed version — if anything differs from the log, update the log's Active section so Phase 2 inherits it.
