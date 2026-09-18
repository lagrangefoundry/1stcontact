---
uid: report-7b69e6bf
id: REPORT-4352
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-27'
created_by: xgd
created_at: '2026-09-18T08:20:01.713123+00:00'
updated_at: '2026-09-18T08:20:01.713123+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-27
---

## Files resolved

- `.xgd/tickets/hot/request-b88b79fe.md` (REQ-154) — class **UU**, rule **2e** (intent/bookkeeping ticket, `request-*`). Resolved per-fact toward HEAD; result is byte-identical to the HEAD blob.

Two conflicted hunks, both in frontmatter (the body merged clean — the incoming commit did not touch it, so HEAD's reflow was kept automatically):

1. `status` / `updated_at`
   - incoming (`04d4a984`, 2026-08-28): `status: free_coded`, `updated_at: 2026-08-28T16:38:43`
   - HEAD (`d86cbfd7`, latest of 8 ticket commits on this branch): `status: bundled`, `updated_at: 2026-08-31T05:05:09`
   - Not competing edits to the same fact: these are sequential lifecycle states. HEAD already passed through `free_coded` and advanced to `bundled`. Kept HEAD — taking incoming would have reverted an operator/workflow-owned status backwards.

2. `fields.bundled_in: bundle-8eef3846`
   - HEAD-only addition; incoming never had this field. Non-overlapping addition, kept.

No fields were invented, and no `intent_uid` / `story_uid` / `capability_uid` was touched.

## Incoming changes preserved

The incoming commit `04d4a9841d21e747bc4da7a56798d12115ce8f8c` ("xgd(ticket): update request request-b88b79fe", 7 insertions / 2 deletions) changed only frontmatter. Its substantive payload — the `free_coded` promotion record — is **already present verbatim in HEAD** and merged without conflict:

```
  commits:
  - working_sha: 29c0e86dd321b509e06f0dd9e531392ee9190b0e
    reconcile_sha: null
    main_sha: null
  version: 0.2.16
```

Same `working_sha`, same `version`. Nothing was discarded: the only incoming lines not carried forward are `status: free_coded` and its `updated_at` timestamp, both superseded by HEAD's later `bundled` state, which is downstream of `free_coded` in the same lifecycle.

This is the STEP 3 "redundant, not discarded" case: the staged tree nets to no diff vs HEAD because the commit's effect already landed on this branch by another route. Per STEP 4, the file was staged and the cherry-pick sequencer was left untouched (`CHERRY_PICK_HEAD` still present) for `cherry_pick_finalize_resolution` to skip.

No BUG-1301 precedence exception was invoked; no test files were involved.
