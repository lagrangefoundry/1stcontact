---
uid: report-d29d9f76
id: REPORT-7487
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:34:23.218967+00:00'
updated_at: '2026-11-01T07:34:23.218967+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` (REQ-184): AA (both added), intent/bookkeeping ticket (2b/2e). Resolved to OURS (HEAD) via `git checkout --ours` + `git add --sparse` (path outside sparse cone).
  - Incoming 7eb0dcc2d5 "xgd(ticket): create request request-95dffc48" is the ticket's original creation snapshot (2026-09-04, status: draft, story_points: 2).
  - Ours is the same ticket after being worked and bundled (updated_at 2026-11-01, status: bundled, bundled_in: bundle-94dbe947, working_sha recorded, story_points: 3, body rewritten to past tense with a Test plan section).
  - Ours supersedes incoming on every differing fact; the incoming draft prose (proposal tense, "blocked until REQ-178/179 reconcile", conditional acceptance lines) was explicitly replaced by later edits on the ours side. Per the enrichment rule (intent unknown on one side -> take the more recent by timestamp), ours (Nov 1) wins over incoming (Sep 4).
  - Resolved content is byte-identical to HEAD (blob 7e3a5ef8cf); staged diff vs HEAD is empty, so finalize should detect a no-op commit.

## Incoming changes preserved

No code files involved. The incoming commit only created this ticket; that creation is already present in HEAD in a later, evolved form, so the commit is redundant rather than discarded.

## Flag for post-merge review

Per the enrichment resolution rule, flagging `.xgd/tickets/hot/request-95dffc48.md` for post-merge review (low risk: incoming is a strict ancestor-in-content of ours).
