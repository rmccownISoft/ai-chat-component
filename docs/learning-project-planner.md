---
name: learning-project-planner
description: >-
  Build and run learning-oriented project plans where the user does the coding
  themselves and Claude only plans, one phase at a time. Use this skill whenever
  the user wants a plan for a new project they intend to learn from, or says
  things like "help me plan a project I'm going to build and learn from",
  "set up a learning plan", "expand phase N", "flesh out the next phase", or
  "close out phase N". Use it even when the user just describes a project they
  want to learn to build and asks how to start — do NOT write the whole plan or
  the code for them; follow the one-phase-at-a-time rituals below.
---

# Learning Project Planner

## What this skill is for

The user is building a project to **learn** a language, library, or feature.
They write the code. Claude only produces the plan — and deliberately produces
it a little at a time, because the failure this skill exists to prevent is
**planning drift**: when a whole multi-phase plan is written in one pass, later
phases get vaguer, doc-checking peters out, Claude starts guessing at APIs, and
any mid-project correction fails to propagate forward.

The fix is structural, not stylistic: **never plan more than one phase ahead.**
Each phase is expanded in its own fresh pass, right before the user does it, so
docs get checked every time and there is no stale downstream to rot.

The user has ADHD. Verbosity and unexplained jargon make plans unusable for
them. Terseness and plain language are not a nicety here; they are the point.

## The four files (and nothing else)

A project using this skill contains exactly four kinds of file. This is a
closed list — enforcing it is what stops "extra docs" from accumulating.

0. **`design-spec.md`** — the north star. What we set out to build and why:
   overview, architecture, data model, goals, and **non-goals**. Written once
   during setup and approved by the user before any planning. Changes rarely
   (only on a deliberate scope change). This is what lets anyone — including a
   cold session — understand the _project_, which a skeleton of one-line phase
   goals cannot convey.
1. **`skeleton.md`** — the dashboard. A one-line goal per phase, each with a
   status marker and (once generated) a link to its phase doc. Derived FROM the
   design spec. This is the user's map of where they are. It changes a little
   every session.
2. **`decisions-log.md`** — ground truth for what _changed_. The record of
   amendments and gotchas discovered while building. It grows in bursts at
   close-out. Its `Active` section is authoritative: if a plan step ever
   contradicts it, that is an error. **When the log and the design spec
   conflict, the log wins** — the spec was the plan, the log is reality.
3. **`phase-NN-shortname.md`** — the actual work for one phase. Created on
   demand, one at a time. Once a phase is done, its doc is **frozen** — never
   edited again, so the past cannot rot.

The user only ever interacts with two of these: `skeleton.md` (where am I) and
the current phase doc (what do I do). The spec and log are Claude's reference.

## Standing rules (always in force)

- **The log's `Active` section is ground truth.** Before writing any plan
  content, read it. If something you are about to write contradicts it, STOP
  and tell the user instead of writing it.
- **Only the four file types above may exist.** Anything else created during
  work gets folded into a phase doc or deleted at close-out.
- **Never edit a completed phase doc.** Carry-forward information goes to the
  log, not backward into frozen docs. Your instinct will be to helpfully update
  an old doc — don't.
- **Never expand more than one phase ahead.** Unexpanded phases stay as
  one-line goals in the skeleton until the user reaches them.

---

## Operation: SET UP a new project

Trigger: the user wants a plan for a new learning project.

1. **Interview.** Ask what they're building, what they want to _learn_ from it
   (the learning goal often drives the phase breakdown), rough scope, and
   constraints (language, libraries, platform). Keep it focused.
2. **Write `design-spec.md` and get approval.** Summarize the project back as a
   spec: overview, architecture (as understood so far), data model if relevant,
   goals, and **non-goals** (what's explicitly out of scope / deferred — these
   prevent scope creep later). Show it to the user and revise until they approve
   it. Do NOT proceed to the skeleton until the spec is approved — the skeleton
   is derived from it. This step is planning, not coding, so writing it for the
   user is appropriate; the user still writes all the code later.
