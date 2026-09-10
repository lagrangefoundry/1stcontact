---
uid: comment-3fdbe8c0
id: COMMENT-2606
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-09-10T21:20:47.787393+00:00'
updated_at: '2026-09-10T21:20:47.787393+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-0c0a10a3
  kind: note
---

**REPORT-3800** (`report-0c0a10a3`) — **FAIL**: 1 violation, 2 warnings, 0 needs_review.

## What I checked

CAP-90 has one story (STORY-103, `upgrade`) with 23 active ACs and 24 AC-named UATs across five suites. Every AC has at least one substantive test, and evidence validity holds throughout — the only double in any suite is the Anthropic client speaking the real streaming wire contract (BUG-39's ask has landed in `tests/support/scripted-model-client.ts`), plus a stub embedder through the production `LAGRANGE_KM_EMBEDDER` seam that the story body already records as a caveat. No internal component is mocked anywhere.

## The one blocker

**AC-1320** (`acceptance_criterion-ceeb657c`) — its title says the ordinary state is silent *"on either host"*, and its Verification demands the deployed-host observation explicitly. `test_UAT_AC1320_…` (`tests/reconciliation-assistant-conversation-knowledge.test.ts:415`) runs entirely in the Node host against a workspace `corpusDir()`. Nothing in the workers project asserts it — `apps/control-app/` contains no reference to knowledge at all. The deployed leg is structurally true (REQ-158, the KB-in-the-Worker intent, is `draft`) but never demonstrated, which is precisely the "ordinary state vs suppressed failure" distinction the criterion exists to make observable. The fix is ~15 lines in an existing workers suite, not production code.

## The two warnings

- **AC-1057** — "Do this on both hosts" is covered on the local host only; the deployed replay is evidenced in-tree, just under AC-1404 and AC-1456's tests rather than its own.
- **AC-1405** — the stored form is proven byte-for-byte, but portability is exercised by re-filing bytes *within* the deployed runtime; neither direction of the actual host-to-host read runs.

All three are the same shape: criteria rewritten on 2026-08-31 to hold on both hosts, paired with tests written against the host the criterion originally lived on. I flagged that as a class in the notes so the fixer checks all three together rather than one at a time.

Two things I did not do: I ran no tests (execution is REPORT-2075's subject; `uat_coverage` already reads `pass`), and I modified nothing — the check is read-only.
