---
uid: report-e1987d8f
id: REPORT-5241
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:22:52.468801+00:00'
updated_at: '2026-09-28T01:22:52.468801+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/request-23fd6e61.md` — **UU**, intent/bookkeeping ticket
  (`request-*`), rule **2e** (later-positioned intent, per fact).
  Single conflict region: the status-lifecycle frontmatter block
  (`updated_at`, `completed_at`, `last_field_updated`, `status`).
  - Ours (HEAD, commit `02c0d390`, 2026-08-31): `status: free_and_reconciled`,
    `completed_at: '2026-08-31T14:22:44'`, `updated_at: '2026-08-31T14:22:44'`.
  - Incoming (`95ffc177`, 2026-08-23): `status: ready_to_reconcile`,
    `completed_at: null`, `updated_at: '2026-08-24T01:15:24'`.
  - `last_field_updated: status` on both sides — no divergence there.
  Resolution: took ours for all four facts. HEAD is later by one week on
  every conflicting field AND strictly further along the ticket lifecycle
  (`ready_to_reconcile` → `free_and_reconciled`). Taking incoming would have
  regressed an operator-owned status field backwards, which 2e's
  later-positioned-intent rule exists to prevent.

## Incoming changes preserved

No code/implementation files were in conflict — the only conflicted path is a
bookkeeping ticket, so there is no developer source to preserve.

For completeness, a full ours-vs-theirs diff of the ticket
(`git show HEAD:<path>` vs `git show 95ffc177:<path>`) shows exactly two
difference regions, and incoming contributes no fact that is not already
superseded on the ours side:

1. The status-lifecycle block above — incoming is an earlier snapshot of the
   same four fields; ours has advanced past it.
2. `fields.bundled_in: bundle-b3b7c399` — present on ours, absent on incoming.
   This auto-merged in ours' favour (an ours-only addition relative to the merge
   base) and is retained in the resolved file at line 29. Incoming's lack of the
   key is consistent with it predating the bundling, not with an intentional
   removal.

So incoming is a strict earlier-state subset here; nothing from it was
discarded that it still asserted. No BUG-1301 precedence exception was
invoked, and no test functions were touched.

Note: because the resolution equals HEAD exactly, `git status --porcelain` is
now empty — the staged diff for this cherry-pick is clean. Per the workflow
contract this step did not call `--skip`; CHERRY_PICK_HEAD remains present for
the finalize step to handle.
