---
uid: report-bdd283ef
id: REPORT-7903
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-37'
created_by: xgd
created_at: '2026-11-01T23:52:29.006548+00:00'
updated_at: '2026-11-01T23:52:29.006548+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-37
---

## Files resolved

- `.xgd/tickets/hot/request-407a6fd8.md` (REQ-178) — intent/bookkeeping ticket (2e), UU, resolved per fact; flagged for post-merge review per the enrichment rule (intent unknown on both sides).
  - `updated_at` / `completed_at` / `status`: both sides changed the same fact. Took HEAD (2026-11-01, `free_and_reconciled`, completed) over incoming (2026-09-05, `free_coded`, completed null). The enrichment rule says the more recent commit by timestamp wins, and incoming would set a terminally reconciled ticket back to an earlier status.
  - `fields.commits`: HEAD is the strict superset. It records `reconcile_sha 11014d58…` for `cd6002e1…`, where incoming had null, and does not repeat the `fa0b857…` entry that incoming listed twice. Kept HEAD.
  - `fields.version: 0.2.68`: only incoming has this field (non-overlapping), so I applied it. It matches the ticket body, which says commit cd6002e17d carries the bump to 0.2.68.

## Incoming changes preserved

Not a code file. Of incoming d909bce767's changes: the status/timestamp advance (to `free_coded` on 2026-09-05) is superseded by HEAD's later `free_and_reconciled` state. The added commit entries for fa0b857/cd6002 are already present in HEAD, and HEAD's copies are more complete. The `version: 0.2.68` field is kept. Net staged diff vs HEAD: `+  version: 0.2.68`.

## Arbitration of last resort (BUG-1460)

Not used.
