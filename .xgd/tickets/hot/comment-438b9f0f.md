---
uid: comment-438b9f0f
id: COMMENT-856
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-09T01:05:49.930084+00:00'
updated_at: '2026-08-09T01:05:49.930084+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8c6c169a
  kind: note
---

Cluster 1 resolved. Report **REPORT-1710** (`report-8c6c169a`) created with `cluster_id: "1"`, `report_kind: overlap_resolution`, `subject_uid: report-69e94af9`, result `pass`.

## Outcome: all three stories confirmed — no ticket mutations

| Story | Capability | Action |
|---|---|---|
| STORY-99 `story-e674c60a` | CAP-85 Builder Workspace | confirm |
| STORY-100 `story-37a3921b` | CAP-86 Structured Copy Editing | confirm |
| STORY-101 `story-3bf94bd4` | CAP-87 In-Page Copy Editing | confirm |

The flagged ambiguity is in the capability *prose* — two capabilities describe the same physical artifacts (the origin carrying edit operations, the origin serving the gesture's client code). At the AC level the boundary is drawn on the **subject** of each criterion rather than the mechanism it runs through, and it holds cleanly:

- **AC-992** (write path) asserts surface identity — same read, same fault code/path/hint, same both-renderings re-render as the CLI. Unobservable from the workspace side. CAP-85 owns only reachability (AC-964).
- **AC-1006** (gesture) asserts no drift between the reader and writer of the markup. Origin delivery is the verification mechanism, not the claim.
- **AC-1029** (workspace) covers mode registration only, and names CAP-87/STORY-98 and STORY-101 as out of scope in its own body.

Merge was considered and rejected for the two near-duplicate pairs (AC-982/AC-998 save, AC-984/AC-999 refusal): they observe at different layers — draft and rendered bytes at the CLI versus form state and displayed page in a real browser. Merging would collapse the layers and lose evidence on both sides.

One thing worth flagging, recorded in the report but **not acted on**: CAP-85's Scope prose claims the origin serves the gesture's client code and carries the write path's read/apply operations, but no AC under STORY-99 asserts either. The evidence exists — under AC-1006 and AC-992, where this resolution finds it correctly placed. So CAP-85's prose describes territory its own ACs don't cover. That's a capability-body/evidence alignment issue, outside this resolution's story-assignment mandate.
