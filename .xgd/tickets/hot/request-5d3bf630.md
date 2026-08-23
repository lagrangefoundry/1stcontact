---
uid: request-5d3bf630
id: REQ-131
type: request
title: Draft change journal — let the AI know what changed without re-reading the
  site
created_by: xgd
created_at: '2026-08-11T22:46:46.266235+00:00'
updated_at: '2026-08-20T12:50:27.939837+00:00'
completed_at: '2026-08-20T12:50:27.939837+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 28272e3222ba5dc3d2057167a246c5154ab51c79
    reconcile_sha: null
    main_sha: null
    working_sha_history:
    - ceed377a03fb9f1c1bf084dd224d70cb58d6110f
  version: 0.1.45
  story_points: 5
  bundled_in: bundle-77b28def
  chat_comment: comment-624d5069
---

# Draft change journal — let the AI know what changed without re-reading the site

## Problem

The page editor ([[DOC-28]]) lets the client change copy, images and — as its phases land —
friendly parameters, directly on the draft, at any time, including between AI turns. That freedom
is valuable and free. It also means **the AI's picture of the page is stale by default**, and today
it has no cheap way to find out.

The failure is specific and severe: the AI writes a section, the client rewords it, and the AI
later "improves" that section and silently reverts them. A client who loses their own edit to the
thing they are paying to help them does not report it as a bug — they stop touching the editor, and
the cheapest channel in the product goes dark.

The only correct behaviour available today is to re-read the page before acting. [[DOC-28]] §6.3
measured a real page at 73 segments, 62 of them copy. Doing that defensively on every turn of a
4–5 hour session is not affordable ([[DOC-33]] §4), so in practice it will not be done, and the
silent-revert will happen.

**`status` does not answer this.** It reports the draft against the last *published* revision:
file-level `added`/`modified`/`removed` paths. No ordering, no actor, no before/after, no notion of
"since I last looked". Different question.

**Nothing versions the draft.** [[DOC-12]] revisions are publish-time snapshots and `history.json`
gets one entry per publish. Between publishes the draft is an unversioned mutable working copy.

## Why this is cheap to build

Two things are already true:

- **`edit.ts` is the single write path** for the CLI, the AI and the page editor ([[DOC-30]]) —
  one chokepoint to instrument.
- **The editor emits the same structured, validated diff vocabulary the AI emits** ([[DOC-28]] §4)
  — so this persists something that already flows through that chokepoint rather than inventing a
  representation.

## Behaviour

Three questions, answerable at three costs:

| Question | Should cost | Answered by |
|---|---|---|
| Has anything changed since I last looked? | ~nothing, no tool call | pushed in the per-turn reminder |
| What changed? | proportional to *the change* | one tool call, returning the journal slice |
| What is the page now? | proportional to *the page* | existing reads — fallback only |

### Part 1 — business logic and API (`edit.ts` and the draft store)

- Every mutating `edit*` operation appends a **journal record** and increments a **monotone draft
  counter**, transactionally with the write it describes. A refused write appends nothing (writes
  are already all-or-nothing).
- Every mutating operation **returns the resulting counter**. This is what makes a caller's baseline
  advance as it writes, so any gap between its baseline and current is by construction *someone
  else's* work — no actor filtering needed on the read side.
- A read function returns **the journal since a given counter**, plus the current counter and a
  `truncated` flag.
- A journal record carries: the counter it produced, the actor (`ai` | `client` | `cli`), a
  timestamp, the operation, its target, and enough self-describing content to be read without
  resolving anything — **for copy, the before and after text** (bounded; long bodies truncated),
  and the segment's human-readable label.

**Records must be self-describing, because addresses are not durable.** L1 addresses are
render-scoped by design ([[DOC-28]] §5.2) — a path of child indices valid only for the render that
produced them. A record saying `set_l1 at 0.2.1` is worthless once structure has moved. The
human-readable label comes from the same derived segment model the editor already uses for its
outlines (`pageSegments`).

**This is not a revision.** No revision id, no `history.json` entry, no participation in
publish/checkout. [[DOC-12]] principle 3 is forward-only and immutable; §5.1's preview snapshots
are the standing precedent for an artifact that is deliberately not a revision.

**Bounded, degrading gracefully.** The journal keeps a window (size to be pinned below). A baseline
older than the window returns `truncated: true` and the caller falls back to a full read. No
correctness cliff, and the journal stays small.

