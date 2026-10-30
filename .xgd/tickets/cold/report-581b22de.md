---
uid: report-581b22de
id: REPORT-589
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-6'
created_by: xgd
created_at: '2026-07-19T01:45:29.389756+00:00'
updated_at: '2026-07-19T01:45:29.389756+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-6
---

## Files resolved

- `package.json` — UU (both modified), config/manifest scalar conflict. Only the `version` field conflicted: HEAD (`sync_working_to_main`) = `0.0.155`, incoming (`feat REQ-61 [FREE-CODED]`) = `0.0.128`. Per the version-never-regresses rule, kept HEAD's `0.0.155`. This was the ONLY hunk in the incoming commit touching package.json, so no incoming code/behavior was carried by this field — dropping the older version number discards nothing of substance.

## Incoming changes preserved

All incoming REQ-61 code changes are present in HEAD (`c9f3a580`), which is the applied cherry-pick of the incoming commit:

- `tests/req61-size-pixel-diff.test.ts` — new file, 87 lines, present on disk and in the commit.
- `tools/generate/src/cli/index.ts` — `--size` flag wiring present (+6/-1).
- `tools/generate/src/cli/perceptual.ts` — REQ-61 size-aware diff logic present (`ViewportName`, `size?` param, per-viewport screenshot comparison; +34/-4).

The package.json conflict was resolved without touching any incoming code file. The only incoming edit not carried forward is the version-number regression (0.0.128), which is intentional and expected under the reconcile version rule. Tree is clean (`git status --porcelain` empty); no conflict markers remain.
