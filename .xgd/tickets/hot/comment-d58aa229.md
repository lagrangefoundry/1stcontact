---
uid: comment-d58aa229
id: COMMENT-758
type: comment
title: Claude response for overlap_resolution report
created_by: xgd
created_at: '2026-08-07T16:05:31.020402+00:00'
updated_at: '2026-08-07T16:05:31.020402+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-8f9c7885
  kind: note
---

Cluster 5 resolved. `cluster_id: '5'` is stored as a string matching clusters 1–4, and the report is discoverable alongside its siblings via the iterator's query.

## Both stories: confirm, no change

Both already carry `capability_uid: capability-12fee326` (CAP-87), verified on the ticket files directly rather than via the index.

- **STORY-98** (the edit render) — moved during the CAP-87 consolidation earlier in this run; it carries `updated_by: bundle-15c1f647`. CAP-87's body has an explicit `### The edit render channel` section restating CAP-84's scope in full.
- **STORY-101** (click-to-edit gesture) — native to CAP-87's `### The click-to-edit gesture` section. It was never a CAP-84 story; CAP-84 explicitly put the editor UI out of scope.

## The cluster premise was half stale

"Still named as owner by two sibling stories" doesn't hold. That claim comes from a stale index hit — the canonical `main` index holds the pre-consolidation mapping while this worktree's overlay holds the post-consolidation one. A `grep` for `capability-25f7e486` across `.xgd/tickets` finds only the capability's own file, three survey reports, and index metadata — **no story or AC file references CAP-84 at all**. Same canonical/overlay divergence documented in clusters 1–4; self-correcting on merge-back.

## What was actually fixed

The real residue is the other half: CAP-84 sitting `active` and empty with its scope fully absorbed. Left that way, a future edit-render story has two plausible homes — exactly what re-flags this cluster next survey. Retired it via the cluster-1 pattern:

```
capability-25f7e486 (CAP-84)
  status: active → superseded
  superseded_by_uid: capability-12fee326
```

I chose `superseded` over `deprecated` deliberately. Beyond the semantics (absorbed, not retired), it's the route that actually lands: `reject_deprecation_if_capability_has_stories` gates only `deprecated`, and its `count_attached_stories()` reads the canonical index — which still believes STORY-98 is attached. A `deprecated` patch would have been refused *silently* (exit 0, no diagnostic). That's what happened to CAP-83 in cluster 4, which still sits at `status: active` carrying only `merged_into`. I re-read the ticket file to confirm this write persisted rather than trusting the success message.

## Integrity

2 stories before and after, no content edited, none archived or created. 27 ACs unchanged (13 on STORY-98, 14 on STORY-101), none moved story — so **no `test_UAT_AC<N>_*` renaming was implicated**.

One thing for the operator: `xgd ticket audit` will keep reporting CAP-84 as active until the canonical index is rebuilt from `xgd-working`. The ticket file is correct; the index isn't. `rebuild-index` refuses on a branch worktree by design, so it can't be cleared from here — same caveat as clusters 1–4.
