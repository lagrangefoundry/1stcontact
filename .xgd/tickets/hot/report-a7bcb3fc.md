---
uid: report-a7bcb3fc
id: REPORT-7517
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T07:51:17.738260+00:00'
updated_at: '2026-11-01T07:51:17.738260+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-b813aa4a.md` (REQ-179). Class: intent/bookkeeping ticket (2e: a request ticket that lives in hot/ and sits outside the sparse cone, so the conflict was index-only). Rule: one side is a strict superset, so keep the superset (OURS / HEAD, stage-2 blob 4fcc0134).
  - Incoming f11f7e86 ("update request request-b813aa4a") changed only the frontmatter: status draft -> free_coding, last_field_updated depends_on -> status, updated_at -> 2026-09-05. The body is identical to the base.
  - HEAD already holds that body plus later facts: the "Implementation delta" section, a second commit entry (5bace72f), working_sha_history, story_points 4, version 0.2.69, bundled_in bundle-94dbe947, and status `bundled` (updated_at 2026-11-01, which is after the incoming change). HEAD's status supersedes the incoming free_coding transition, so it is the later and more advanced lifecycle state. This matches the enrichment rule "take the more recent commit by timestamp".
  - Staged via `git update-index --index-info` at stage 0, with skip-worktree restored because the file is out of the sparse cone.

## Incoming changes preserved

There are no code files. The incoming commit's only change is a status advance that HEAD's ticket has already moved past (free_coding -> ... -> bundled), so the resolution nets to no diff vs HEAD. The commit is redundant, not discarded. Flagged for post-merge review per the enrichment rule.
