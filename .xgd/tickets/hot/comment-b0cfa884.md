---
uid: comment-b0cfa884
id: COMMENT-665
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T20:05:45.940104+00:00'
updated_at: '2026-08-05T20:05:45.940104+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-292d4308
  kind: note
---

**Result: FAIL** — REPORT-1310 (`report-292d4308`), 4 violations, 0 warnings, 0 needs_review.

## What I found

CAP-64 (`gradient_fidelity`) was absorbed into CAP-63 (`1c_capture_diff_fidelity`) by the 2026-08-05 rebalance. **No intent coverage was lost** — REQ-59 and REQ-62 (both `free_and_reconciled`, via BUNDLE-6) remain fully expressed by STORY-76 plus its five ACs (AC-634…AC-638, all `active`, all `uat_coverage: pass`) under CAP-63, whose Scope section explicitly names gradients as an owned axis.

The failure is that the absorption was left **half-finished**:

1. **Capability never retired** — `status: active` with `merged_into` set and zero live stories. CAP-68 (`capability-bd0b722e`) is the working precedent: `status: superseded` + `superseded_by_uid`. CAP-64 has neither, so it re-enters `capability_validation` forever — this run being the proof.
2. **Body contradicts itself** — the first four paragraphs claim present-tense ownership ("Stories under this capability document…") against zero stories, directly contradicting the ABSORBED footer appended in the same commit.
3. **Dangling report pointer with an unsubstantiated blocker** — the body says it "could not be set to `status: deprecated` … see the rebalance report." No such report exists (latest `structural_rebalance` is REPORT-1071, 2026-08-02). And the claim doesn't hold: `deprecated` is a valid lifecycle value (`constants.py:117-120`, `web.py:49-52`), nothing validates against it, and the rebalance's own writes to this ticket succeeded in the same run (`e437887ae`, `092667267`).
4. **Real index defect** — the index holds a stale duplicate: the `capability_uid=capability-36dd68c5` filter returns STORY-76, while `xgd ticket get story-82eb6908` (reads the file, not the index) shows `capability_uid: capability-aa030c83`. Also `xgd ticket get STORY-76` fails on human ID while the UID resolves fine.

## Two things worth your attention beyond this capability

**This is systemic.** Seven capabilities carry `merged_into` while still `active` — CAP-64, 65, 66, 67, 69, 72, 73. Only CAP-68 was ever actually retired. Fixing CAP-64 alone leaves six identical husks each burning a validation cycle; a single sweep would be better.

**Possible root cause of the retirement gap:** `merged_into` looks ad-hoc, while `superseded_by_uid` is the field the supersession-chain walker (`supersession.py`) actually traverses. Capabilities carrying only `merged_into` are invisible to it — worth confirming which field the rebalance should be writing.

I flagged index-rebuild-first as the fix sequence, since repairing ticket bodies while the index still reports a phantom story invites a second round of confusion. Per the read-only constraint I made no ticket, test, or code changes.
