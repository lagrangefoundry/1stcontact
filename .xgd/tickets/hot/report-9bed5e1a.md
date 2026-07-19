---
uid: report-9bed5e1a
id: REPORT-557
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:07:54.277909+00:00'
updated_at: '2026-07-19T01:07:54.277909+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — UU (config/scalar version field). Conflict was the `version` scalar only: OURS (sync_working_to_main) = `0.0.155`, THEIRS (free_coded incoming) = `0.0.110`. Per the version-field convention the branch is ahead of the stale incoming bump, so kept HEAD's `0.0.155` and flagged for post-merge review as directed by the intent metadata. All other package.json content was identical on both sides.

No implementation/code files were conflicted. The incoming commit's six files (values-diff.ts, types.ts, and four test/fixture files) applied cleanly and were staged automatically.

## Incoming changes preserved

The incoming free_coded commit (feat: record gradient stop positions for text-fill gradients, REQ-59) is fully present in the tree:

- `tools/generate/src/cli/capture/values-diff.ts` — +42/-… gradient-stop logic present (33 "gradient" references)
- `tools/generate/src/cli/capture/types.ts` — +20 present
- `tests/req59-gradient-stop-positions.test.ts` — new file present (175 lines)
- `tests/fixtures/capture/gradient-positions.html` — new fixture present (27 lines)
- `tests/req31-values-diff.test.ts`, `tests/req53-values-diff-exact.test.ts` — modifications present

No developer code was discarded; only the version scalar was decided against the incoming side, per the version-field rule.
