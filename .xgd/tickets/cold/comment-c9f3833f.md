---
uid: comment-c9f3833f
id: COMMENT-655
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T19:23:02.182738+00:00'
updated_at: '2026-08-05T19:23:02.182738+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-1ba06894
  kind: note
---

Report schema verified. **REPORT-1299** (`report-1ba06894`) — result `fail`, 1 violation, 1 warning, 0 needs_review.

## What I found

**There is no intent drift.** The capability's cumulative intent is fully preserved — the failure is structural.

CAP-66 was absorbed into CAP-63 (`capability-aa030c83`) by the 2026-08-05 structural rebalance. Its two documented behaviors trace to BUNDLE-6 (REQ-58 pass-3, plan item 5), and STORY-79's Technical Context cites that provenance verbatim, down to the same commits (`4f681c73`, `a4323720`). CAP-63's Scope section carries the matching bullet. All three intents in the ledger (BUNDLE-6, -7, -8) are `free_and_reconciled`, and none retires a behavior the body describes.

**The violation is a matrix double-count.** The capability sits at `status: active` with zero owned stories, and the stale branch index still returns STORY-79 under it — so STORY-79 is counted under both capabilities. I verified this against the ticket record rather than trusting the index: STORY-79's actual `capability_uid` is `aa030c83`, and its listing under `ac7ca849` carries a stale `UPDATE:2026-07-29` against the current `2026-08-05`. The corroborating evidence is systemic — `xgd ticket list --type capability` returns 22 entries for 11 capabilities on this worktree.

Two points worth your attention beyond this capability:

- **This is not repairable by matrix editing.** The zero-story state is the correct end state of a deliberate merge. I flagged explicitly in the editor notes that authoring stories here would create a real exclusivity violation against STORY-79. The only correct repair is the status flip, blocked upstream.

- **It will recur seven more times.** The other absorbed capabilities (`36dd68c5`, `18a822ac`, `8108afab`, `6e088083`, `bd0b722e`, `938f26ec`, `ce902be4`) are in the identical state. The root cause is already diagnosed in `report-bdaf6840`: `reject_deprecation_if_capability_has_stories` → `attached_story_ids()` reads the index, which on a branch worktree resolves to the canonical main store holding pre-merge values, and `rebuild-index` refuses on branch worktrees by design. Both blockers live in the xgd system repo, not this project.

One thing to weigh: the same report notes the anchor report `report-31234d67`'s all-zero UAT counts were an artifact of a gitignored, never-rebuilt `uat_index.json`. Since that index feeds tree assembly, any capability health check re-run on this branch is unreliable — this run's other results included. Rebuilding the index on `main` and flipping all eight capabilities in one pass would clear the whole class; on intent grounds alone, this capability passes today.
