---
uid: report-8b48653c
id: REPORT-10998
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T20:19:03.567738+00:00'
updated_at: '2026-11-05T20:19:03.567738+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — UU, config/scalar conflict on `"version"` only (single hunk). Resolved with the enrichment rule "take the more recent commit by timestamp": HEAD `2de6a86da7` (chore(version): 0.2.117 for REQ-198, committed 2026-11-04) is newer than incoming `9c4170d642` (authored 2026-09-03, committed 2026-11-02). Kept HEAD's `0.2.117`. The incoming bump (0.2.62 -> 0.2.65) is stale and would downgrade the package version. **Flagged for post-merge review** as the enrichment requires (intent unknown on one side).

## Incoming changes preserved

- The incoming commit's only `package.json` change is the stale version bump above. It was superseded, not discarded developer code.
- The commit's real changes applied cleanly and are staged unchanged:
  - `tests/test_UAT_FC_BUG-42_markdown_rendering.test.ts` (added, +359)
  - `tests/test_UAT_FC_REQ-161_library_tab.test.ts` (modified, +34/-28)
- The resolution has a net diff against HEAD, so the incoming changes are present.

Unrelated unstaged `.xgd/_changes/*` and untracked `.xgd/tickets/hot/report-a90558d0.md` were left untouched. CHERRY_PICK_HEAD is intact; the cherry-pick was not continued.