3. **Derive `skeleton.md`** from the approved spec:
   - A **"For Claude" bootstrap block** at the very top (see template) — mandatory.
   - A short **"How this works"** block for the user (see template).
   - A **phase list**: one line per phase, each a plain-language goal, each with
     a `[ ] not started` marker. Phases should each break into sub-30-minute
     steps once expanded. Do NOT expand any phase yet — goals only.
4. **Write an empty `decisions-log.md`** with `Active` and `History` sections.
5. Stop. Tell the user how to start their first phase ("say: expand phase 1").
   Do not expand anything during setup.

### `skeleton.md` template

```markdown
# [Project name] — plan

<!-- ===== FOR CLAUDE: read this first if you're a fresh session ===== -->

> **Claude, start here.** This project uses the `learning-project-planner` skill —
> apply it. Before doing anything else:
>
> 1. Read `design-spec.md` for what this project is and its non-goals.
> 2. Read `decisions-log.md`. Its **Active** section is ground truth; never write
>    a step that contradicts it. If it conflicts with the spec, the log wins.
> 3. The current phase is the one marked `[~] in progress` below; its linked doc
>    is where work stands.
> 4. To expand the next phase or close out the current one, follow the skill's
>    procedures. Never expand more than one phase ahead. Never edit completed docs.
>    If the skill isn't loaded, ask the user to enable it.

<!-- ================================================================= -->

## How this works

- You touch two files: this skeleton (where you are) and the current phase doc.
- Start a phase: say "expand phase N".
- When a phase actually works and you're moving on: say "close out phase N".
- Only one phase is ever expanded at a time. That's on purpose.

## Phases

- [ ] not started — Phase 1: <one-line goal>
- [ ] not started — Phase 2: <one-line goal>
- [ ] not started — Phase 3: <one-line goal>
      ...
```

### `decisions-log.md` template

```markdown
# Decisions & gotchas

## Active (ground truth — read before planning anything)

<the rules, library choices, and gotchas currently in force. Empty at start.>

## History (why things changed — reference only)

<append-only reasoning. Empty at start.>
```

---

## Operation: EXPAND a phase

Trigger: "expand phase N" / "flesh out the next phase".

Do these in order:

1. **Read `design-spec.md`** for the overall goal, and the section(s) relevant
   to phase N. This is how you keep a phase aligned with the project's purpose
   and respect its non-goals.
2. **Read `decisions-log.md`.** Treat `Active` as ground truth. If any step you
   are about to write would contradict it, STOP and raise it. If the log and the
   spec conflict, the log wins.
3. **Read `skeleton.md`** for phase N's one-line goal. Expand **only** phase N.
4. **Apply the format rules** (below).
5. **Save as `phase-NN-shortname.md`** (zero-padded, e.g. `phase-03-window-setup.md`).
6. **Update `skeleton.md`**: change phase N's marker to `[~] in progress` and
   link the new doc. Touch nothing else in the skeleton.

If phase N turns out too big for sub-30-minute steps, split it (e.g. into 3a and
3b): update the skeleton's phase line into two lines, and produce the doc for the
first sub-phase only.

### Format rules (the whole point of the skill — follow exactly)

- **Numbered, checkable steps.** Each step in a phase is a numbered item
  beginning with a bold action phrase and a `[ ]` box, so the user can scan the
  numbers alone to see the whole flow, then drop into the detail under each. The
  bold phrase says what to DO ("Add two reactive variables"), never just names a
  concept ("$state"). The code snippet sits directly under that line.
- **Show, never name. This is the most important rule.** A step must never be a
  bare term, concept name, or CSS/class name — those are pointers to knowledge
  the user does not have yet, and they read as steps only to someone who already
  knows the answer. The user fails at abstractions and needs a concrete example
  as the _minimum_. So every step shows a small code snippet of the shape, with
  the meaningful part left blank for the user to fill in. "Use `$state`" is a
  failure; showing `let count = $state(0)` and saying "make two like this, one
  for X one for Y" is correct. If a step names a thing, it must also show that
  thing's shape in code. When trimming for length, cut connective prose — NEVER
  cut the snippet. The snippet is the step; the words around it are optional.
