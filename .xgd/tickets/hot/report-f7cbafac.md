---
uid: report-f7cbafac
id: REPORT-7085
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-34'
created_by: xgd
created_at: '2026-10-31T22:45:00.762553+00:00'
updated_at: '2026-10-31T22:45:00.762553+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-34
---

## Files resolved

- `.xgd/tickets/hot/request-43ce519b.md` — intent/bookkeeping ticket (2e; request). UU, index-only (outside sparse cone). Both sides changed the same frontmatter facts (`updated_at`, `completed_at`, `last_field_updated`, `status`). Applied the enrichment rule "take the more recent commit by timestamp": kept OURS/HEAD (c949617b26, 2026-10-30T14:51:52-07:00) over incoming 4d5b5c3248 (2026-09-02T16:00:01-07:00). Resolved via `git checkout --ours` + `git add --sparse`. Flagged for post-merge review per the enrichment rule.

## Incoming changes preserved

No code files involved. The incoming commit changed only two metadata fields: `updated_at` (22:59:57 -> 23:00:01 on 2026-09-02) and `last_field_updated` (status -> story_points). It did not change any field value (`story_points: 5` is already identical on both sides). HEAD's state is two months later and reflects the ticket's later lifecycle (`status: free_and_reconciled`, `completed_at: 2026-10-30T21:51:42Z`). Applying the incoming side would have moved the status back to `free_coded` and cleared `completed_at`. The resolution nets to no diff vs HEAD, so the incoming commit is redundant (superseded), not discarded. Left for finalize to detect and skip.

Unrelated working-tree changes (`.xgd/_changes/log.ndjson`, `meta.json`, untracked `report-5184c6c8.md`) are xgd's own conflict bookkeeping. Left untouched.
