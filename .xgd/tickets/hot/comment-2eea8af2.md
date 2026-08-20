---
uid: comment-2eea8af2
id: COMMENT-1320
type: comment
title: Claude response for fix_uat_coverage report
created_by: xgd
created_at: '2026-08-20T14:53:10.565481+00:00'
updated_at: '2026-08-20T14:53:10.565481+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-847c35d9
  kind: note
---

Both violations closed, plus one of the two warnings. Report: **REPORT-2455** (`report-847c35d9`).

## What I did

**Violation 2 — AC-705's `mounted` channel** (the one flagged to prioritise). Added `test_UAT_AC705_slot_covered_oracle_text_is_diverted_to_the_mounted_channel` with a `mountedFormOracle()` fixture: two fields plus the submit run the fold claims into the seam. It asserts the run lands in `mounted` once per captured width with `pass === true`, then moves the same oracle words clear of every slot and asserts they become `unmatched` with `pass === false` — the pair proving the diversion keys on the slot rect, not the text.

I verified bite rather than assuming it: neutering `probes.ts:656` to `if (false && insideSlot(...))` turned the suite red on exactly that one test, at `expect(report.pass).toBe(true)` — the assessor's stated silent regression. `probes.ts` is reverted; `git diff` over it is empty.

**Violation 1 — AC-694's scope.** Split into an offline half (sidecar written, round-trips losslessly, stays separate from `l1.json`) and a real-engine half under `it.skipIf(!browserOk)` covering all eight Criterion dimensions — ancestry chained to `body`, three position modes, `repeatCount` 2-vs-1 against a differently-classed sibling, `gap === '40px'` (the `@media`-won computed value, not the `24px` base), grid tracks in the authored 1fr:2fr ratio, and the flex/grid axes nulled on the wrong container type. The old offline assertions that read back out of `CANNED_HINTS` are gone.

**Warning 3 — AC-691.** Added an image and a box leaf with distinct heights per width; every keyframe now asserts height alongside x/y/width.

**Warning 4 — AC-731.** Left as-is, the assessor's sanctioned option; re-attributing would have duplicated the bug19/20/21 fixtures the finding forbids copying.

Suite: 9 files, **43 passed / 1 skipped** (was 42/0). No production code changed.

## One loose end, stated plainly

AC-694's real-engine test **could not be executed here** — I measured it rather than inferring: Playwright wants `chromium_headless_shell-1228`, the cache holds `-1234`. Version skew, and fixing it needs network egress this sandbox denies. So the skip is now declared instead of read green (what the finding asked for), but those assertions are unverified-by-running — written against the `HintNode`/`ParentLayout` contracts and the 1280×800 default viewport. A runner with matching Chromium should execute that file once. Compounding this: the repo has no root `tsconfig.json` or typecheck script, so a browser-gated test's types go unchecked on a browserless runner.
