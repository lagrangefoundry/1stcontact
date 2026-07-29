---
uid: report-ae98b083
id: REPORT-987
type: report
title: 'Resync resolve conflicts: 006568bd9e49cc7323728e278446fbe1f1e9b96b'
created_by: xgd
created_at: '2026-07-27T20:57:08.651142+00:00'
updated_at: '2026-07-27T20:57:08.651142+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-510318c4
---

## Files resolved

- `package.json` — class **UU**, config file (§2g scalar). Sole hunk was the `version` field: base `0.0.199`, ours `0.0.212`, incoming `0.0.200`. Applied the enrichment rule "take the more recent commit by timestamp": ours is the 2026-07-27 post-watermark sync commit, incoming is 2026-07-25. Kept `0.0.212`, which also matches `main` — taking incoming's `0.0.200` would have regressed the version below main and broken monotonicity. No developer code is carried by this field. Result validated as parseable JSON. Flagged for post-merge review per the enrichment rule.

All other 14 files in the incoming commit auto-merged cleanly with no conflict class.

## Incoming changes preserved

Incoming commit `65d222bb` ("fix(l1): accent bearers, width-aware nowrap, and the two viewport axes [FREE-CODED]") touches 15 files. Verified `git diff --cached <CPHEAD> -- <file>` is **empty (0 lines) for all 14 code/test files** — the staged tree is byte-identical to the incoming version of each:

- `packages/framework/src/l1/render.ts` — identical to incoming
- `packages/site-schema/src/l1/schema.ts` — identical to incoming
- `packages/site-schema/src/l1/types.ts` — identical to incoming
- `packages/site-schema/src/l1/validate.ts` — identical to incoming
- `tests/req88-nowrap-x-browser.test.ts` — new file, added in full (132 lines)
- `tests/req88-viewport-relative-and-nowrap.test.ts` — new file, added in full (501 lines)
- `tests/req92-image-box-fold.test.ts` — identical to incoming
- `tools/generate/src/cli/capture/extract.ts` — identical to incoming
- `tools/generate/src/cli/capture/pipeline.ts` — identical to incoming
- `tools/generate/src/cli/capture/sections.ts` — identical to incoming
- `tools/generate/src/cli/capture/types.ts` — identical to incoming
- `tools/generate/src/cli/capture/values-diff.ts` — identical to incoming
- `tools/generate/src/cli/responsive-diff.ts` — identical to incoming
- `tools/generate/src/l1/fold.ts` — identical to incoming

No test function was deleted; both new test files are staged as additions in full. The 15th file (`package.json`) carries only the version bump, resolved above.

## Staging state

`git status --porcelain` shows zero conflict-class entries. 14 files staged with net change from HEAD (non-empty commit). `CHERRY_PICK_HEAD` (`65d222bbe48a1a6a0be2d3d23a53b1eef603fe6a`) left intact for the next workflow step.
