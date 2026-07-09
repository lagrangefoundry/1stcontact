---
uid: report-8230a3cf
id: REPORT-392
type: report
title: 'Code Review: bundle-adc60ee8 (FAIL — services-grid regression breaks pre-existing
  UATs)'
created_by: xgd
created_at: '2026-07-09T23:47:47.201292+00:00'
updated_at: '2026-07-09T23:47:47.201292+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-adc60ee8
  anchor_uid: bundle-adc60ee8
---

# Code Review

**Result**: FAIL

## Summary
The free-coded bundle (REQ-26/27/28/20/31/32/33/35/37/38) is architecturally sound, well-documented, and token-backed, and the new `1c` CLI eyes (values-diff / perceptual-diff / crop) are correctly wired and dispatch cleanly. However, the full `pnpm test` suite is RED: the services-grid changes broke two pre-existing UATs. The reconcile quality gate (report-a5524277) passed only because it ran a **filtered** subset (100 tests, 282 deselected) that excluded `framework-content-modules.test.ts`. Merging this bundle would leave `main` with a failing test suite.

## Quality Gates
- Lint: success (0 errors, 0 warnings) — report-a5524277
- Build: success — report-a5524277
- Reconcile filtered suite: 100 passed / 0 failed (282 deselected) — report-a5524277
- **Full suite (`pnpm test`) as-merged: 382 tests, 3 FAILED** — reproduced this review. FAIL.

## External Interface Accessibility
New entry points wired in: **yes**.
- `bin/1c` launcher execs `tools/generate/bin/1c.mjs`; `1c --help` runs clean (exit 0) and documents `values-diff`, `diff`, `crop`.
- New CLI subcommands `values-diff` / `diff` / `crop` are dispatched in the `run()` switch in `tools/generate/src/cli/index.ts` and re-exported.
- New framework modules `row` (`ROW_CSS`, `composeRow`) and `gradient` (`gradientImage`, `gradientTextStyle`, `GradientTreatment`, `GradientStop`) plus `CALLOUT_CSS` are exported through `modules/index.ts` and the package barrel `packages/framework/src/index.ts`. No dead modules found.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| packages/framework/src/modules/services-grid/index.astro:73-80 | Card `class:list` now unconditionally appends `card-size-${item.size ?? 'md'}`, changing the card element's class attribute from the prior exact `class="services-grid__card"` to `class="services-grid__card card-size-md …"`. This silently broke pre-existing UATs that assert the exact attribute string. | Critical |
| packages/framework/src/modules/services-grid/index.astro | New accent/badge/checklist/size treatments are structured, closed-value, and token-backed (`--color-*`, `--space-*`) with no raw CSS — matches REQ-26 intent and CLAUDE.md "generalize existing module" guidance. | OK |
| tools/generate/src/cli/{fidelity,perceptual}.ts, values-diff.ts | New CLI code is well-structured, documented, consistent with existing command patterns; exit codes signal fidelity failures. No debug/commented-out/TODO stubs observed. | OK |

## Smoke Test
Entry points tested:
- `node tools/generate/bin/1c.mjs --help` -> exit 0, usage renders including new commands. PASS.
(New `values-diff`/`diff`/`crop` require fixtures/refs; help + dispatch wiring verified.)

## Issues Found
**Critical (must fix)**:
- Two pre-existing UATs fail as-merged, caused directly by the services-grid markup change:
  - `tests/framework-content-modules.test.ts:90` `test_UAT_FC_REQ-5_services_grid_three_col_renders_three_cards` — `html.match(/class="services-grid__card"/g)?.length` is now `undefined`, expected `3`.
  - `tests/framework-content-modules.test.ts:102` `test_UAT_FC_REQ-5_services_grid_two_col_renders_two_cards` — same, expected `2`.
  - Root cause: `packages/framework/src/modules/services-grid/index.astro` card `<li>` moved from `class="services-grid__card"` (on `main`) to a `class:list` that always includes `card-size-md`, so the exact attribute string no longer appears.

**Warnings (should fix)**:
- Pre-existing/out-of-scope: `tests/reconciliation-platform-scaffold.test.ts:254` `test_UAT_AC424_identifiers_normalized_to_1stcontact` fails on `existsSync('sites/1stcontact')`. This file was NOT modified by the bundle (`git log main..HEAD` shows no commits to it) and is a CWD-relative/environment check unrelated to this bundle. Flagged for visibility; not a blocker for THIS bundle, but note `main` may already be red on it.
- Reconcile blind spot: the quality gate's test_filter excluded core FC UATs, so a regression in a shipped module reached review. Consider ensuring modules touched by a bundle have their existing UATs included in the evidence set.

## Fix-It Prompt
Fix the services-grid regression so the full `pnpm test` suite is green (target: `tests/framework-content-modules.test.ts` all passing, no new failures).

The new markup is CORRECT and intended (REQ-26 accent/badge/checklist/size treatments) — do NOT revert the `class:list`. The defect is that two pre-existing UATs assert an over-specific exact attribute string that the new markup no longer produces. Update those two UATs to match cards resiliently:

1. In `tests/framework-content-modules.test.ts`, in `test_UAT_FC_REQ-5_services_grid_three_col_renders_three_cards` (line ~90) and `test_UAT_FC_REQ-5_services_grid_two_col_renders_two_cards` (line ~102), replace the exact-attribute count `html.match(/class="services-grid__card"/g)?.length` with a match that tolerates additional `class:list` tokens. Recommended: count card titles or the card class token, e.g. `html.match(/class="services-grid__card-title"/g)?.length` (one per card), or a token-aware regex such as `/class="services-grid__card[ "]/g`. Keep the expected counts (3 and 2).
2. Do NOT weaken the assertions to trivial truthiness — they must still prove exactly N cards render for the `three-col`/`two-col` variants.
3. Re-run the FULL suite (`pnpm test`), not a filtered subset, and confirm 0 failures introduced by services-grid. Leave the unrelated `reconciliation-platform-scaffold.test.ts` failure as-is (out of scope; pre-existing, bundle did not touch it).
