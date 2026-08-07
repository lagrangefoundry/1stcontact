---
uid: report-98fbe05b
id: REPORT-1604
type: report
title: Fix site-materials-and-start-point (uat) — attempt 1
created_by: xgd
created_at: '2026-08-07T18:35:34.787798+00:00'
updated_at: '2026-08-07T18:35:34.787798+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-b4ac88fc
  level: uat
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-17a279f7
---

# Fix Summary — site-materials-and-start-point (uat)

**Attempt**: 1
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

Single violation in report-f119d7fc (finding 1, AC-941). Resolved via the
assessor's **Repair A** (code + UAT), not Repair B — AC-941's Criterion and
Verification both assume the report *names* the files, STORY-97 sells the
retrofit as reproducible from one command line, and the data was already on the
returned result; only the renderer dropped it. AC-941's body is therefore
unchanged, so the `ac`-level ledger (checked 2026-08-07 against the stronger
wording) stays valid.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | code-issue (Repair A) | `formatAssign` (`tools/generate/src/cli/colors.ts:518-519`) | Count line now reads `wrote N file(s):` followed by one indented line per written file |
| 2 | code-issue (Repair A) | `cmdColorsAssign` / `AssignResult.written` (`colors.ts:436,504`) | `written` now carries site-relative paths (`pages/<name>.json`, plus `site.json`) so a named page is unambiguous in the report; doc comment updated |
| 3 | uat-edit | `test_UAT_AC941_assign_writes_palette_rewrites_pages_and_reports_counts_and_files` (`tests/reconciliation-colour-census-and-retrofit.test.ts:369-379,392-398`) | Parses the written-file names out of `run.stdout`, asserts that set equals the site's real page set plus `site.json`, and now drives the "exactly these files differ" check from the **reported** list rather than from `pageFiles(siteDir)` — so the AC's "every file named in the report differs from its pre-retrofit content" clause is verified from the report surface |

## Code Edits

| File | Lines | Evidence chain |
|---|---|---|
| `tools/generate/src/cli/colors.ts` | 436, 504, 518-519 | AC-941 Criterion bullet 3 requires the report to state "the list of files it wrote (every rewritten page plus the site definition)"; its Verification requires asserting on "every file **named in the report**". `formatAssign` emitted only `wrote N file(s)`, and `--json` emits the palette alone, so the clause had no output surface. `cmdColorsAssign` already returned `written` (line 504) — only the renderer dropped it. The new UAT assertion (mutation 3) fails against the pre-edit renderer, since no stdout line names a file. Minimal change: render `result.written`; no behavioural change to what is written. `formatAssign`'s only consumer is `cli/index.ts:967`. |

## Verification

- `npx vitest run tests/reconciliation-colour-census-and-retrofit.test.ts` — **9/9 pass** (18.6s), covering AC-939 … AC-947.
- `npx tsc --noEmit -p tools/generate/tsconfig.json` — clean.
- Grepped for other consumers of `written` / the `wrote N file(s)` string: none outside `colors.ts`, `cli/index.ts` and the AC-941 UAT.

## needs_review Items Forwarded

None. The report recorded no `needs_review` findings, and the four cross-cutting
observations in "Notes for the Editor" were explicitly marked *no action
required* — no action was taken on them.
