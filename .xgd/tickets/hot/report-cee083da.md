---
uid: report-cee083da
id: REPORT-7335
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:00:43.041797+00:00'
updated_at: '2026-11-01T06:00:43.041797+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-2bd9d184.md` (REQ-175). Class: intent/bookkeeping ticket (2e; a request ticket living in hot/). Rule: per-fact resolution, later state wins.
  - Frontmatter hunk (updated_at, completed_at, last_field_updated, status): HEAD wins. HEAD is the 2026-11-01 `free_and_reconciled` completion. Incoming 79eb7dc98f is the 2026-09-02 `draft` snapshot, so restoring it would regress a completed ticket.
  - Trailing body hunk: both sides had the same text (whitespace/EOL difference only), so one copy was kept.
  - The incoming body edit (Decisions D1–D6 and the "Not done here" sections) merged cleanly and is kept.

## Incoming changes preserved

There are no code files. Diffing the resolved file against 79eb7dc98f shows only HEAD's newer frontmatter (status/timestamps/commits/version/bundled_in). Every body change from the incoming commit is present. The incoming commit's stale frontmatter values (status: draft, completed_at: null) were superseded by HEAD's later completion state, following the 2e per-fact "later wins" rule.

## Notes

The unstaged `.xgd/_changes/log.ndjson` and `meta.json` and the untracked `report-6c93fd5c.md` were not part of the conflict and were left untouched for the finalize step.
