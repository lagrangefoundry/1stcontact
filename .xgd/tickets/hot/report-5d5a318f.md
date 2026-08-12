---
uid: report-5d5a318f
id: REPORT-1928
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-12T22:58:41.061983+00:00'
updated_at: '2026-08-12T22:58:41.061983+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: request-8a132869
---

Both critical issues from `report-b202678e` are fixed and verified in this turn.

## Issues fixed

**C1 — a no-op save silently mutates the document** (the blocking one)

Took the review's *preferred* remediation: the framing write path now judges an incoming value against **what the derivation reported**, not against the raw axis.

- `packages/site-schema/src/l1/edit.ts:1008` — `writeImageFraming` takes a fourth `reported: L1FieldValue | undefined`.
- `packages/site-schema/src/l1/edit.ts:1178` — call site now passes `derived.values[name]`, matching `writeTypography` one line above. This was the missing argument the review identified as the structural cause.
- `packages/site-schema/src/l1/edit.ts:1025,1036` — `applyFraming` takes `reported` and gates on `if (value === reported) return false` as the **single** change comparison.

Rather than threading `reported` into each branch, I deleted the six per-branch equality checks (`objectFit`, `objectPosition`, `shape`, `cornerRadiusPx`, `rotateDeg`/`scalePct`, and the filter fall-through). Those checks were the thing that could disagree with the derivation; keeping them beside the new gate would preserve the two-comparison shape that caused the bug. Each branch now only computes what to write.

One deliberate detail: in the `objectPosition` branch the *untouched* component is still carried from the **held** axis, not from what was reported for it — the operator moved one slider, so the other component's stored precision isn't theirs to round away. Asserted explicitly.

Also folded in **W4** since I was rewriting that exact line: `FILTER_CONTROLS.find(...)` (edit.ts:1096) now returns cleanly instead of `!`-asserting.

**C2 — `foldFilter` clamps only the upper bound**

- `tools/generate/src/l1/fold.ts:775-789` — every `FILTER_FUNCTIONS` entry gained a `min`; `hue-rotate` takes **both** bounds from `L1_ENVELOPE.rotateDeg` (fold.ts:784-785), replacing the hardcoded `3600` ceiling so the fold and the validator can't drift apart.
- `tools/generate/src/l1/fold.ts:821` — `n = Math.min(Math.max(n, fn.min), fn.max)`.

I kept the existing `if (fn.unit !== 'deg' && n < 0) continue` guard — the review left this open, and removing it would change `saturate(-0.5)` from *dropped* to *clamped to 0*, a behaviour change outside the fix.

## Regression tests

Both went into the **AC-named** files rather than `test_UAT_FC_REQ-136_image_framing.test.ts` as the fix-it prompt suggested — that FC file is the one reconcile is retiring (`fc_orphan_check` r0095), so evidence added there would be lost at rename. They extend the ACs that already own the claims, no AC weakened:

- `tests/reconciliation-copy-edit-image-framing.test.ts` → **AC-1122**, new `A_FOLDED` fixture carrying exactly the precision the fold emits (`xPct: 33.33`, `saturate: 1.405`, `rotateDeg: 12.5`). Asserts `changed === ['alt']` and the three axes byte-identical, then that the control still binds a change.
- `tests/reconciliation-l1-fold-framing-and-adjustment.test.ts` → **AC-1134**, an `underfloor` capture of `hue-rotate(-5000deg)` → `-3600`; the suite's existing `validateL1(doc).ok` assertion proves the fold no longer emits what its own envelope rejects.

Verified as genuine RED: stashing only the two source files makes both fail, C1 reproducing the review's exact `['alt', 'objectPositionXPct', 'rotateDeg', 'saturatePct']`.

## Verification

- Typecheck clean this turn for site-schema, generate, framework (exit 0).
- 9 suites / 68 tests pass — the four REQ-136 suites plus all five suites whose `['src','alt']` supersession the review scrutinised.
- Full suite (previous turn, after the fix): **1535 passed / 13 failed / 4 skipped** — byte-identical to the review's own baseline, same 13 in the same three AI-host suites this branch doesn't touch.

Changes are left uncommitted; prior fix cycles on this branch (e.g. `1fd442803`) were committed by the workflow wrapper, not the prompt.

## Confidence

**High** for the two criticals — both remediations are the ones the reviewer specified, both are reproduced-then-fixed rather than reasoned-about, and the review's own repro case is now an assertion.

Two residual risks worth naming:
- I left **W3** (blob determinism rests on unspecified `Math.sin`) and **W5** (doc-comment on the wrong function) unaddressed. The review said none of W1–W5 gate, so this shouldn't fail re-review, but they will still be visible.
- **W1/W2** are unchanged and pre-existing: the lint gate is vacuous project-wide (no eslint binary, no config anywhere in the repo) and scoped coverage resolves to 0 tests. The workflow's automatic quality check after this step will therefore again report `lint: 0 errors` meaning nothing ran. That's a repo-level gap, not something this fix cycle can close, and it deserves its own ticket.
