---
uid: report-893ffe71
id: REPORT-1439
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-08-06T19:30:43.201233+00:00'
updated_at: '2026-08-06T19:30:43.201233+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-e0143ffa
---

All fixes verified. Here's the summary.

## Issues fixed

**Critical — 7 failing UATs across 3 reconciliation suites** (stale pre-REQ-109 URL expectations). Production code untouched; only the expectations moved to the emitted document-relative shape.

| File:line | AC | Change |
|---|---|---|
| `tests/reconciliation-l1-control-and-texture.test.ts:537` | AC-831 | `url("/assets/hero.png")` → `url("assets/hero.png")` |
| `tests/reconciliation-l1-navigation.test.ts:119–172` | AC-839 | Added an explicit `emitted` field per case; the loop now asserts that literal instead of re-deriving from `link.href`. The two absolute fixtures stay byte-identical; only `/pricing` → `pricing` |
| `tests/reconciliation-l1-navigation.test.ts:229` | AC-840 | `<a href="\/gallery"` → `<a href="gallery"`, plus `src="/assets/hero.png"` → `src="assets/hero.png"` at :239 |
| `tests/reconciliation-l1-navigation.test.ts:321–336` | AC-842 | Permitted-href loop converted to explicit `[authored, emitted]` pairs. Only `/pricing` changes; `https://`, `http://` and `#how` pinned unchanged. Rejection half untouched |
| `tests/reconciliation-l1-navigation.test.ts:637, 644` | AC-848 | `src="/assets/a.png"` → `src="assets/a.png"`; `href="/pricing"` → `href="pricing"` |
| `tests/reconciliation-l1-shared-axis-groups.test.ts:211` | AC-685 | `src: url("/fonts/ok.woff2")` → `url("fonts/ok.woff2")`. Adjacent font-family injection assertion untouched |
| `tests/reconciliation-l1-shared-axis-groups.test.ts:616` | AC-805 | `url("/assets/card.png")` → `url("assets/card.png")`. `not.toContain('example.test')` untouched |

Two assertions the review did not list — `navigation:239` (AC-840 `src`) and `navigation:644` (AC-848 `href`) — were also stale. They sit *after* the reported failure in the same test, so vitest never reached them; fixing only the reported lines would have produced a second red round.

**Warning — REQ-110 ticket body.** Appended a correction to `request-1b56fccd` recording that `writeManifest` uses a re-read comparison rather than R2 `onlyIf` etag (wrangler CLI does not expose conditional writes), that the TOCTOU window is narrowed rather than closed, and that the loud-failure property is preserved.

The remaining warning — quality reports running zero suites (`"suites": {}`) — is an XGD tooling defect the review itself scoped as independent of this bundle, and is not fixable from the bundle's code.

## Verification

- Three target suites: **22 passed, 0 failed**
- Full suite `npx vitest run`: **1022 passed, 0 failed**, 67 skipped (152 files passed, 4 skipped). Previous run was 1015 passed + 7 failed = the same 1022 — exactly the 7 recovered, no new failures and none traded away.
- `pnpm -r build`: exit 0, `tsc --noEmit` clean for `apps/public-site` and `apps/control-app`
- `git diff --stat`: 3 test files only, production code untouched

Note the bundle tickets' claim of "4 pre-existing failures" still does not reproduce — those 4 files are skipped in this environment, as the review observed. That discrepancy is unchanged by this fix and does not affect the gate.

## Confidence

High for the critical gate. The failures had a single mechanical root cause, all 7 are now green, and the full suite is at zero failures with the build clean — the one gate the review failed on is closed. No assertion was weakened: every expectation still pins an exact byte sequence, and AC-839/AC-842 are marginally stronger now that the expected href is an independent literal rather than a value derived from the test's own input.

Changes are left uncommitted in the worktree for the workflow's quality run to pick up.
