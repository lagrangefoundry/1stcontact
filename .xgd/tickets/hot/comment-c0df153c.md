---
uid: comment-c0df153c
id: COMMENT-754
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T15:44:47.421088+00:00'
updated_at: '2026-08-07T15:44:47.421088+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-60111ba3
  kind: note
---

Cluster 1 resolved.

## What I found

The overlap was not a misfiled story — it was capability-layer residue from earlier in this same run.

- **STORY-93** (`story-86c7c21b`) already carries `capability_uid: capability-b4ac88fc` (**CAP-89**). The structural-rebalance step earlier in this regression created CAP-89, consolidating four thin capabilities that "share one subject — the site's own material inventory," and moved STORY-93 into it.
- **CAP-81**'s entire scope is restated inside CAP-89 § "The authoring start point" — the ladder-is-the-capture-ladder convention, theme-token colour, one-shape/no-mode-selection, and import non-contamination all appear verbatim in substance.
- CAP-81 was left `active` with **zero** attached stories.

## Actions

| Story | Action | Result |
|---|---|---|
| STORY-93 | **confirm** | Correctly in CAP-89. No change; all 8 ACs (AC-869…AC-876) untouched. |

The real fix was at the capability layer:

```
xgd ticket update capability-ccac1b1d --fields \
  '{"status": "superseded", "superseded_by_uid": "capability-b4ac88fc"}'
```

The capability schema has a purpose-built mechanism here — `status` enum is `active | deprecated | superseded`, with `superseded_by_uid` `required_when: status == superseded`. It also matches the ticketing invariant (`core/ticketing/invariants.py`), which reserves `active` for capabilities holding at least one non-archived story. I chose `superseded` over `deprecated` because CAP-81's scope wasn't retired, it was absorbed — and the pointer keeps the trail forward to CAP-89.

## Verified

- CAP-81 → `Status: superseded`, `superseded_by_uid: capability-b4ac88fc`, body intact.
- STORY-93 → `capability_uid: capability-b4ac88fc`, content untouched.
- No story in the working overlay points at CAP-81; CAP-89 holds 4 stories.
- No merges, archives, deletions or AC reassignments — so no `test_UAT_AC<n>_*` renaming needed.
- Report **REPORT-1575** (`report-60111ba3`) created with `cluster_id: '1'` stored as a string, and confirmed discoverable via the iterator's query.

One thing worth flagging, which I investigated and concluded is **not** a defect: `xgd ticket list --filter fields.capability_uid=…` returns STORY-93 under both capabilities. That's the canonical+overlay merge mid-run — the `main` worktree store still holds the pre-rebalance copy (STORY-93 → CAP-81, CAP-89 absent), while this regression worktree's overlay holds the post-rebalance copy. `xgd ticket get` resolves to the overlay, which is authoritative; canonical converges on merge-back. I left it alone and documented it in the report.
