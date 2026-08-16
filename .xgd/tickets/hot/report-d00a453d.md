---
uid: report-d00a453d
id: REPORT-2163
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-16T23:29:26.317119+00:00'
updated_at: '2026-08-16T23:29:26.317119+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-d9226698
---

The orphan's damage is fully reversed and the warnings addressed, with one deliberate exception I need to flag.

## Issues fixed

**Critical 1 — orphan `64a1f7023` reverted main's echo-guard fix** (`packages/site-schema/src/l1/edit.ts`)
Restored from main. Verified by content, not just by file: `applyCopyFields:1159` refuses a `locked` field on *change* (`field.locked && value !== derived.values[name]`), `writeTypography` has its four-parameter signature (`:871`) and its absent-axis seed guard (`:904`), and the call site passes `derived.values[name]` (`:1173`). `git diff main -- packages/site-schema/src/l1/edit.ts` prints nothing.

**Critical 2 — 19 tests of `locked`-field evidence removed**
Restored all three suites; each is byte-identical to main. **19 passed / 19.** One correction to the review's account: `test_UAT_FC_REQ-135_text_properties.test.ts` was not deleted — the orphan stripped 103 lines (2 of its 9 tests) from a file that survived with 7. That changes the expected arithmetic (below).

**Warning — stale `--assign` help** (`tools/generate/src/cli/index.ts:308`)
Rewritten to state the REQ-137 contract: shade fitting rather than "hue-family ramp grouping", the bound interpolated from `SHADE_FIT_TOLERANCE` (so it can't drift from the constant) rather than hardcoded, and unreachable colours becoming their own entries. Heading now cites REQ-137.

**Warning — `colors.ts:636` docblock overstated the no-shade case**
Corrected to say the limit keys off the reference naming an entry whose own value *is* that literal — matching what `:661` actually does.

## Not done, deliberately: `drift` on `--json`

I implemented it, and it broke 4 tests in 2 suites. `test_UAT_AC941` pins `--assign --json` to be *exactly* the palette ("it is the palette stored on the site", `reconciliation-colour-retrofit-shade-model.test.ts:512`), and `test_UAT_AC946:833` parses that output as a bare name→entry map. `{palette, drift}` fails both. Verified by stashing: those suites are **21/21 at HEAD**, 17/21 with the change.

Satisfying this warning means changing AC-941 and AC-946 — and this loop is explicitly barred from mutating ACs or weakening tests. So I reverted it, documented the constraint at the call site (`:999`), and made the help state the actual contract. **This one warrants an operator/reconciliation decision, not a fix here**: the drift is still reported by `formatAssign` and is re-derivable from the palette, so nothing is lost, only not duplicated.

## Verification (all run to completion)

| Gate | Result |
|---|---|
| Restored suites | 19 passed / 19 |
| Bundle's five suites | 34 passed / 34 |
| Full suite | **74 failed / 1454 passed / 67 skipped**, across exactly the 12 known AI-core suites — zero outside |
| `pnpm -r build` | exit 0 |
| `site-schema` typecheck | exit 0 |
| `generate` typecheck | only pre-existing `builder.ts:337` (identical on main) |
| Smoke | `1c --help`, `1c colors xgd` clean |

**On the predicted count**: the prompt expected 1461 passed, assuming all 19 tests were absent. Since 7 already existed, the restore adds 12 net — 1583+12 = 1595 total, 1442+12 = **1454 passed**. The numbers reconcile exactly; 1454 is correct, not a shortfall.

One thing worth recording: I smoke-tested `1c colors xgd --assign --json` without `--names`, which rewrote xgd's curated entry names to derived ones in `storage/`. I caught it and reverted; `storage/` is verified byte-identical to HEAD. That command is not safe to run bare on a curated site.

Changes are left in the working tree for the workflow to commit, matching how the prior fix step landed (`cc46086b2` swept up its edits the same way).

**Confidence: moderate-to-high.** Both criticals are objectively closed — the restore is byte-exact against main and the 19 tests pass. The risk is the `--json` warning: a reviewer applying the fix-it prompt literally will see it unaddressed. I've made the reasoning explicit in the code and here, but if the re-review treats that warning as binding regardless of the AC conflict, it will fail again — and resolving it then requires the reconciliation loop to amend AC-941 and AC-946 first.
