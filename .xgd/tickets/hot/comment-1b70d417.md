---
uid: comment-1b70d417
id: COMMENT-90
type: comment
title: Comment on request REQ-51
created_by: xgd
created_at: '2026-07-10T20:07:16.758802+00:00'
updated_at: '2026-07-10T20:46:16.862592+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-105ad942
  kind: chat_transcript
---

<!-- xgd-turn id="abaf397b-ead6-4d21-a0ab-992d38ce9cc5-user" -->

<!-- xgd-chat role="user" ts="2026-07-10T20:07:13.113471+00:00" -->
#### You
Are you ready to free-code this change?

<!-- xgd-turn id="abaf397b-ead6-4d21-a0ab-992d38ce9cc5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-10T20:09:02.090294+00:00" -->
#### Claude
Let me get up to speed on the current ticket state and the code I'll be touching before I answer.

The ticket body is well-populated. Let me read the two target files to understand the current shape before I commit to an approach.

Now the core diff module. Let me read it, focusing on the types and the `diffManifests`/report structure.

Let me read the rest of the diff module and find where the inspection/`describe` output lives.

The ticket mentions "inspection output AND the comparison." Let me find the inspection command and how the CLI wires these.

No separate `inspect` command — "inspection output" and "the comparison" both flow through the `ValuesDiffReport` → `formatReport` path (scope confirms: only `values-diff.ts` + `fidelity.ts`). Let me check the existing tests and how the report is currently consumed in the CLI.

Let me locate the test suite for these modules.

I've reviewed the ticket and the code I'll be touching. Yes — I'm ready to free-code this. Here's where things stand.

## Ready

**Ticket REQ-51** (`request-105ad942`) is at `draft` with a fully populated body — goal, problem, 5 numbered requirements, scope, and intended workflow. It's session-scoped, so I'll work this ticket, not create a new one. Nothing in the body needs rewriting.

**Scope confirmed against the code** — both target files match the ticket:
- `values-diff.ts` — `diffManifests` already pairs expected↔repro elements (FIFO join on case-folded text; fields on `a11yRole`+order) and carries full per-object params incl. `box`. Today it emits only a flat, severity-sorted `deltas[]`.
- `fidelity.ts` — `formatReport` renders that flat list one-row-per-delta.

## Approach (one design decision worth flagging)

The ticket frames this as "a projection over existing `diffManifests` data." One wrinkle: `deltas[]` only holds *disagreements*. Requirement #1 wants each object card to show **every parameter side-by-side including the ones that match**, plus `box` — which the deltas don't carry. So I'll:

1. **In `values-diff.ts`** — where the pairing already happens inside `diffManifests`, additionally emit an `objects: ObjectCard[]` array on the report. Each card holds the reference element, the paired repro element (or null), and the set of mismatched properties (cross-referenced to the deltas already computed for that pair). Textless fields (images/controls) get their relevant params. No change to the comparison logic — pure additive projection.
2. **In `fidelity.ts`** — rewrite `formatReport` to render object cards (fixed param table, mismatches flagged inline, `box {x,y,w,h}` on every card) with a **loud unpaired header** up top ("N reference objects unmatched; M repro objects matched nothing"), making this the primary read ahead of the pixel-mean. `--json` keeps dumping the (now-richer) report unchanged.

For requirement #4 (spec vocabulary) — that's the sibling REQ-50 ("unify spec vocabulary"). I'll render the "expected" column in the styled-run shape as closely as this ticket's data allows, but I won't take a hard dependency on REQ-50 landing.

**Process I'll follow:** code + `test_UAT_FC_REQ-51_*` UATs in a new `tests/req51-object-grouped-report.test.ts` (matching the suite's vitest + naming convention) → regression scope (req31/35/47/48 fidelity suites + the new file) → version bump → `[FREE-CODED]` commit → `move-to-free-coded` → keep the body current. Est. **~3 story points**.

Want me to go ahead and implement?

<!-- xgd-turn id="b621e0b9-9270-4265-9326-08772f48fd40-user" -->

<!-- xgd-chat role="user" ts="2026-07-10T20:31:06.710358+00:00" -->
#### You
Yes - please make sure the format is clear in DOC-19

<!-- xgd-turn id="b621e0b9-9270-4265-9326-08772f48fd40-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-10T20:46:16.836217+00:00" -->
#### Claude
Let me read DOC-19 first to understand what it documents and how the format fits.

There's already a CHAT-7 section referencing REQ-51. Let me read it in full to see what to add.

The CHAT-7 section describes the workflow but shows no concrete card format — that's the gap the user wants closed. Now let me check whether any existing tests assert on `formatReport`'s string output (I must not break them), and confirm the `Box`/field shapes.

No test asserts on `formatReport` output — I can rewrite it freely. Let me confirm no test does whole-report equality (which adding fields would break).

Safe. Let me check the barrel exports so my new types are importable by tests.

I now have everything I need. Let me set up task tracking and check the version-bump interface before I start editing.

Now I have the full picture. Let me set up task tracking and begin.

Now the core change. First, the report type additions and the object-card model in `values-diff.ts`:

Now the card-building helpers, placed just before `diffManifests`:

