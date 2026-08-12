---
uid: report-e07298b9
id: REPORT-1879
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-12T19:09:57.935487+00:00'
updated_at: '2026-08-12T19:09:57.935487+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: request-a8ccd0dd
---

Both defects from the review are fixed, and each fix is verified load-bearing by reverting it in isolation.

## Issues fixed

**1. Critical — a locked field blocked every save on the segment**

`packages/site-schema/src/l1/edit.ts:787` — the refusal now compares against what the derivation reported:

```ts
if (field.locked && value !== derived.values[name]) {
```

This adopts the rule `rangeError` already states ("binds a change, never the status quo"). The security property is intact — a locked field still can never be *changed* — but a save that merely echoes it through proceeds. The doc comment above `applyCopyFields` (`:759-770`), which asserted the refusal was unconditional, was rewritten to state the new rule and why.

**2. Major — a run declaring no `fontWeight` acquired one on an unrelated save**

`packages/site-schema/src/l1/edit.ts:718` — `writeTypography` now takes the derived current value (threaded at the call site, `:801`) and skips when the axis is absent and the posted value is the seeded default:

```ts
if (axes.fontWeight === undefined && String(next) === String(current)) return false
```

I took the threading option the report preferred over mirroring `sizeField`'s withhold guard, and stated the cost explicitly in the comment as asked: with the axis absent, deliberately choosing the seeded weight is indistinguishable from not touching the control, so it does not write; every other weight still does.

**3. The missing composed evidence** — `tests/test_UAT_FC_REQ-135_text_properties.test.ts`

Added a fifth fixture run (`A_UNWEIGHTED`, `0.4`) — Satoshi family, no `fontWeight` axis — since no existing run had declared faces *and* no weight. Two new UATs in the browser block, driving the real modal through a full Save:

- `test_UAT_FC_REQ-135_a_locked_control_does_not_block_the_rest_of_the_segment` — opens `A_HEADLINE`, asserts the italic row really is `is-locked`, edits only the copy control, saves, asserts the draft text changed, no refusal was shown, and `fontStyle` is still absent.
- `test_UAT_FC_REQ-135_a_text_only_save_does_not_write_a_weight_the_run_never_had` — asserts the seeded fabrication is real (control offered, seeded `'400'`, axis absent), then does a text-only save and asserts the axis is still absent.

**4.** The 13 pre-existing failures were left alone, as instructed.

## Verification

| Check | Result |
|---|---|
| Three REQ-135 suites | **19/19 pass** (was 17 — plus my 2) |
| Full suite | 13 failed / **1512** passed / 4 skipped — was 13/1510/4 |
| Failing files | Exactly the 3 pre-existing: `reconciliation-assistant-conversation` (6), `test_UAT_FC_REQ-122_chat_host` (5), `test_UAT_FC_REQ-127_session_binding` (2) |
| Fix 1 load-bearing | Reverted `edit.ts` alone → **both** new UATs fail with the exact reported message, `Field 'italic' is not editable on this segment` |
| Fix 2 load-bearing | Removed only the weight guard → weight UAT fails `expected 400 to be undefined` |

I also confirmed `WEBUI_INSTALLED === true` on this machine, so the browser block genuinely executes rather than skipping — worth checking because the block's `describe` title interpolates `WEBUI_SKIP_REASON` unconditionally, so the report reads "webui components not installed" even when they are. That text is misleading but pre-existing, and outside this fix's scope.

**Confidence: high** for the two flagged defects — each is reproduced pre-fix and closed post-fix through the real modal against a real origin, which is the composed evidence the review said was structurally missing.

Two caveats I can't close from here, both noted in the review as tooling rather than code:

- **Lint and build remain unverifiable** (no flat `eslint.config.*`, no root `tsconfig.json`). My changes are type-consistent — `L1FieldValue` was already imported and used at `:618` — but I could not run `tsc` to prove it.
- **The quality gate passes vacuously** (the `-k` filter deselects all 1527 tests). All test results above are from running vitest directly. If the re-review relies on the gate rather than a direct run, it will again see zero tests executed.
