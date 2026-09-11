---
uid: report-38eca6a1
id: REPORT-3646
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-26'
created_by: xgd
created_at: '2026-09-10T03:18:55.694474+00:00'
updated_at: '2026-09-10T03:18:55.694474+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-26
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — class **UU**, rule **2e (intent/bookkeeping ticket)**, per-fact resolution by working-timeline position.
  Resolved to the HEAD side (`git checkout --ours` + `git add --sparse`). No hand-editing of the ticket file.

### Why

Incoming commit `a4af54d0` ("xgd(ticket): update bundle bundle-b3b7c399", 2026-08-29
21:33:05 -0700). Three-way blobs: base `4680e71d`, ours `bb444506`, theirs `c14f2fbd`.

- **Incoming vs base — the ENTIRE diff is two lines** (1 file, 2 insertions, 2 deletions):
  - `updated_at`: `2026-08-30T04:32:26` → `2026-08-30T04:33:05`
  - `status`: `ready_to_reconcile` → `reconciling`
  It touches no other field, no `fields.*` entry, and no body text.

- **HEAD (`8e07e601`, 2026-08-31 07:23:04 -0700 — ~34h later)** holds the terminal
  lifecycle state for this bundle:
  - `status: free_and_reconciled`
  - `completed_at: 2026-08-31T14:22:24`
  - `last_field_updated: result`
  - `result: pass`, `merged_at_commit: eef7a8b4`, and `fields.commits` carrying the
    resolved `old_sha`/`new_sha` mapping.

Both facts the incoming commit touches (`status`, `updated_at`) are facts HEAD also
changed, from a later-positioned intent. There is **no disjoint fact on the incoming
side**, so 2e's "apply BOTH" and "keep the superset" branches do not apply; the
genuine-conflict branch does, and it selects HEAD for each fact. Taking ours in full
is therefore identical to the per-fact result.

This is the immediate successor of the commit resolved at attempt 77 (`3fa48a6b`,
`reconciling` → `ready_to_reconcile`); together the pair is a retry reset and its
re-entry into `reconciling`, both superseded by HEAD's terminal `free_and_reconciled`
with `result: pass`. Reinstating `reconciling` would revert an operator-owned terminal
status and orphan `result`/`merged_at_commit`.

## Incoming changes preserved

No code/implementation files were in this conflict — the sole conflicted path is an
xgd bookkeeping ticket (kind `bundle`), so STEP 3's code-discard guard has no code
file to check.

For the ticket itself, the incoming commit's single intent (`status: reconciling`) is
deliberately absent from the resolution. That is the correct outcome of 2e's timeline
rule, not a discard of developer code: it is an intermediate lifecycle value that the
HEAD side superseded ~34 hours later with the terminal value `free_and_reconciled`. No
BUG-1301 precedence exception was needed or invoked; no test function was deleted.

## Staging state

`git ls-files -u` → 0 unmerged entries; `git status --porcelain` shows no
conflict-class lines. The staged diff vs HEAD is empty (the resolution nets to no
change), which per STEP 4 is expected — `cherry_pick_finalize_resolution` will detect
the clean staged diff and skip the commit. `CHERRY_PICK_HEAD` still resolves to
`a4af54d0`; no `--continue`/`--skip`/`--abort`/`reset` was run.
