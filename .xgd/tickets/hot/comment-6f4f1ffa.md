---
uid: comment-6f4f1ffa
id: COMMENT-305
type: comment
title: Comment on bug BUG-7
created_by: xgd
created_at: '2026-07-23T02:30:40.076867+00:00'
updated_at: '2026-07-23T02:40:13.473668+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-d18ad577
  kind: chat_transcript
---

<!-- xgd-turn id="eec67b78-5412-4034-b93c-21e9365b844f-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T02:30:37.738964+00:00" -->
#### You
Please free code this ticket - note that BUG-5 is already underway but I believe you are independent

<!-- xgd-turn id="eec67b78-5412-4034-b93c-21e9365b844f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T02:40:13.442061+00:00" -->
#### Claude
I'll start by reading the ticket and the relevant code to understand the bug.

Now let me look at the renderer's container branch to mirror its CSS semantics exactly.

Let me look at the schema types and existing tests to understand sizing and verification infrastructure.

Let me look at how the existing tests verify against a real browser and build L1 fixtures.

The fixture verification hinges on what the capture extractor records for non-text boxes. Let me check.

I now understand the bug and the fix. Let me create the scope ticket setup first, then implement. First, let me apply the fix to `probes.ts`.

The file changed on disk (BUG-5 may be touching it). Let me re-read the container branch before editing it.

The container branch body is unchanged. Now let me replace the flow-walk.

Now let me check the exports available for the test file.

Let me look at how `heroDoc` builds an L1Document (for keyframe/geometry shape reference).

Now let me write the UAT test file.

Now let me run the tests for this file plus the existing L1 probe tests to check for regressions.

All pass (browser test skipped — no Chromium). Now a typecheck, since green vitest ≠ typecheck-clean.

tsc on generate is clean. Let me run the broader L1 test set to confirm no regressions.

A `validateL1` test failed — that's in the schema, which I didn't touch. Let me check whether this is pre-existing / BUG-5's in-flight work, not my change.

The schema/render/validate/types changes are BUG-5's in-flight uncommitted work — I'll commit only my probes.ts + test. Let me confirm the failing test is BUG-5's (a `validateL1` test unrelated to my change), not something my change caused.

Confirmed — the failing test is BUG-5's in-flight REQ-91 work (schema/validate `effectPx`/`transformScale`), fully independent of my `evaluateLayout` change. I'll commit only my two files. Let me bump the version.

Version bumped to 0.0.172, changing `package.json`. Now stage only my files (probes.ts, the test, package.json) — excluding BUG-5's files.

Committed. Now promote to `free_coded` via the gate command.

Now set story points and update the ticket body with an implementation note (preserving the existing body).

Let me confirm the final ticket state.

BUG-7 is free-coded and complete. Summary:

## What I did

**The bug**: `evaluateLayout`'s flow walk in `tools/generate/src/l1/probes.ts` gave every in-flow child the full parent width and, for a `row` container, advanced the cursor by the full parent width per child — so N row children spanned N×parentWidth and false-flagged overflow/clip. Latent only because the folder doesn't emit `row` containers yet (but will, per REQ-88).

**The fix**: Split the container flow-walk into a **row** branch and a **stack** branch mirroring the renderer's CSS:
- **Row** — children sit side by side, each taking its own main-axis width, cursor advances by that width, height = tallest child. Widths come from a new `rowChildWidths` helper: a child with a fixed `sizing.width` takes it (clamped via `fixedWidth`); the rest share the leftover extent equally. Genuine fixed-width overflow still clips — the fix removes *false* overflow, not real overflow.
- **Stack** (box/`stack`) — unchanged; **grid** modelled as a stack (envelope-conservative). Removed a dead `maxChildRight` accumulator.

**Tests** (`tests/bug7-row-layout.test.ts`, all `test_UAT_FC_BUG-7_*`): side-by-side tiling with gaps, off-sample no-false-overflow (the exact regression), fixed-width placement, genuine-overflow-still-flagged, column regression guard, and a real-Chromium fixture match (skipped without a browser engine). All pass; `tsc` on the generate package is clean.

## Notes for you

- **Independence from BUG-5 confirmed.** BUG-5's in-flight work (uncommitted REQ-91 changes to `render.ts`, `schema.ts`, `types.ts`, `validate.ts`) is on the working tree. I committed **only** `probes.ts`, my test file, and the version bump — none of BUG-5's files. The one failing test in the broader run (`reconciliation-l1-substrate.test.ts:151`, a `validateL1` REQ-91 case) is BUG-5's transient mid-edit state, unrelated to my change.
- Ticket is at `free_coded` (commit `e4bdbe0`, v0.0.172, 2 story points). It's parked there — promote to `ready_to_reconcile` when you're ready for reconcile.
- Untracked `storage/sites/gigabytealchemy/` was left alone (not mine).

<!-- xgd-chat-end -->