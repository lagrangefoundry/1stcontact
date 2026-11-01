---
uid: report-abe47727
id: REPORT-7389
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-35'
created_by: xgd
created_at: '2026-11-01T06:31:55.296252+00:00'
updated_at: '2026-11-01T06:31:55.296252+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-35
---

## Files resolved

- `.xgd/tickets/hot/request-20bd7d63.md`: intent/bookkeeping ticket (rule 2e, per-fact). UU conflict in the frontmatter only; the body is identical on both sides apart from the incoming side dropping the trailing newline.
  - `updated_at` / `completed_at` / `last_field_updated` / `status`: both sides changed these. HEAD has `free_and_reconciled` (2026-11-01, a later lifecycle state). Incoming has `free_coded` (2026-09-03). Kept HEAD because it is the more recent state, matching the enrichment rule "take the more recent commit by timestamp".
  - `commits` list: HEAD is a strict superset of incoming. Same 4 `working_sha`s, plus `reconcile_sha` values and `working_sha_history`. Kept HEAD.
  - `version: 0.2.54`: added only by incoming and untouched by HEAD (no overlap). Applied it.
  - Trailing newline: kept HEAD's.
- File is outside the sparse cone. Staged with `git add --sparse`.

## Incoming changes preserved

No code files were involved. The only incoming change not already in HEAD or superseded by it (`version: 0.2.54`) is present in the staged result. The incoming status and `commits` changes are older states that HEAD's later values supersede.
