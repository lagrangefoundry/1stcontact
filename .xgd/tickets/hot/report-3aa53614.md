---
uid: report-3aa53614
id: REPORT-5300
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:24:03.862082+00:00'
updated_at: '2026-09-28T06:24:03.862082+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket
  (`bundle-*.md`), rule **2e**. Resolved with `git checkout --ours --` then
  `git add --sparse --` (each as its own Bash call, per BUG-1294).

  Incoming commit is `a4af54d04d0d7e89f9a6176572e56fc740b0dc44`. Single
  conflicted hunk, four frontmatter scalars changed differently on both
  sides — a genuine 2e conflict, so the tie-break is the later-positioned
  intent. Both sides carry the same `uid` (`bundle-b3b7c399`), so
  `xgd working-timeline <uid> <uid>` has no two operands to compare; fell
  back to commit timestamp per the same "later-positioned" fact:

  - OURS — commit `8e07e6015d`, 2026-08-31T14:23:04Z:
    `status: free_and_reconciled`, `completed_at: 2026-08-31T14:22:24Z`,
    `last_field_updated: result`.
  - INCOMING — commit `a4af54d04d`, 2026-08-30T04:33:05Z:
    `status: reconciling`, `completed_at: null`,
    `last_field_updated: status`.

  OURS is ~2 days later and is also the strictly downstream lifecycle state
  (`reconciling` → `ready_to_reconcile` → … → `free_and_reconciled`). Taking
  incoming would have regressed BUNDLE-20's status and dropped its
  `completed_at` and `result`. Resolved to OURS.

## Incoming changes preserved

No code files were in conflict — the only conflicted path is a bookkeeping
ticket, so rule 2c does not apply and no developer code was at stake.

Diffing the conflict stages, incoming commit `a4af54d04d` changes **nothing
else** in this file: base(1) `4680e71db5` → incoming(3) `c14f2fbd3f` is
exactly four lines, all inside the single conflict region (`updated_at`
bumped 39s, and `status: ready_to_reconcile` → `reconciling`). There is
therefore no non-overlapping incoming content to carry forward, and the
resolved file is byte-identical to HEAD outside the hunk.

The one incoming change — the transition to `reconciling` — is not
discarded developer intent but a superseded lifecycle step: HEAD's
`free_and_reconciled` is the state that transition was leading to, already
reached by the ours-side ledger (a single reconciled `commits` entry with
`main_sha: eef7a8b48b`, plus the `orphan_commits` old→new mapping). No
BUG-1301 precedence exception was invoked; no test function on either side
was touched.

## Note on the preceding attempt

The conflict base here (`4680e71db5`) is the blob that was the INCOMING side
of the previous attempt in this queue (commit `3fa48a6b72`, which advanced
`reconciling` → `ready_to_reconcile`). That attempt resolved to OURS for the
same reason and left a clean staged diff, so Python's finalize step skipped
the commit and HEAD is unchanged at `c88aed46b0`. This attempt is the next
commit in the same lifecycle run of status bumps for BUNDLE-20 and resolves
identically.

`git status --porcelain` is empty: the resolution again leaves no net change
from HEAD. Per STEP 4 this is expected and `--skip` was **not** called — the
file is staged and `CHERRY_PICK_HEAD` is left intact for the finalize step.