Now wire the card-building into `diffManifests`. Let me read the current state of the relevant region (line numbers shifted after my inserts).

Now the two pairing loops. Let me read them:

Now the text-run loop. Let me read its full extent to find the closing and the section loop start:

Now update the post-loop section: remove the duplicate `ignore`/`isIgnored` compilation (now hoisted) and add `objects`/`unpairedActual` to the return. Let me read that region:

Now the return statement:

Now export the new types via the capture barrel:

The top-level barrel does `export * from './capture'`, so those flow through. Task 1 done — now the `formatReport` rewrite.

Task 2 done. Let me typecheck and run the existing fidelity suites before writing new tests, to confirm nothing broke.

Typecheck clean. Let me confirm `node_modules` is present (avoid any silent install), then run the existing fidelity suites.

All 102 existing fidelity tests pass. Now the REQ-51 UATs. Let me look at the req47 manifest builders to reuse the pattern:

Now the REQ-51 UAT test file:

All 8 pass. Let me capture the actual `formatReport` output so DOC-19 documents the real format exactly:

The barrel pulls `.astro` files. Let me print via a throwaway vitest test (vitest handles the transform):

That's the real format — exactly the object-centric read the ticket wants. Now let me document it in DOC-19. First, how does `xgd ticket update` handle the body?

Tests are done. There's an `--append-body-file` — and the CHAT-7 section is the last section of DOC-19, so appending a concrete-format subsection there is natural and low-risk (no wholesale rewrite).

Let me verify the DOC-19 append landed correctly:

Task 4 done. Now the final task: full test run, version bump, commit. Let me run all affected suites together first:

All 148 pass. Let me run the full suite to be certain nothing else consumes the report shape I changed:

Full suite green (531 passed). Let me run a full typecheck and lint before committing:

tsc clean. Let me check formatting (prettier) on my changed files to avoid a later format-gate failure:

No local linter/formatter to run (quality runs via `xgd quality`). Let me keep the REQ-51 body current with a brief implementation note (appending, not replacing), then bump the version.

Version bumped to 0.0.93. Now let me stage only my code/test/version files (not the unrelated pre-existing `storage/sites` deletions) and commit:

Exactly my files. On `xgd-working` (the correct branch for free-coded changes). Let me stage and commit:

Committed as `34f3cb52`. Let me verify the version-bump gate sees it, then set the ticket to `free_coded` with the commit sha:

Let me confirm the ticket landed in `free_coded` with the commit recorded:

The direct `--fields` status set is gated — there's a dedicated `move-to-free-coded` command (per CLAUDE.md) that runs the version-bump check. Let me use it:

The gate passed and moved REQ-51 to `free_coded`. Let me confirm:

Done. REQ-51 is `free_coded` with the commit recorded. Let me close out the task list.

REQ-51 is complete and free-coded. Summary:

## What landed

**Object-grouped inspection/comparison** — `values-diff` no longer emits a flat, severity-sorted delta stream. It now reads object by object.

**Code (2 files in scope + barrel):**
- `values-diff.ts` — new `ObjectKind`/`ObjectParam`/`ObjectCard`/`UnpairedObject` types; the report gains `objects[]` (one card per reference object with its full param table incl. `box`, mismatches flagged, worst-severity for ordering) and `unpairedActual[]`. Built as a pure projection over the *existing* pairing — **zero change to the comparison logic or tolerances** (all 102 prior fidelity tests still pass). The ignore-mask was hoisted so a card's verdicts stay consistent with the flat list.
- `fidelity.ts` — `formatReport` rewritten: loud `⚠ UNPAIRED` header (both directions) → per-object cards worst-first (tier badge, `box` first-class row, inline ✓/✗, `expected` column = paste-able value) → clean-object count → `section / render-only checks` tail. `--json` emits the enriched report.

**The actual output** (verified by running it):
```
  ▸ text · "Gigabyte Alchemy" (wordmark)  [CRITICAL]
      fontSizePx       72                48                ✗
      lineHeightPx     80                56                ✗
      box              (120, 40) 640×72  (120, 40) 300×48  ✗
      text             Gigabyte Alchemy  GIGABYTE ALCHEMY  ✗
```

**Requirement #4** (spec vocabulary): the `expected` column already prints the spec's own field names/units, so a delta row is a paste-able edit *today* — no hard dependency on sibling REQ-50.

## Verification
- New: `tests/req51-object-grouped-report.test.ts` — 8 `test_UAT_FC_REQ-51_*` UATs (grouping, box-per-card, paste-able column, clean object, loud unpaired both ways, object-grouped `formatReport`, image/control cards).
- **Full suite: 531 passed (47 files); tsc clean.**

## Format documented in DOC-19
Appended a **"The format you read (concrete)"** subsection to the CHAT-7 section with the real rendered output and a top-to-bottom reading guide (unpaired-first, cards worst-first with box, expected = transcribe value, clean-count, render-only tail, and the `--json` shape).

## Process
Version bumped 0.0.92 → 0.0.93 · committed `34f3cb52` with `[FREE-CODED]` · REQ-51 promoted to **`free_coded`** via the gate (version-bump check passed) with the commit recorded. The unrelated pre-existing `storage/sites/*` deletions were left untouched.

<!-- xgd-chat-end -->