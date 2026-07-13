---
uid: report-e47070cd
id: REPORT-453
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:24:42.696859+00:00'
updated_at: '2026-07-13T18:24:42.696859+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` (UU / both modified) — version-scalar conflict only.
  Ours: `sync_working_to_main` (post-watermark sync from xgd-working) = `0.0.105`.
  Theirs: incoming free_coded hero commit = `0.0.69`.
  Rule applied: version field is monotonic; the incoming `0.0.69` predates the
  sync bump to `0.0.105`. Kept HEAD's `0.0.105`. This was the ONLY conflicted
  hunk in the file — no other keys collided.

## Incoming changes preserved

The conflict was isolated to the `"version"` scalar line. All of the incoming
commit's substantive code changes are present in the resolved tree (7 files:
`packages/framework/src/modules/dials.ts`,
`packages/framework/src/modules/hero/index.astro`,
`packages/framework/src/modules/hero/meta.ts`,
`packages/framework/src/tokens/defaults.ts`,
`packages/site-schema/src/schema.ts`,
`tests/framework-tokens.test.ts`,
`tests/req36-heading-treatment.test.ts`). HEAD is now `e4a80b27`, the incoming
commit itself, so every non-version change from the incoming diff is included
verbatim. Only the stale version scalar was taken from HEAD; no developer code
was discarded.

## Tree state

Clean — `git status --porcelain` empty, zero conflict markers in any tracked
file. Ready for cherry-pick continuation.
