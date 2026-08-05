---
uid: comment-1d0ccf19
id: COMMENT-650
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T19:08:52.338238+00:00'
updated_at: '2026-08-05T19:08:52.338238+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-784ccee5
  kind: note
---

**Result: PASS** — REPORT-1294 (`report-784ccee5`). 0 violations, 2 warnings, 0 needs_review.

## What I found

CAP-73 was **absorbed into CAP-71** by the 2026-08-05 structural rebalance (REPORT-1266) and now holds **zero stories by design**, retained as a historical pointer with `merged_into: capability-2049c9ec`.

The index initially appeared to contradict this — `--filter fields.capability_uid=capability-8108afab` returns STORY-86. That's a phantom: `story-24098299`'s actual field is `capability-2049c9ec`, and it correctly appears under CAP-71 with a current timestamp while the CAP-73 entry is stale at 2026-07-29. Reproduced twice.

Since an emptied absorbed capability isn't drift, the real question was whether the intent it used to carry survived the move. I verified that at body level rather than assuming it:

| Intent | Ask | In STORY-86? |
|---|---|---|
| REQ-86 | End-to-end 3-probe gate | Yes — the story's whole subject |
| BUG-7 | Row containers must tile children | Yes — "Flow direction" |
| BUG-8 | Reflowed cell lost across breakpoint | Yes — half-open intervals |
| BUG-9 | Recursive structure recovery | Yes — "region-aware and recursive" |

Both source bundles are `free_and_reconciled`, so all count. The fold/capture/substrate intents in those bundles (REQ-89/90/91/92, BUG-6/10/11) are correctly *absent* — STORY-86 explicitly scopes them to CAP-71/CAP-70.

## The two warnings

Both are the same upstream root cause, already filed in REPORT-1266, and **not repairable from this project's tickets**: `reject_deprecation_if_capability_has_stories` reads the canonical main store, which still holds pre-merge `capability_uid` values on a branch worktree, so it sees phantom stories and refuses deprecation — leaving CAP-73 `active` with zero stories. `rebuild-index` refuses on branch worktrees by design. These clear when the index is rebuilt on main.

## One thing to carry forward

Out of scope for this check, so I flagged it in the report rather than acting: STORY-86's body still references CAP-71 as an *external* dependency in three places ("Out of scope: the fold itself... (CAP-71)", the two dependency lines). Post-absorption the story lives *inside* CAP-71 next to STORY-84, so those reads as if the fold were elsewhere. The intent split is still right — STORY-86 owns the gate, STORY-84 owns the fold — but the phrasing should point at STORY-84. That's a `story-body-edit` for **CAP-71's** alignment pass.

Also worth knowing before any health re-run on this branch: REPORT-1266 records `xgd ticket list --type capability` returning 22 entries for 11 capabilities here, so capability-level counts from this worktree are unreliable regardless of this result.
