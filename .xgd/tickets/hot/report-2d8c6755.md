---
uid: report-2d8c6755
id: REPORT-7725
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:35:53.068205+00:00'
updated_at: '2026-11-01T15:35:53.068205+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-95dffc48.md` — intent/bookkeeping ticket (2e; request ticket, outside sparse cone). Rule: keep the superset / more recent side. Resolved with `git checkout --ours` + `git add --sparse`.
  - Frontmatter: HEAD side is newer (updated_at 2026-11-01T13:58:44, status `free_and_reconciled`, completed_at set) vs incoming (updated_at 2026-09-05T00:12:49, status `free_coding`, completed_at null). Taking incoming would regress ticket state; enrichment rule "take the more recent commit by timestamp" also selects HEAD.
  - Body: HEAD is a strict superset of incoming — identical text plus one added paragraph ("This also settles an ordering question: [[REQ-185]] … must run after this rename"). Final hunk differed only in trailing whitespace.

## Incoming changes preserved

No code files in conflict. The incoming commit (c14fcf45c6, "xgd(ticket): update request request-95dffc48") is an older snapshot of the same ticket; all of its body content is present in HEAD, and its frontmatter values (status free_coding, story_points last-updated) are superseded by HEAD's later status advance. The resolution nets to no diff vs HEAD — redundant commit, not a discard; finalize step may skip it.
