---
uid: report-6da2be22
id: REPORT-7779
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:09:54.345884+00:00'
updated_at: '2026-11-01T16:09:54.345884+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/bug-61165116.md` (BUG-51): intent/bookkeeping ticket (2e). Rule: one side is a strict superset, so keep the superset. Kept OURS (HEAD, updated 2026-11-01, status `bundled`, bundled_in bundle-39edf66d). The incoming commit a8da3db5de ("update bug bug-61165116", 2026-09-05) is an earlier draft of the same ticket. It set the title, `severity: high`, and the Symptom/Mechanism/Defects/Recovery body plus a "Scope — to be agreed" section. HEAD already contains all of that. It also refines one Mechanism sentence, replaces the open-scope list with the agreed B1–B3 Required behaviour, Out of scope and a concrete Test plan, and adds the commits, version and bundled_in fields. HEAD is also more recent by timestamp (Nov 1 vs Sep 5), which matches the enrichment's resolution rule. Staged via `git checkout --ours` + `git add --sparse`. Flagged for post-merge review per the enrichment rule.

## Incoming changes preserved

No code files were involved. Each incoming change to the ticket (title, severity, body sections) is already in HEAD, in the same or a later, refined form. The commit is redundant rather than discarded, and the staged result has no diff vs HEAD (finalize will skip it).
