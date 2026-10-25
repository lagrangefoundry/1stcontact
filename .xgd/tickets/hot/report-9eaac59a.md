---
uid: report-9eaac59a
id: REPORT-6733
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-32'
created_by: xgd
created_at: '2026-10-25T23:46:24.436857+00:00'
updated_at: '2026-10-25T23:46:24.436857+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-32
---

## Files resolved

- `.xgd/tickets/hot/request-bfd833d0.md` — intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: strict superset → kept OURS (stage 2, blob 4a9104bc), staged via `git checkout --ours` + `git add --sparse`.
  - Incoming (693b62bdcd, 2026-09-02 "update request request-bfd833d0") advanced `status` to `free_coded` and recorded `commits` (working_sha e1ceeb63…) and `version: 0.2.45`; `updated_at` 2026-09-02T22:36:57.
  - Ours already holds the identical `commits` and `version` entries, plus the later lifecycle step: `status: bundled`, `bundled_in: bundle-5607a08d`, `updated_at` 2026-10-25T22:19. Taking incoming's status would regress bundled → free_coded. Consistent with enrichment rule (more recent timestamp = ours).

## Incoming changes preserved

No code files in conflict. Incoming's additions (commits, version) are already present verbatim in HEAD; its status value is superseded by HEAD's later `bundled`. Redundant commit; nets to no diff vs HEAD (not a discard).
