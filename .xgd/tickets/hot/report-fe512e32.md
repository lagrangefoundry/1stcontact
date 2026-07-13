---
uid: report-fe512e32
id: REPORT-446
type: report
title: 'Reconcile resolve conflicts: reconcile-BUNDLE-5'
created_by: xgd
created_at: '2026-07-13T18:10:16.536205+00:00'
updated_at: '2026-07-13T18:10:16.536205+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: reconcile-BUNDLE-5
---

## Files resolved

- `package.json` — UU (both modified). Enrichment: OURS = `sync_working_to_main` at version 0.0.105 (post-watermark sync from xgd-working); THEIRS = incoming free_coded REQ-49 commit carrying version 0.0.62. The ONLY conflicting hunk was the `version` string. Rule applied: "intent unknown on one side → take the more recent commit by timestamp." OURS (0.0.105 sync) is newer than the incoming 0.0.62; version bumps must not walk backward. Kept 0.0.105. Result: package.json is identical to HEAD, so it carries no net change and does not appear in the landed commit.

## Incoming changes preserved

The incoming commit (10541724) touched 8 files. The 7 code/test files are preserved verbatim in the landed cherry-pick (6660a6e3) with matching diffstats:
- `packages/framework/src/modules/dials.ts` — 32 lines ✓
- `packages/framework/src/modules/hero/index.astro` — 50 lines ✓
- `packages/framework/src/modules/hero/meta.ts` — 22 lines ✓
- `packages/framework/src/tokens/defaults.ts` — 14 lines ✓
- `packages/site-schema/src/schema.ts` — 19 lines ✓
- `tests/framework-tokens.test.ts` — 9 lines ✓
- `tests/req49-fidelity-primitives.test.ts` — 181 lines (new file) ✓

The 8th file (`package.json`) had only a version-string change (0.0.62), intentionally superseded by HEAD's newer 0.0.105 per the resolution rule. No developer code was discarded — only a version regression.

## Tree state

Working tree clean; no conflict-class entries remain in `git status --porcelain`. No CHERRY_PICK_HEAD paused (resolution already committed as 6660a6e3). Did not invoke cherry-pick --continue/--skip/--abort as part of this step.
