---
uid: report-29d765ed
id: REPORT-5299
type: report
title: 'Resync resolve conflicts: b6b7f564f0bf1ee0904f0b6aa25ee3ca053055f0'
created_by: xgd
created_at: '2026-09-28T06:19:43.808099+00:00'
updated_at: '2026-09-28T06:20:39.566918+00:00'
completed_at: null
last_field_updated: title
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-377b581e
---

## Files resolved

- `.xgd/tickets/hot/bundle-b3b7c399.md` — UU, intent/bookkeeping ticket
  (`bundle-*.md`), rule **2e**. Outside the sparse-checkout cone, so the
  conflict lived in the index; resolved with `git checkout --ours --` then
  `git add --sparse --`.

  Single conflicted hunk, four frontmatter scalars, changed differently on
  both sides — a genuine 2e conflict, so the tie-break is the
  later-positioned intent. Both sides carry the same `uid`
  (`bundle-b3b7c399`), so `xgd working-timeline <uid> <uid>` has no two
  operands to compare; fell back to commit timestamp per the same
  "later-positioned" fact:

  - OURS — commit `8e07e6015d`, 2026-08-31T14:23:04Z:
    `status: free_and_reconciled`, `completed_at: 2026-08-31T14:22:24Z`,
    `last_field_updated: result`.
  - INCOMING — commit `3fa48a6b72`, 2026-08-30T04:32:26Z:
    `status: ready_to_reconcile`, `completed_at: null`,
    `last_field_updated: status`.

  OURS is 2 days later and is also the strictly downstream lifecycle state
  (`ready_to_reconcile` → … → `free_and_reconciled`). Taking incoming would
  have regressed BUNDLE-20's status and dropped its `completed_at` and
  `result`. Resolved to OURS.

## Incoming changes preserved

No code files were in conflict — the only conflicted path is a bookkeeping
ticket, so rule 2c does not apply and no developer code was at stake.

Diffing the conflict stages, the incoming commit `3fa48a6b72` changes
**nothing else** in this file: base(1) → incoming(3) is exactly four lines,
all inside the single conflict region (`updated_at` bump and
`status: reconciling` → `ready_to_reconcile`). There is therefore no
non-overlapping incoming content to carry forward, and the resolved file is
byte-identical to HEAD outside the hunk.

The one incoming change — the advance to `ready_to_reconcile` — is not
discarded developer intent but a superseded lifecycle step: HEAD's
`free_and_reconciled` is the state that transition was leading to, reached
by the ours-side ledger (base → ours is +289/−99, collapsing the 40-odd
per-commit `working_sha` entries into a single reconciled entry with
`main_sha: eef7a8b48b` plus the `orphan_commits` old→new mapping). No
BUG-1301 precedence exception was invoked; no test function on either side
was touched.

`git status --porcelain` is empty: the resolution leaves no net change from
HEAD. Per STEP 4 this is expected and `--skip` was **not** called — the file
is staged and `CHERRY_PICK_HEAD` is left intact for the finalize step.