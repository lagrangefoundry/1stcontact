---
uid: report-bf895c47
id: REPORT-566
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:18:31.823314+00:00'
updated_at: '2026-07-19T01:18:31.823314+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — file class: UU (config, version scalar). Rule 2g / intent-metadata resolution rule. Conflict was a lone `version` scalar: ours `0.0.155` (sync_working_to_main) vs incoming `0.0.115` (free_coded). Kept the higher/current `0.0.155`; the incoming `0.0.115` was a stale bump carried by the free-coded commit. This is the intended monotonic-version resolution — the incoming version scalar is not developer intent, it is a lower snapshot from the working branch. No code content lost.

## Incoming changes preserved

The five code/test files carried by the incoming commit applied without conflict and are present verbatim in the resolved tree (HEAD commit c37e269b, "5 files changed, 79 insertions(+)"):

- `tests/req58-wrapper-treatments.test.ts` (+25)
- `tools/generate/src/cli/capture/extract.ts` (+21)
- `tools/generate/src/cli/capture/sections.ts` (+2)
- `tools/generate/src/cli/capture/types.ts` (+4)
- `tools/generate/src/cli/capture/values-diff.ts` (+27)

All incoming box-border axis capture/diff changes are present. Only the package.json version scalar diverged and was resolved in favour of the current higher version. No conflict markers remain in any tracked file; the working tree is clean.
