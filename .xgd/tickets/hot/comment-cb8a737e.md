---
uid: comment-cb8a737e
id: COMMENT-304
type: comment
title: Comment on bug BUG-5
created_by: xgd
created_at: '2026-07-23T02:29:39.591501+00:00'
updated_at: '2026-07-23T02:35:14.565413+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5b7153d2
  kind: chat_transcript
---

<!-- xgd-turn id="98f5965f-40b9-47b0-a73c-edfcc3eaf806-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T02:29:37.331187+00:00" -->
#### You
PLease free code this ticket

<!-- xgd-turn id="98f5965f-40b9-47b0-a73c-edfcc3eaf806-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T02:35:14.531308+00:00" -->
#### Claude
I'll start by getting the current ticket state and reading the code that needs fixing.

Now let me understand how the fold produces the doc + oracle, to know what stable identity is available for pairing.

Let me look at the existing probe tests and how the responsive table orders rows, to design the pairing fix correctly.

Let me read the existing 3-probe test to understand fidelity test patterns and avoid regressions.

Let me read the top of the 3-probe test for the fixture helpers I'll mirror, and confirm the exports/index.

The ticket is already scoped with a populated body and I'm anchored to BUG-5. The fix design is clear: the responsive table assigns each oracle element to a row by **occurrence index within a text key** (FIFO document order) — that occurrence index is the stable identity the fold uses. The probe must pair the k-th reproduced text leaf of a key to the k-th oracle element of that key (per width), instead of a text→box map that collides. Let me implement it.

Now the UAT tests. Let me write a focused test file demonstrating the repeated-text fixture and idempotency.

Now run the new tests plus the regression scope (the existing probe/fold tests).

All 24 pass. Let me typecheck (green vitest ≠ typecheck-clean, per prior lesson) and confirm nothing else references the removed pattern.

The tsconfig exists and typecheck passed clean. Now bump the version and commit.

The version lives in `package.json` for this JS project. Let me commit correctly.

Now promote the ticket to `free_coded` via the gate command, and set story points.

The ticket body's fix direction matches what I built, but I chose the occurrence-index identity (already established by the fold's responsive table) rather than materializing a new id field on L1 nodes. Let me record that design decision so reconcile doesn't expect a node-id field.

Done. BUG-5 is free-coded and parked at `free_coded`.

## What was wrong
`sampleFidelityProbe` paired each oracle box to a reproduced leaf through a `Map<normText, box>`. On a page with repeated text (duplicate labels/CTAs), the map key collided and only the **last** leaf's box survived, so every other oracle sample of that text paired against the wrong box — the phantom deltas (the 1616px FAIL) even though `evalGeometry` reproduces the keyframes exactly at sampled widths.

## The fix
The fold builds one L1 leaf per responsive-table row, and that table (`buildResponsiveTable`) already assigns each oracle element to a row by its **occurrence index within its text key** (FIFO document order). That occurrence index *is* the stable identity the ticket asked for — no new node-id field needed. The probe now consumes per-key FIFO queues on both sides, pairing the k-th reproduced leaf of a key to the k-th oracle element of that key per width. So:
- duplicates pair to their own box → no phantom deltas;
- excess oracle occurrences surface as `unmatched` (genuine coverage gap), not masked;
- a residual on a *specific* duplicate occurrence is still reported (occurrence pairing, not nearest-box, so real drift isn't hidden).

## Evidence
- `tests/bug5-fidelity-pairing.test.ts` — 4 `test_UAT_FC_BUG-5_*` UATs (repeated-text gate clean, value-render idempotency with repeated text, extra-duplicate→unmatched, per-occurrence residual not hidden).
- Regression scope (3-probe gate, e2e-repro, l1-repro-pipeline, capture-to-l1-fold) + new tests: **24 passed**. `tsc` clean.
- Version bumped `0.0.170 → 0.0.171`; commit `9e649923` `[FREE-CODED]`; ticket at `status=free_coded`, `commits=[9e649923…]`, `story_points=2`, body updated with the implementation note.

The ticket is parked at `free_coded` — promotion to `ready_to_reconcile` is your call. (Note: `storage/sites/gigabytealchemy/` remains untracked; it's pre-existing and unrelated to this change, so I left it alone.)

<!-- xgd-chat-end -->