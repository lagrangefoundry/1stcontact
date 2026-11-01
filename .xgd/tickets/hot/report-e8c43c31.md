---
uid: report-e8c43c31
id: REPORT-7683
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-36'
created_by: xgd
created_at: '2026-11-01T15:08:28.892476+00:00'
updated_at: '2026-11-01T15:08:28.892476+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-36
---

## Files resolved

- `.xgd/tickets/hot/request-da60b61b.md` (REQ-169) — intent/bookkeeping ticket (2e); per-fact rule + enrichment rule "take the more recent commit by timestamp; flag for post-merge review".
  - Frontmatter (`updated_at`, `completed_at`, `last_field_updated`, `status`): same fields changed differently on both sides. Kept HEAD (updated 2026-11-01, completed, `status: free_and_reconciled`) over incoming (2026-09-03, `completed_at: null`, `status: free_coding`). The incoming values are a stale snapshot; taking them would regress a completed, reconciled ticket back to in-progress.
  - Trailing hunk: HEAD had a trailing blank line + `-`; incoming had nothing. Kept HEAD's text verbatim (no content invented or removed).
  - All other (non-conflicting) hunks merged automatically by git and retained.
  - Staged with `git add --sparse` (outside sparse cone).

**Flagged for post-merge review:** the stray trailing `-` line at end of REQ-169's body looks like an artifact, but it is HEAD's committed content, so it was preserved rather than deleted.

## Incoming changes preserved

No code files were in conflict. The incoming commit's only conflicting changes were the stale frontmatter state fields, which were superseded by the later HEAD values per the timestamp rule. Its non-conflicting body changes were auto-merged and are present.

Unrelated pre-existing working-tree changes (`.xgd/_changes/log.ndjson`, `.xgd/_changes/meta.json`, untracked `report-376a5b8e.md`) were left untouched.
