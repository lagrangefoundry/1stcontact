---
uid: comment-114827dd
id: COMMENT-2505
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T09:27:31.989881+00:00'
updated_at: '2026-09-10T09:27:31.989881+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-12605dba
  kind: note
---

Report filed: **REPORT-3706** (`report-12605dba`) — **FAIL**, 3 violations, 2 warnings, 0 needs_review.

## What I found

**Ledger note:** no reconciled intent has landed since STORY-99's last update (2026-08-31). BUNDLE-22 and REQ-162 both reconciled that day but ask nothing of this capability (REQ-154 resolved by in-Worker request interception — "No HTTP route answers the screenshot capability"), and REQ-158/REQ-161 (the KB surface and the Library tab) are still `draft`, so the story's single-tab claim is current (`config.js:50` — `TABS = [SITE_TAB]`). The 2026-08-31 rewrite absorbed the workerd relocation, the deleted proxy, build artifacts, the Access qualification and the cold-start bootstrap correctly.

**Violation 1 — new drift, and the only one describing a property the product lacks.** STORY-99's Technical Context and AC-1033 both assert a rendering is reused between requests, held against the store handle, and that "the deployed origin has one store per account, so the two are equivalent there". BUG-37 (`bug-6612c4b7`, free_and_reconciled, BUNDLE-21) recorded the measured opposite — the `PREVIEWS` WeakMap is dead in the Worker because `storeFor` builds a fresh handle per request — and deliberately declined to fix it. `store.ts:79-83` documents that same per-request construction. The 2026-08-31 reconciliation block absorbed BUG-36 in detail and BUG-37 not at all; its header even mislabels the BUG-36 work as "item 2" (warning 5), which is why the miss reads as already-handled.

**Violations 2 and 3 — both from REPORT-2100 (2026-08-16), never repaired.** There is no `fix_structural_validation` report for this capability after 2026-08-07, so no fixer ever saw them. The CAP-85 capability body scopes two properties here that STORY-99 and all 36 ACs correctly omit: the edit-client bridge's one-source/no-drift claim, and `/api/copy` as a semantics-free transport. Applying Step 2.5, both are implemented and substantively tested — under CAP-87 AC-1006 and CAP-86 AC-992 respectively, each with a real UAT. REPORT-2100 offered an unresolved either/or; I've resolved it: narrowing the capability body is the only repair that doesn't create a duplicate, since adding ACs to STORY-99 would turn two coverage violations into two exclusivity violations. The report says that explicitly so the fix loop doesn't take the wrong branch.

One item flagged outside my subject: CAP-86's AC-992 still asserts a save re-renders "both … rendered outputs **on disk**", which REQ-119 removed — CAP-85's own AC-1031 asserts the opposite. That belongs to CAP-86's cycle.
