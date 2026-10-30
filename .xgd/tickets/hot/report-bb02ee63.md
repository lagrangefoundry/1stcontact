---
uid: report-bb02ee63
id: REPORT-5245
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T01:42:19.324185+00:00'
updated_at: '2026-09-28T01:42:19.324185+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — **AA** (both added), intent/bookkeeping
  ticket (bundle), rule **2e** applied per-fact with the commit-timestamp
  tie-break (bundles carry no `intent_uid`, so `xgd working-timeline` has no
  input). Resolved to the **ours / HEAD** side in full.

  - Incoming (`830f0264` — `xgd(ticket): create bundle bundle-b3b7c399`,
    2026-08-23 19:10:41 -0700) is the ticket's **creation state**:
    `status: ready_to_reconcile`, `updated_at == created_at`,
    `completed_at: null`, `last_field_updated: created_at`, and a 24-entry
    `commits` list of bare `working_sha` values with `reconcile_sha: null`,
    `main_sha: null`, `working_sha_history: []`.
  - Ours (`8e07e601` — `xgd(ticket): update bundle bundle-b3b7c399`,
    2026-08-31 07:23:04 -0700, 8 days later) is the **completed lifecycle
    state** of the same ticket: `status: free_and_reconciled`,
    `completed_at` set, `result: pass`, `merged_at_commit:
    eef7a8b48bfa15c54b64db9541a0e781a016ba9e`, a 140-entry `orphan_commits`
    remap table, and a `commits` list collapsed to the single post-reconcile
    entry carrying that `main_sha`.
  - Both sides touch the *same* facts, not disjoint ones: the four frontmatter
    scalars (`updated_at`, `completed_at`, `last_field_updated`, `status`) and
    the `commits` field. In every case the ours side is the later value,
    produced by the reconcile/merge that the incoming creation commit
    predates. Taking incoming would regress `free_and_reconciled` →
    `ready_to_reconcile` and drop `orphan_commits`, `merged_at_commit`, and
    `result`.
  - Nothing exists only on the incoming side that ours does not supersede.
    The markdown body is byte-identical apart from a trailing-newline
    artifact, so there is no disjoint content to compose. The 24 pre-reconcile
    `working_sha` values are deliberately absent from ours: reconcile replaced
    the per-commit list with the single squashed `main_sha` entry. That
    replacement is itself the later fact, so re-introducing the raw list would
    corrupt the post-reconcile state rather than preserve information.

  Net staged diff against HEAD is empty, which is the expected outcome: HEAD
  already contains this ticket's creation plus every subsequent lifecycle
  transition. `--skip` was **not** invoked; the finalize step owns that.

## Incoming changes preserved

No code/implementation files were in conflict — the single conflicted path is
an xgd bookkeeping ticket, not source. No hunk was dropped under the BUG-1301
precedence exception, and no test function on either side was touched or
deleted.

For the one resolved ticket, "preserving incoming" means preserving the intent
the creation commit recorded, and HEAD's version *is* the replay of that
creation plus the later reconcile operations on the same ledger. No
developer-authored content was discarded.
