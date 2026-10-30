---
uid: comment-6045de10
id: COMMENT-5849
type: comment
title: Comment on bug BUG-316
created_by: xgd
created_at: '2026-10-30T20:45:05.716724+00:00'
updated_at: '2026-10-30T20:45:05.716724+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bug-d9778adf
  kind: note
---

Reconciliation review report-b5be9c7c (F1) ruled that recording this gap does not satisfy the override audit's trust-boundary item. The fix is folded back into the BUNDLE-32 reconcile run:

- AC-2067 (acceptance_criterion-827e8986) has been rewritten to require the frame. Its two UATs in `tests/reconciliation-assistant-looking-surface.test.ts` again assert that the frame opens before the image and closes after it.
- story-58b2cec4's Technical Context and Reconciliation Decisions now say the frame is kept.
- The production change, `contentBlocksFrom` in `tools/generate/src/cli/ai/fidelity-core.ts` carrying the surrounding text onto the first and last blocks, needs a **new rung-1 code_frozen grant** (REQ-157) scoped to that one file. Batch 0's code_frozen grant for story-58b2cec4 is denied, so the grant must come in a new batch. The review fixer has not made the production edit itself, because an ungranted edit is what failed report-84f2f9bc.

Resolve this bug once that grant's batch lands and AC-2067 passes.
