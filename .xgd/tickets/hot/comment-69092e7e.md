---
uid: comment-69092e7e
id: COMMENT-8041
type: comment
title: Claude response for fix_plan report
created_by: xgd
created_at: '2026-11-08T22:10:15.590171+00:00'
updated_at: '2026-11-08T22:10:15.590171+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-f50da2d3
  kind: note
---

I filed the revised iteration 6 fix plan as **REPORT-11591 (report-f50da2d3)**. It is saved locally, but the push to GitHub was blocked by the sandbox, so it may not be on the remote yet. AC-2479 is still expected to fail after this plan runs; the plan only fixes AC-2026.

**Why the first attempt was refused:** an earlier review (report-07babd4a) found that a `code_frozen` grant on this story's batch 0 was wrong. The problem was an unapproved `fidelity-core.ts` edit, not `interact.ts`. Even so, that review bars `code_frozen` on batch 0 of story-58b2cec4 for good. This plan doesn't ask for the grant again, and doesn't move it to another batch number to get round the review.

**The plan has two batches and no overrides:**
- **Batch 0 – AC-2026, test changes only.** The test is updated to the six kinds and nine keys that `fidelity-surface.json` already declares (lines 9-64 at the reference). AC-2026 itself was already rewritten in attempt 1. Passing this test should also clear the orphan. This is decided at rung 1: REQ-218 and REQ-216 require that shape.
- **Batch 1 – AC-2479 and the other drive-the-draft tests, rung 3.** The test is right and the code is wrong. I re-checked `interact.ts` at the reference:
  - `fillNames` adds a field's `name` attribute and `id` (lines 204-205).
  - Menu options are matched by words or value in a single pass (lines 280-284).
  
  REQ-216 forbids both. Aligning the AC to the code isn't allowed, because REQ-216 is a later intent in scope that says the opposite. With code frozen, the builder is told to leave the test and AC alone, make no code edits, and report the batch `stuck` with `blocked_by: code_frozen`. The report names the exact fix: drop `name` and `id` from `fillNames`, and match options by words first, then by value only if no option's words match.

I split the two batches because they use different test files and different production files. That way the AC-2026 fix isn't held back by a batch that is meant to end stuck.

**Decision for you:** AC-2479 can't pass inside this reconciliation run. It needs the `interact.ts` change made somewhere code edits are allowed, such as a separate upgrade or bug story.

I also flagged two passing REQ-216 tests whose fixtures could never catch these two bugs.