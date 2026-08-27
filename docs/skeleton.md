# AI Chat Component — plan

<!-- ===== FOR CLAUDE: read this first if you're a fresh session ===== -->

> **Claude, start here.** This project uses the `learning-project-planner` skill —
> apply it. Before doing anything else:
>
> 1. Read `2026-05-30-ai-chat-component-design.md` — the design spec — for what
>    this project is, its architecture, and its non-goals.
> 2. Read `decisions-log.md`. Its **Active** section is ground truth; never write
>    a step that contradicts it. If it conflicts with the spec, the log wins
>    (e.g. the spec says "monorepo"; the log corrects that to a single library
>    project — the log is right).
> 3. The current phase is the one marked `[~] in progress` below. Its phase doc
>    (linked on that line) is where work stands.
> 4. To expand the next phase, or close out the current one, follow the skill's
>    procedures. Do NOT expand more than one phase ahead. Do NOT edit completed
>    phase docs.
>    If the skill isn't loaded, ask the user to enable it.

<!-- ================================================================= -->

## How this works

- You touch two files: this skeleton (where you are) and the current phase doc.
- Start a phase: say "expand phase N".
- When a phase actually works and you're moving on: say "close out phase N".
- Only one phase is ever expanded at a time. That's on purpose.

## Phases

- [x] done — Phase 0: Foundation — working library project + demo playground + Bootstrap + env keys
- [x] done — Phase 1: First Conversation — end-to-end streaming chat with Claude
- [~] in progress — Phase 2a: Provider Registry — OpenAI added, provider+model chosen per-request, both stream end-to-end → phase-02a-provider-registry.md
- [ ] not started — Phase 2b: Provider UI — provider/model dropdowns, mid-chat switch confirm modal
- [x] done — Phase 2c: Host-portable server — split the SvelteKit-only handler into a neutral core + SvelteKit/Express adapters; endpoint is now a prop. Done ahead of 2a/2b as a spike; see → phase-02c-host-portable-server.md
- [ ] not started — Phase 3: Typed Content Blocks — string messages → typed blocks with stable IDs
- [ ] not started — Phase 4: Context Injection — baseline + route + manual context, prompt assembly, memory badge
- [ ] not started — Phase 5: Session Persistence — save/load/list via parent callbacks, history UI
- [ ] not started — Phase 6: Multimodal Input — image, PDF, text/code attachments
- [ ] not started — Phase 7: Rich Block Rendering — image, sandboxed HTML, Vega-Lite chart, tool-call blocks
- [ ] not started — Phase 8: MCP Support — connect one configured MCP server, pass tools to streamText
- [ ] not started — Phase 9: Styling Polish — style props, theming, streaming cursor, autoscroll
- [ ] not started — Phase 10: Testing Infrastructure — Vitest + Playwright, first tests, smoke tests
