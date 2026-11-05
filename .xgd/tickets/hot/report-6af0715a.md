---
uid: report-6af0715a
id: REPORT-10966
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-38'
created_by: xgd
created_at: '2026-11-05T19:53:46.418309+00:00'
updated_at: '2026-11-05T19:53:46.418309+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-38
---

## Files resolved

- `package.json` — UU, config/scalar (version field only). Resolution rule from enrichment: intent unknown on one side → take the more recent commit by timestamp. HEAD's `2de6a86da7` (chore(version): 0.2.117 for REQ-198, committed 2026-11-04) is newer than incoming `b822761179` (committed 2026-11-01, authored 2026-08-31). Kept `"version": "0.2.117"`. The incoming hunk was only its own version bump 0.2.26 → 0.2.27; applying it would move the version backwards by 90 patch releases. Flagged for post-merge review per the enrichment rule (trivial: version scalar only).

## Incoming changes preserved

- The incoming commit `b822761179` touches two paths: `package.json` (version bump only) and `tests/test_UAT_FC_REQ-158_system_kb_bundle.test.ts` (new, +223 lines). The test file is staged in full (`A`), so all of the incoming commit's content is preserved. The only incoming hunk not applied is the stale version scalar described above. The net diff against HEAD is non-empty.
