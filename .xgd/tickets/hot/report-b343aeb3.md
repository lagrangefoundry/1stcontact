---
uid: report-b343aeb3
id: REPORT-1114
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-08-03T01:57:27.453405+00:00'
updated_at: '2026-08-03T01:57:27.453405+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-d0a8cfad
  parent_report_uid: report-f01a45f4
  batch_index: '0'
---

Both batch failures are fixed and verified. No production code was touched.

## AC-762 — `test_UAT_AC762_left_accent_rule_paints_one_edge_and_coexists_with_a_border`

**Root cause:** the test asserted a 50000px `borderLeft` width is rejected. It isn't. `checkEffects` (`packages/site-schema/src/l1/validate.ts:264-268`) applies the ±10000px `effectPx` cap to `axes.border.widthPx` only — it never visits `axes.borderLeft`. The schema bounds the accent width solely by type (`finite.nonnegative()`, `schema.ts:326`). A previous pass had left an explicit NOTE in the test saying the assertion was what the AC specified rather than what the code does; under this mode the code is truth, so the test and the AC were wrong.

**Test fix** (`tests/reconciliation-l1-responsive-and-column-axes.test.ts`): replaced the false `widthOutOfRange` rejection with the bounds the code actually enforces — `negativeWidth` and `nonFiniteWidth` now join `nonHexColour`, `styleNotInEnum` and `freeformKey` in the rejected set. The asymmetry is then pinned executably rather than left as prose: the oversize accent width is asserted **accepted**, and the identical width on the uniform border asserted **rejected** naming `/root/axes/border/widthPx`. Net: the test got stronger (5 rejection cases + 2 boundary assertions, up from 4), and closing the validator gap later would fail this UAT rather than pass unnoticed.

**Upstream propagation:** AC-762's body updated via `xgd ticket update`. The claim "takes the same envelope bounds … a bounded width" was false, so the criterion now separates the **typed** discipline (shared with the uniform border) from the **numeric-range** layer (where they diverge), names the exact location of the divergence, and states the verification accordingly. The story's own text makes no falsified claim here, so I left it unchanged.

## AC-688 — orphaned acceptance criterion (reported twice)

Not a test defect. `test_UAT_AC688_no_layout_divergence_across_three_engines` is gated on `it.runIf(allEnginesReady)`, and only Chromium was provisioned on this machine — so it skipped, and the AC coverage gate (`ac_coverage_gate.py`) counts only **passing** tests, making the AC an orphan. Skip markers are forbidden and the test itself is correct, so the fix was environmental: I provisioned the missing engines.

One wrinkle worth noting: `npx playwright install` resolved the root's Playwright 1.62.0 and fetched `webkit-2336` / `firefox-1538`, but `tools/generate` pins 1.61.1 and looks for `webkit-2311` / `firefox-1532` — so the first install left the test still skipping. Re-running through `tools/generate/node_modules/.bin/playwright` fetched the matching builds. All three engines now launch, and the test passes against real Chromium, WebKit and Firefox in ~10s.

*(The duplicate AC-688 entry comes from the ticket index returning two refs for the same uid — `acceptance_criterion-18356eea`. One passing test clears both.)*

## Verification

- Story-scoped filter (the quality gate's 20 `test_UAT_AC*` names): **20 passed, 0 failed** — up from 19 total / 1 failed / AC-688 skipped.
- AC coverage: `resolve_story_to_ac_ids('story-d0a8cfad')` returns 20 ACs; the passing tests cover 20 distinct AC ids, 1:1. Orphan count → 0.
- Both story test files in full: 16 passed.
- `git status`: one file modified, `tests/reconciliation-l1-responsive-and-column-axes.test.ts`. No shared test infrastructure touched.

Typecheck under `tsconfig.base.json` reports 174 errors repo-wide, all pre-existing and none in the edited file — that config isn't the quality build target (the gate's build step is a no-op, exit 0).
