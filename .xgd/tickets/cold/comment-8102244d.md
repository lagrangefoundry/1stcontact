---
uid: comment-8102244d
id: COMMENT-100
type: comment
title: Comment on request REQ-57
created_by: xgd
created_at: '2026-07-13T16:13:29.869911+00:00'
updated_at: '2026-07-13T17:48:35.967944+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-807a7b1d
  kind: chat_transcript
---

<!-- xgd-turn id="86505bd1-a85d-417e-801c-728cb458f51c-user" -->

<!-- xgd-chat role="user" ts="2026-07-13T16:13:26.196499+00:00" -->
#### You
Do you have enough information in this ticket to free code it?

<!-- xgd-turn id="86505bd1-a85d-417e-801c-728cb458f51c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T16:15:02.293564+00:00" -->
#### Claude
I'll do the legwork to answer this — let me look at the ticket, the REQ-54 foundation it builds on, and the current state of the code.

I have the ticket. Now let me examine the REQ-54 foundation — the actual code and tests it builds on.

Now the test file, especially the property-test generator that REQ-57 says to extend:

Let me check whether the schema/render/capture/diff stages actually exist (the ticket hedges "once the schema/render/capture stages exist"), and confirm REQ-54's merge state.

I've read the ticket, the REQ-54 foundation it builds on (`packages/framework/src/modules/text-markup.ts`, 493 lines), and the test suite (`tests/req54-styled-text-markup.test.ts`). Here's my honest assessment.

## Short answer

**Partly.** The ticket is well-specified for the scope that's actually reachable today (workstreams 1 & 2 — **model + notation**), and that's the right thing to free-code. But workstream 3 (schema/render/capture/diff) is **not actionable**, and there are **~3 design decisions** I'd want locked before writing code.

## What's clearly sufficient

The parts that extend the existing REQ-54 code are crisp:
- **Model** — concrete type shapes are given (`{ kind: "table", rows: Cell[][] }`, `{ kind: "code", language?, text }`, `{ kind: "heading", level, runs }`, rich-blockquote container, block-bearing list items). These slot straight into the existing `Block` union.
- **Notation** — fenced code, pipe/fenced tables, `#`…`######` headings, nested lists.
- **Tests** — the round-trip invariant `parse(serialize(x)) === normalize(x)` is already the lead test with a property-test generator to extend; UAT sketches follow the existing `test_UAT_FC_*` conventions.
- Clear "no dual-model" instruction: the rich blockquote container *replaces* the paragraph-level `blockquote` flag.

## What's not reachable (and the ticket admits it)

Workstream 3 hedges: *"once the schema/render/capture stages exist."* I confirmed **they don't** — `text-markup.ts` is a pure, standalone notation unit, exported but wired into no render/schema/capture/diff path. So the free-codeable scope is exactly model + notation, mirroring what REQ-54 itself did. Fine — but the AC list should drop the "capture/diff" clauses so we don't leave phantom criteria.

## Decisions I'd want before coding

1. **Table notation: pipe vs. fenced.** The ticket offers both. Pipe tables (`| a | b |`) are round-trip-hostile — escaping `|` in cell text, the `|---|` separator row, whitespace padding all threaten the losslessness invariant. I'd recommend the **explicit fenced form** for guaranteed round-trip. Real choice, worth your call.

2. **How `ListItem`/cell widen to hold blocks.** Today `ListItem` is `{ runs }`. Nested items and table cells need `{ blocks }`. Union (`{runs}｜{blocks}`) or always-`{blocks}`? "No dual-model" argues for one shape — but always-`blocks` is a breaking change to the existing REQ-54 list model + tests. Need to pick.

3. **Recursion is the real risk.** The current parser is *flat*: split on blank lines → classify each chunk. Nested list items, multi-paragraph blockquotes, and block-bearing table cells make the grammar **recursive**, which fundamentally reshapes `splitChunks`/`parseChunk`. This is the bulk of the work and the main place the round-trip invariant could break.

That last point also makes this **large** — five new kinds plus a recursive parser rewrite is easily 8–13 story points. It's cohesive (one module + one test file), so I'd keep it as one ticket, but we *could* split "flat" kinds (heading, code-block) from "recursive" kinds (tables, rich blockquote, nested items) if you want smaller landings.