- **One screen per phase doc.** Terse _prose framing_ around concrete snippets —
  not walls of explanation, but not bare labels either. No essay-length
  "shape of the work" sections. The snippet carries the weight.
- **Steps are sub-30-minute.** Each step shows what it needs in code: the import
  line, the function call with its arguments, the element with its classes.
- **Plain-language jargon notes.** Any library, function, or concept term gets a
  3–5 word plain-English note in parentheses the _first_ time it appears — AND a
  code snippet showing it in use. The note alone is never enough; the user
  cannot act on a term they can only read a definition of.
- **No silent guessing.** Every step that names a real function or API must
  include a documentation link, or be tagged `UNVERIFIED`. A visible
  `UNVERIFIED` tag is a flag the user can act on; a confident wrong guess is not.
- **Every step ends with two fields:**
  - `Look up:` — the exact thing to search to learn this (kills "I don't even
    know what to google").
  - `Done when:` — one concrete, observable thing proving the step worked.

### Example of a well-formed step (numbered, show-don't-name)

Each numbered step opens with a bold _action_ and a checkbox, then shows the
code directly beneath. The user can read just the bold lines to see the flow.

````markdown
### 1.4 — Build the component shell · ~25 min

1. [ ] **Create the file** `src/lib/AIChat.svelte`.

2. [ ] **Add two reactive variables.** Svelte 5's `$state()` makes a variable
       update the screen — shape is `let count = $state(0)`.
   ```js
   let messages = $state(...);  // ← you: empty array
   let input = $state(...);     // ← you: empty string
   ```
````

Gotcha: must be `$state([])`, not `[]`, or the UI won't update.

3. [ ] **Render the list** — a `<div>` with Bootstrap classes and a loop:
   ```svelte
   <div class="flex-grow-1 overflow-auto p-3">
   	{#each messages as m}
   		<!-- ← you: show m.role and m.content -->
   	{/each}
   </div>
   ```

- Look up: `svelte 5 $state runes`
- Done when: typing appends a line to the list.

```

Contrast — the SAME items as bare labels are FAILURES the user cannot act on:
"2. Concept: `$state` rune  ·  3. outer `d-flex flex-column`". Each names a
thing without a code snippet and without an action verb.

---

## Operation: CLOSE OUT a phase

Trigger: **the user says** "close out phase N". This is user-invoked, never
decided by Claude — only the user knows the code actually works and they're
moving on. ("Phase authored" is not "phase done.")

Do exactly these, nothing extra:

1. **Mark done.** Flip phase N's marker in `skeleton.md` to `[x] done`. Change
   nothing else in the skeleton.
2. **Update the log — or explicitly don't.** If a rule, library, or approach
   changed, add it to `Active` and put the reasoning in `History`. **If nothing
   changed, write nothing** — inventing an entry to feel useful is exactly the
   noise the log must avoid.
3. **Carry forward.** Anything learned that affects *later* phases goes as a
   note into the log's `Active` section. Do NOT edit any future phase doc — the
   note waits there and gets picked up when that phase is expanded.
4. **Enforce the file whitelist.** Only `design-spec.md`, `skeleton.md`,
   `decisions-log.md`, and phase docs may exist. Anything else created this
   phase: fold into the phase doc or delete it.
5. **Freeze.** Do not edit this phase's doc, or any earlier completed one.

---

## Why the structure holds together (for the Claude running this)

The three failure modes this skill fights all trace to one cause — planning the
whole thing at once. Expand-on-demand removes the stale downstream. The design
spec holds the project's purpose and non-goals so no phase drifts from what's
actually being built. The log is the shared memory that keeps twelve
independently-expanded phases from diverging. The frozen-phase-doc rule means
corrections only ever move *forward* (via the log), never leave rot behind. And
the format rules exist because a plan the user can't read or can't act on is
worse than no plan — show real code, never bare terms. When in doubt, favor
terseness and plain language over completeness.
```
