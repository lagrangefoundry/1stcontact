---
uid: comment-b5db825e
id: COMMENT-1332
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T16:06:49.048877+00:00'
updated_at: '2026-08-20T16:06:49.048877+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-aa53c15a
  kind: note
---

Done. Attempt 2 resolved the single violation.

**The fix — AC-1329 (`acceptance_criterion-ae2c7f77`), one `ac-edit`:**

Narrowed the fourth bullet and Verification to the runtime axis only, dropping `or which store it was given`, `store-dependent`, and `or on which store it was handed`. The first three bullets and the paragraph demoting the failing-set comparison were preserved verbatim, as the report directed. I added a scoping paragraph naming AC-1325 as the store axis's owner and AC-1321 as the reason it must not be re-broadened — the previous pass widened this criterion while answering a re-verifiability warning, and the note is there so a later pass doesn't repeat it.

**Verified rather than assumed.** This worktree's HEAD predates BUNDLE-19, so I read the load-bearing code from `origin/main`: `tests/reconciliation-site-storage-port.test.ts:187` does guard the two `empty-dir` assertions with `if (cwd !== null)`, and `tests/support/site-factory.ts:45`/`:123`/`:137` make `cwd` the backend discriminator by construction (`null` for the memory store). The removed clause did forbid precisely the assertion AC-1321 requires.

**Not resolved by touching AC-1321 or the test**, per the report's explicit instruction — the over-broad AC was the wrong element, not the sibling it collided with.

**No story-body-edit needed.** I checked STORY-118 for the same over-broad claim; its In-scope bullet reads "identical observable behaviour for the same starting site," which is AC-1325's scoped form. The matrix is consistent at this call boundary.

**No tests run, and none could be** — the port modules don't exist at this HEAD, so the tests AC-1329 describes aren't here to run. The edit was matrix-only.

Findings 2–4 were already-resolved info items; finding 5 (missing `test_UAT_AC1353/1354_*`) is explicitly uat-level and left for that cycle. Report filed as REPORT-2467 (`report-aa53c15a`) with `violations_remaining: 0`, `needs_more_work: false` — the assessor verifies next. One note: the report's git push failed on the sandbox network (`Broken pipe`); the ticket committed locally and will need a push from a networked context.