Want me to (a) proceed on model + notation with **fenced tables + always-`blocks` items** as my default calls, or (b) settle those three decisions with you first? I haven't touched code or the ticket yet.

<!-- xgd-turn id="81a048be-556f-4ea7-919e-366f5bc2fc2a-user" -->

<!-- xgd-chat role="user" ts="2026-07-13T17:16:47.938044+00:00" -->
#### You
I think the grammar needs to be recursive - I am good with your calls on the others

<!-- xgd-turn id="81a048be-556f-4ea7-919e-366f5bc2fc2a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T17:37:20.021455+00:00" -->
#### Claude
Agreed — recursive grammar it is. Let me follow the free-coding protocol: scope the ticket first, then implement. Let me check the lifecycle mechanics and the spec before I touch the body.

Version bump is implemented. Let me read DOC-22 §4/§5/§8 — the notation contract and deferred backlog — since the recursive grammar design must honor it.

I now have the full spec (DOC-22 §4/§5/§8). I have everything I need. Let me set up tracking, then record the scope decisions on the ticket before coding.

I'll append a scope-decisions section (preserving the body) and set up task tracking.

Ticket scoped. Now let me create task tracking and begin the implementation.

Now let me check exactly which names are re-exported so I don't break the public surface, then write the new module.

I have the full picture. Now let me write the new recursive `text-markup.ts`. Marking tasks 1 & 2 in progress.

Now I'll write the new recursive `text-markup.ts`. This is the core of the work.

Now let me write the new module:

Now update the re-exports to include the new type names, and add the new types to both index files:

Now update the REQ-54 test to the widened model (item shape + blockquote container). Let me read it via the Read tool first.

Now the explicit REQ-54 assertions that reference the old shapes:

Let me run the REQ-54 test to confirm the refactor holds before adding REQ-57 tests.

node_modules is present. I'll invoke the vitest binary directly (avoiding any pnpm install side-effects).

REQ-54 passes with the widened model. Now the REQ-57 UATs plus an extended recursive property generator.

Two issues: (1) my blockquote test's expected string used the `*…*` shorthand but the serializer canonicalizes emphasis to the span form (REQ-54 behavior) — my expectation was wrong. (2) A real property-test failure in nested lists. Let me pin the exact failing seed.

Real bug found (seed 401): two adjacent same-type bullet lists inside a blockquote. The notation can't distinguish two adjacent same-type lists from one (blank line between items = same list) — exactly analogous to REQ-54's adjacent same-format runs. The principled fix: `normalize` must **merge adjacent same-type sibling lists** so the invariant `parse(serialize(x)) == normalize(x)` holds in general, and the generator must produce already-merged (normalized) content. Let me fix the module's normalize.

Now fix the REQ-57 test: merge adjacent same-type lists in the generator (so generated content is normalized) and correct the blockquote expected string.

All 27 pass, including the 500-seed property test. Let me run the full suite and a typecheck to make sure nothing else broke and the new types compile.

Full suite green (588 tests) and framework typechecks clean. Let me do a one-off higher-seed stress run of the property generator to shake out edge cases before committing.

6000 seeds pass; file reverted to 500. Now finalize: version bump, then commit only my files (the pre-existing faelan deletions in the working tree must stay out of this commit).

The `git add` worked (the error was just my `--cached` typo on status). Let me verify the staged set and commit.

Exactly the 6 intended files staged; the pre-existing faelan deletions are excluded. Now commit:

Now move the ticket to `free_coded` through the gate (validates version bump + commit):

Ticket moved to `free_coded`. Let me verify status and `fields.commits`:

Everything is in place. Let me close out the tracking.

Done. REQ-57 is implemented and free-coded.

## What shipped

Extended the styled-text notation (DOC-22 §8 backlog) with the deferred block kinds — **workstreams 1 & 2 only** (model + notation), which is the reachable scope; the schema/render/capture/diff workstream is gated on stages that don't exist yet.