### Part 2 — surface and toolbox

- **New read operation** in `l1-surface.json` — *"see what has changed on the site since you last
  looked, and who changed it"* — with a new `shape` for the journal slice, bound in
  `l1Operations`, and placed in the **`ReadSite`** group (already granted to `caretaker` in
  `instances.json`, so no grant change is needed).
- **`returns.provenance: "untrusted"`** — the journal carries client-typed copy and is squarely the
  injection vector [[DOC-30]] S5 names. It must not be marked otherwise.
- **The `change` and `publish_result` shapes gain the resulting counter**, so a caller's baseline
  advances on its own writes without a second call.
- **The `overview` gains one paragraph**: the site can change under you between turns, here is how
  you find out. This is a cross-cutting rule and belongs there rather than repeated per-operation
  ([[DOC-30]]'s stated reason for having an overview at all).
- **A `sequences` entry** — signal → read the changes → act.
- **The `absences` entry on undo** should be revisited: it currently instructs the AI to *"tell the
  user what the previous value was whenever you change something"*, which the journal makes
  unnecessary to carry in the conversation. Adjust the note; do **not** add undo — out of scope.

### Part 3 — the push signal (`roles.ts` / `host.ts`)

`caretakerReminder()` is re-applied every turn through the system channel and never enters the
transcript. The host knows turn boundaries.

- The host records the draft counter at the end of each turn and compares at the start of the next.
- When they differ, the reminder carries a short line saying the site changed and how many edits
  landed.

This is the whole point of the design: in the common case (nothing changed) it costs nothing and
the AI makes no call at all. The tool is pulled only when the signal fires, and the AI never has to
remember a baseline.

*(Note: a counter is deliberately a value the host may hold across turns, unlike an address. It is
safe precisely because staleness is detectable rather than silent — the opposite of the addressing
rule in the overview.)*

## Acceptance criteria

1. A mutating operation returns a draft counter greater than the one before it; a refused write
   does not advance it and appends no record.
2. Asking for changes since the current counter returns an empty slice — this is the cheap
   "nothing happened" answer.
3. After a client-side copy edit, asking for changes since a prior counter returns a record naming
   the page, a human-readable label for what changed, and the before and after text.
4. A caller that only makes its own edits and reads the counter back from each one never sees its
   own edits reported as changes.
5. A baseline older than the retained window returns `truncated: true` alongside whatever records
   remain.
6. Records survive a structural change that invalidates the address they were recorded against —
   the before/after text and label remain readable.
7. The new operation is projected into the manual for a session granted `ReadSite`, and absent from
   one that is not.
8. The journal slice is marked untrusted in the projected surface.
9. A session whose site changed between turns receives the signal in its reminder; one whose site
   did not, does not.

## Decisions to pin during implementation

- **Where the journal lives.** `storage/sites/<slug>/draft/` is git-tracked ([[DOC-12]] §3.1), and a
  journal of every copy edit would churn it badly. A gitignored sibling is the alternative — the
  journal is ephemeral, windowed, and losing it degrades to a full read rather than to
  incorrectness. Lean gitignored; decide explicitly and record the reason.
- **Window size.** Records, age, or since-last-publish. Wants to be large enough that a normal
  session never truncates.
- **Actor attribution.** How the write path learns whether a call came from the editor, the AI or
  the CLI. If it cannot be known cleanly today, the counter mechanism still works without it
  (AC 4 does not depend on the actor field) — so ship without it rather than blocking.
- **Whether the counter is per-site or per-page.** Per-site is simpler and matches "has anything
  changed"; per-page would let the AI ignore changes to pages it is not working on. Lean per-site
  for v1.

## Explicitly out of scope

- **Undo.** The journal makes it *thinkable* and that is not a reason to build it here.
- **Any change to the revisions model.** [[DOC-12]] is untouched by this.
- **Surfacing the journal to the client** in the builder UI. [[DOC-28]] names a revision-diff
  display mode as a peer panel; that is its own piece of work.
- **Divergence detection against the ledger** ([[DOC-33]] §7.9) — this ticket makes it cheap; it
  does not implement it.

## Context

Designed in [[CHAT-21]]. [[DOC-33]] §7.9 states the requirement and §13 carries the sketch this
ticket is drawn from; it is the largest gap between what that playbook assumes and what the
platform provides.


---

## As built

Landed in one commit, `ceed377a03f` (v0.1.45). Nothing in the design above changed;
this section records the decisions the spec left open, and one thing the spec did not
anticipate.

### The four decisions, pinned

**Where the journal lives — gitignored, beside the site.** `storage/sites/<slug>/.journal.json`,
next to `.draft-base.json` at the site root and never inside `draft/`, so it can neither be
captured by a publish snapshot nor perturb byte-identity. Gitignored, as the spec leaned:
a record of every copy edit would churn the tracked tree on every keystroke-settle, and
nothing depends on it surviving a clone — a missing journal degrades a reader to a full
re-read, which is the same fallback an over-old baseline already takes. Correctness never
depends on the journal existing, which is also why a malformed file reads as empty rather
than throwing: a corrupt journal must degrade to "I cannot tell you what changed" and
never to "your edit failed".

**Window — 500 records, 300 characters per text value.** Sized so a whole consultation
session never truncates in practice: the measured page carries 73 segments, so 500 is
several complete rewrites of a page plus everything else a session does. Truncation is
graceful degradation, so the number is chosen to make it rare rather than impossible.

**Actor attribution — shipped, via `GlobalOptions.actor`.** It turned out to be knowable
cleanly: the two callers that are not a person at a terminal each set it where they
construct their options — the AI host (`actor: 'ai'`) and the builder's own palette and
segment routes (`actor: 'client'`) — and the default is `cli`, which is what an
unattributed caller genuinely is. Nothing about *detecting* a change depends on it, so a
caller that forgets it produces a less informative record and never a wrong answer.

**Counter grain — per-site.** As the spec leaned.

### One thing the spec did not anticipate

The spec says "the `change` and `publish_result` shapes gain the resulting counter". Two
write operations answer with neither: `add_asset` and `write_image` return the asset they
wrote. Omitting the count there would have been defensible on shape grounds and wrong on
behaviour grounds — a session whose last write was an upload would hold a baseline that
never advanced, and would be told next turn that its own upload was somebody else's work.
That is exactly the false alarm the counter exists to make impossible, so the rule is
*every* write hands the count back regardless of the shape of its answer. The `image`,
`asset` and `palette_change` shapes were widened to declare it, because a returned field
the manual never mentions is a field the model will not use.

### Notable implementation points

- **`edit.ts` records at the return of a mutating command, never before the write.** That
  is what makes "a refused write appends nothing" true without a transaction: every write
  validates the whole resulting definition and throws on refusal, so reaching the journal
  call means the bytes have landed. A record's `summary` is the command's own `human`
  line rather than a second sentence, so a change reads the same way to the person who
  made it and to whoever finds it later.
- **A no-op advances nothing.** A copy save that changes no field, and a dry-run gap fix,
  return the current count without appending — otherwise every no-op save from the modal
  would look, to the assistant, exactly like the operator rewriting a heading.
- **The push signal needed no upstream change.** `SessionManager` reads `role.reminder` at
  the top of every turn, so refreshing that string in `streamPrompt` is the whole delivery
  mechanism. The baseline is recorded *after* the turn, in a `finally`, so the assistant's
  own writes are absorbed rather than reported back to it, and an abandoned turn does not
  leave the baseline behind.
- **The page-segment walk moved** from `ai/toolbox.ts` to `cli/segments.ts`, so a journal
  record is labelled by the same derivation the editor uses for its outlines rather than
  by a second one that could disagree with it.
- **`1c changes <slug> [--since n]`** exposes the same journal to the operator. It is a
  different question from `status`, which compares the draft to the last *published*
  revision and knows nothing about ordering or about who did anything.

### Evidence

`tests/test_UAT_FC_REQ-131_change_journal.test.ts` — 13 UATs, all passing, covering all
nine acceptance criteria. Nothing stubs `edit.ts`, the store or the Toolbox; the AC-9 case
drives a real builder origin with a real session manager and a real tool loop, and the only
double in the file is the Anthropic client, which is the network.

Regression scope (20 files across the edit path, the tool surface, the render channels and
the builder routes) shows an identical failure set on this branch and on clean
`xgd-working` — 60 pre-existing failures from upstream making `Toolbox.run` async, which
those suites have not caught up with. This work adds 13 passing and breaks nothing.
Typecheck clean.