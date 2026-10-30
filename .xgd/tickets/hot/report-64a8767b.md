---
uid: report-64a8767b
id: REPORT-4775
type: report
title: 'Resync resolve conflicts: 83359f1394c03e0df01a697708d2cb598a77bee9'
created_by: xgd
created_at: '2026-09-21T18:59:17.450479+00:00'
updated_at: '2026-09-21T18:59:17.450479+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-7b4182de
---

## Files resolved

- `.xgd/tickets/hot/request-bbff35c7.md` (REQ-160) — **UU**, intent/bookkeeping
  ticket (STEP 2e). Conflict was confined to the YAML frontmatter block
  (`updated_at` / `completed_at` / `last_field_updated` / `status`); the body
  merged cleanly. Per-fact resolution: every conflicting field is the *same*
  fact (the ticket's lifecycle state) written differently on each side, so the
  later-positioned intent wins for that fact. HEAD carries
  `updated_at: 2026-09-19T15:15:30`, `completed_at: 2026-09-14T10:29:11`,
  `last_field_updated: status`, `status: free_and_reconciled`; the incoming
  commit `20be4747de` is a 2026-09-01 update carrying
  `updated_at: 2026-09-01T19:34:20`, `completed_at: null`,
  `last_field_updated: body`, `status: draft`. HEAD's block kept. Taking the
  incoming side would have rewound the ticket from `free_and_reconciled` back
  to `draft` and regressed both timestamps by eighteen days.
  Staged with `git add --sparse` (path is outside the sparse-checkout cone on
  this resync branch, DOC-986 §2/§4.1).

## Incoming changes preserved

- `.xgd/tickets/hot/request-bbff35c7.md` — `git show 20be4747de -- <file>`
  shows the incoming commit made exactly two changes: the `updated_at` bump
  (a lifecycle fact, superseded above) and one body addition in the
  *Out of scope* section:

      [[REQ-171]] owns it, together with the session prompts and turn reminders it
      has to be written into.

  That sentence is present in the resolved file (line 216), so no incoming
  developer content was discarded. It arrived via a clean merge of the body
  region — it is already in HEAD from an earlier commit in this resync queue.

  Consequence: the resolved file is byte-identical to HEAD (`git diff HEAD`
  is empty), so this cherry-pick nets to zero change. Per STEP 4 the tree is
  left staged-clean with `CHERRY_PICK_HEAD` intact; `--skip` was **not**
  invoked — the finalize step owns that decision.

No BUG-1301 precedence exception was invoked; no test files were involved.