**New block kinds** in `packages/framework/src/modules/text-markup.ts`:
- `heading` — `#`…`######` → level 1–6, inline runs
- `code` — ` ``` ` fenced, optional language, verbatim raw text (no inline parsing), fence auto-widens past any backtick run inside
- `blockquote` — promoted from REQ-54's paragraph-level flag to a **container** of child blocks (no dual model)
- `table` — 2-D `rows × cells` via nested `::: table` / `::: row` / `::: cell` fences; cells hold blocks
- nested / multi-block list items — `ListItem` widened `{ runs }` → `{ blocks }`

**Grammar is now recursive descent** (both parser and serializer), per your call. One design point surfaced during implementation: two adjacent same-type lists are genuinely indistinguishable in the notation (a blank line between items is the *same* list) — the block-level analogue of REQ-54's adjacent same-format run merging. So `normalize()` gained sibling-list merging, keeping the round-trip invariant `parse(serialize(x)) == normalize(x)` true in general.

## Verification
- **588/588** full suite green; framework typechecks clean.
- Property generator extended to emit every kind, nested — **500 seeds** in the committed test, stress-verified clean to **6000**.
- Explicit UATs per kind (table cell blocks, code-is-raw, fence widening, heading levels, nested + multi-paragraph list items, rich/nested blockquote, quoted list).
- REQ-54's item-shape assertions updated to the widened model (notation round-trip unchanged).

## Bookkeeping
- Ticket scoped up front with the three locked decisions (recursive grammar, fenced tables, always-`blocks` items), then moved to **`free_coded`**.
- Version bumped `0.0.103 → 0.0.104`; commit `ef6f6b15` `[FREE-CODED]`; `fields.commits` + `version` populated.
- Committed only my 6 files — the pre-existing faelan working-tree deletions were left untouched.

<!-- xgd-turn id="6fa0d7a6-2d6c-4c24-b981-2b13c888ab49-user" -->

<!-- xgd-chat role="user" ts="2026-07-13T17:46:32.571276+00:00" -->
#### You
Has the documentation been updated to reflect the richer syntax?

<!-- xgd-turn id="6fa0d7a6-2d6c-4c24-b981-2b13c888ab49-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-13T17:48:35.926785+00:00" -->
#### Claude
Good catch — no, it hasn't. Let me confirm the exact state of DOC-22 (the spec REQ-57 implements) so I update it precisely.

No — DOC-22 hasn't been touched. §8 still lists tables/code/headings/blockquotes/nested-items as "deferred to a follow-up ticket," §3/§4 don't document the new notation, and the §3 example still shows the old `{ runs }` list-item shape. That's exactly the "stale ticket body corrupts the capability matrix" hazard. Since this is a documentation change (not code), it's outside the free-coding protocol — I'll update the DOC-22 spec directly to match what landed.

Let me make the edits to the spec body:

Now push the updated spec body to DOC-22 via the ticketing API:

Done. DOC-22 — the spec REQ-57 implements — is now updated to match what landed. (The `text-markup.ts` module header itself was already rewritten for the richer syntax as part of the code commit; the gap was the DOC-22 ticket.)

What changed in the spec:

- **§3 (canonical model)** — the kinds list now enumerates `heading`, `code`, `blockquote` (as a container), and `table` alongside `paragraph`/`list`; the JSONC example uses the widened `item = { blocks: [...] }` shape instead of the old `{ runs }`.
- **§4 (notation)** — documents the new surface: `#…###### ` headings, the ` ``` ` code fence, the `::: table` / `::: row` / `::: cell` structural fences, blockquote-as-container, indented nested list items, and that parse/serialize is recursive descent.
- **§4.1 (escaping)** — adds `# ` / `\# ` to the leading-marker guard list.
- **§5 (invariant)** — normalization now also merges **adjacent same-type sibling lists** (the block-level analogue of adjacent same-format run merging), which is what keeps the round-trip true in general.
- **§8** — retitled "Status / still deferred": the richer kinds + nested items move from "deferred" to **Landed (REQ-54/57)**; what genuinely remains is the schema/render/capture/diff wiring (still gated on stages that don't exist), component-owned typography, and structured run fields.

DOC-22 is a doc ticket, so this was a documentation change outside the free-coding protocol — the update auto-committed via the ticketing API (`doc-111df670`). REQ-57's own body already carried the scope-decision record from earlier, so both tickets now reflect the implementation as it stands.

<!-- xgd-chat-end -->