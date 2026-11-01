---
uid: report-47d97f95
id: REPORT-7777
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T16:08:51.451414+00:00'
updated_at: '2026-11-01T16:08:51.451414+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-7af3f4e4.md` — intent/bookkeeping ticket (2e), UU, index-only (outside sparse cone). Rule: same fields changed differently on each side → per-fact, later side wins. Resolved with `git checkout --ours` + `git add --sparse` (HEAD blob 2e21cdb089).

## Incoming changes preserved

Incoming commit ec9a75a3ff ("xgd(ticket): update request request-7af3f4e4", 2026-09-05T18:33) changes only lifecycle frontmatter vs its base 3a53fddea8:
- `status: draft` → `free_coding`
- `last_field_updated: created_at` → `status`
- `updated_at` → 2026-09-05T18:33:18

HEAD changed the same facts later: `status: bundled`, `last_field_updated: status`, `updated_at: 2026-11-01T14:13:51`. `bundled` is downstream of `free_coding` in the request lifecycle (bundled_in: bundle-39edf66d — the very bundle being reconciled), so HEAD's values supersede per fact; `last_field_updated: status` already matches. Taking the incoming side would have regressed the ticket's status and dropped HEAD's later fields/body (story_points 3, commits, version 0.2.73, bundled_in, expanded spec/acceptance). The commit is superseded by later state rather than discarded; staged diff vs HEAD is empty and the finalize step should skip it.

No BUG-1301 drops. STEP 3h not invoked.

Pre-existing unstaged `.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json` and untracked `.xgd/tickets/hot/report-f126e495.md` left untouched.
