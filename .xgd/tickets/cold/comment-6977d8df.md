---
uid: comment-6977d8df
id: COMMENT-397
type: comment
title: Comment on bug BUG-11
created_by: xgd
created_at: '2026-07-23T19:06:12.434043+00:00'
updated_at: '2026-07-23T19:20:06.473312+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8431c17b
  kind: chat_transcript
---

<!-- xgd-turn id="f9e14760-0253-4627-877f-2eadb727064a-user" -->

<!-- xgd-chat role="user" ts="2026-07-23T19:06:10.392384+00:00" -->
#### You
Please free code this ticket. Note that BUG-10 is already running, but your work shjould be independent

<!-- xgd-turn id="f9e14760-0253-4627-877f-2eadb727064a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-07-23T19:20:06.444260+00:00" -->
#### Claude
I'll start by getting the current ticket state and understanding the codebase.

Let me examine the capture model to understand how `surfaceFill` is attributed to elements.

Let me look at the existing tests and locate the capture fixtures to ground the fix in real data.

Baseline confirmed. Now let me check the L1Document schema for the `background` field and the gradient handling for boxes.

Let me check the overlap-related tests to ensure excluding box leaves from overlap won't regress them.

I now understand the design fully. Let me make the changes. First, the fold — collect surface backings and set `doc.background`.

Now the root/doc assembly — compute the band and prepend the differing surfaces:

Now the probe change — surfaces (box leaves) sit behind content, so exclude them from the sibling-overlap check (they remain in the clip check):

Now let me verify the fix against the real captures with the diagnostic:

The fix works: `doc.background` is set to the dominant band fill, panel/card surfaces are emitted as boxes, and `sampleFidelity` is unchanged. Let me look at the synthetic capture helpers in an existing test to model the UATs correctly.

The existing REQ-92 test asserts gigabytealchemy folds to zero box leaves — my change legitimately produces surface boxes now. Let me run the affected test suites to find all impacts before writing UATs.

Exactly one predicted regression. Let me update that REQ-92 assertion to preserve its intent (controls stay residuals) while accommodating BUG-11 surface boxes:

Now let me write the BUG-11 UATs. Let me create the test file:

Both failures are test-design issues that reveal the real behaviour: a fill only becomes a backing box when it *differs* from the dominant band, and a lone fill becomes the band itself. Let me fix the two UATs to mirror reality (band runs must carry the band fill):

Now fix the overlap test — the surface must differ from the band to be emitted:

All 6 UATs pass. Now let me run the broader regression scope to confirm nothing else broke:

This failure is in `validateL1` on a hand-built `slot` node with a `capability` field — unrelated to my fold/probe changes. Let me confirm it's pre-existing by checking the slot schema and stashing my changes:

Confirmed **pre-existing** (fails with my changes stashed — a REQ-87 `capability`→`behavior` rename fallout, not mine). My change introduces zero regressions. Per my memory note about clean typecheck verification, let me run the typechecker:

The `colorToHex` returns `string | null`; my `fill?` field needs `string | undefined`. Let me coerce cleanly:

All three packages typecheck clean. Let me re-run my UATs plus the full L1/probe scope one final time to confirm everything is green (except the pre-existing AC-682):

All green. Now let me follow the free-coding lifecycle. First, the version bump:

The `storage/sites/gigabytealchemy/draft/pages/home.json` change is pre-existing (not mine), so I'll stage only my files explicitly:

Now update the ticket body to reflect the final implementation and set story points:

Let me do a final verification of the ticket state:

Done. BUG-11 is free-coded and parked at `free_coded`.

## Summary

**The bug:** The capture composites each card/panel/section fill *behind* a text run onto the run itself (`surfaceFill`/`surfaceGradient`), never as a standalone box. `foldToL1` emitted a bare text leaf and dropped the surface — so reproductions had no panel or section backgrounds (51 of 59 fills lost, `doc.background` unset).

**The fix** (`tools/generate/src/l1/fold.ts`, `probes.ts`):
1. **Page band → `doc.background`** — the dominant solid run-fill becomes the document background, painted by the body (zero new nodes).
2. **Panel/card surfaces → backing `box` leaves** — each run whose surface *differs* from the band (or carries a gradient the body can't paint) folds a `box` leaf (`id: surface-*`) carrying that fill + the run's geometry, emitted before the content so leaves paint over their surface. Band runs need no box.
3. **Envelope probe** — a surface sitting behind the content it backs is not a collision, so `evaluateLayout` no longer flags box↔content overlap (boxes stay in the clip check).

**Verified against both real captures:** gigabytealchemy → `doc.background=#f8f5f2` + 34 surface boxes; joyful → `#7a7a7a` + 23 surface boxes. **`sampleFidelity` (geometry) unchanged** on both (maxDelta 0.5, pass) — the acceptance criterion.

**Tests:** 6 new `test_UAT_FC_BUG-11_*` UATs (all green), driving the real `foldToL1`/`renderL1Document`/`evaluateLayout` entry points. One existing REQ-92 UAT narrowed (gigabytealchemy now legitimately folds surface boxes; form controls still stay residuals — intent preserved). All three affected packages typecheck clean; no regressions across the L1/fold/probe suites.

**One pre-existing, unrelated failure noted** (not touched): `test_UAT_AC682` in `reconciliation-l1-substrate.test.ts` fails on a hand-built `slot` node using the old `capability` field (renamed to `behavior` in REQ-87) — confirmed failing with my changes stashed, so it's outside BUG-11's scope.

The remaining working-tree change (`storage/sites/gigabytealchemy/draft/pages/home.json`) was present at session start and is not mine — left untouched.

The ticket is at `free_coded` with commit `b25e10bf`, version `0.0.183`, 3 story points. Promotion to `ready_to_reconcile` is your call whenever you've validated the reproduction.

<!-- xgd-chat-end -->