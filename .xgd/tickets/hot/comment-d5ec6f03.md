---
uid: comment-d5ec6f03
id: COMMENT-148
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-07-13T21:46:12.021285+00:00'
updated_at: '2026-07-13T21:46:12.021285+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-69f7e5ba
  kind: note
---

The batch is complete. Here's my assessment.

## Diagnosis

**Batch scope:** 54 orphaned ACs (AC-575..AC-628) flagged by the regression report.

**Root cause (per planner brief, confirmed):** 53 of the 54 were a **regression-environment artifact** — the javascript-vitest suite collected `total=0` in the regression worktree (node_modules hoisting glitch), so the AC-coverage gate marked every in-scope AC orphaned. In this worktree `node_modules` is present and the suite collects normally. The one genuine evidence gap was **AC-609** (`test_UAT_AC609_retired_width_names_removed`).

## Findings — no edits required

The classification is **matrix/data stale, code correct** (stabilize mode), and it was **already resolved by the prior `test_fix` commit `b093ffd6`** in the log:

1. **Site data already aligned.** Every `site.json` `theme.container` block across all six shipped site documents now carries only `bleed: "100%"` — none of the retired `narrow`/`default`/`wide`/`readable`/`xnarrow` keys. The git tree is clean.
2. **Retired-name grep hits are not violations.** The remaining `"surface": "default"` / `"tracking": "wide"` matches are `surface` and `tracking` dial values — the AC-609 test only checks `contentWidth`/`rowWidth` dial values and `theme.container` overrides against the retired set.
3. **The doc-comment nit is already correct.** `schema.ts:722-726` describes the retired vocabulary as *"gone"*, not canonical — no stale mention of `default`/`readable` as valid. No change needed.

## Verification

- `npx vitest run tests/reconciliation-content-width-scale.test.ts` → **6/6 pass**, including `test_UAT_AC609`.
- Authoritative batch command `xgd quality run --test-filter-expression "..."` → **Overall Status: SUCCESS**, "Results match quality.yaml expectations". All in-scope AC575..AC628 tests green.

The 2 failing `test_UAT_FC_REQ-4` tests in `framework-tokens.test.ts` (token count 88 vs 89) are **outside this batch** (not AC-575..AC-628) and are accounted for by `quality.yaml` expectations (overall run passed). Per the "fix ONLY the failures in this batch" constraint and blast-radius caution, I left them untouched.

**Outcome:** code, tests, and matrix are coherent for this batch. No production, test, or matrix edits were necessary — the fix landed in a prior commit and the current worktree already passes.
