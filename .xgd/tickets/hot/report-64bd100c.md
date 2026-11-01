---
uid: report-64bd100c
id: REPORT-7337
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:02:03.391610+00:00'
updated_at: '2026-11-01T06:02:03.391610+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-3f8737f2.md` (REQ-157). Class: intent/bookkeeping ticket (2e). UU, outside the sparse cone, so it existed only in the index. Rule applied: ours is a strict superset, so keep the superset.
  - Body: ours (HEAD, blob 0fed9f69) and theirs (incoming eed0f0394c, blob d2cee70d) are byte-for-byte identical below the frontmatter. HEAD already contains every incoming body change: the CHAT-35 field evidence restored, caretaker renamed to consultant, the "Behaviour the build settled" section, and the corrected `createL1Toolbox` single-slot wording.
  - Frontmatter: only the frontmatter differs. Theirs is the stale 2026-09-02T23:28 snapshot (status `free_coded`, last_field_updated `body`, reconcile_sha null). Ours is later (2026-10-30T21:51): status `free_and_reconciled`, completed_at set, reconcile_sha c7c55e26, `bundled_in: bundle-5607a08d`, working_sha_history fields. Ours is the more recent version of every differing fact.
  - Staged as stage-0 = ours. The skip-worktree bit is restored, so the file stays out of the sparse cone.

## Incoming changes preserved

There are no code files. Every body change in the incoming commit is already in HEAD, so the commit is redundant (BUG-1109/BUG-1122 shape), not discarded. The staged diff against HEAD is empty, so finalize should detect the clean diff and skip the commit.
