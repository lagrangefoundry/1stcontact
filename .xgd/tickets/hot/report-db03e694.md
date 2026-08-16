---
uid: report-db03e694
id: REPORT-1991
type: report
title: 'Resync resolve conflicts: ceed377a03fb9f1c1bf084dd224d70cb58d6110f'
created_by: xgd
created_at: '2026-08-15T15:13:37.438135+00:00'
updated_at: '2026-08-15T15:13:37.438135+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: resolve_conflicts
  subject_uid: report-39ae68af
---

## Files resolved

- `package.json` — **UU**, config/bookkeeping scalar (§2g). Sole conflicting hunk was the
  `version` field: HEAD `0.1.44` vs incoming `0.1.40`. The incoming side's entire
  package.json change is the free-coding gate's version bump (`0.1.39` -> `0.1.40`,
  merge-base was `0.1.39`); main has since advanced independently to `0.1.44`.
  Resolved to `0.1.44` — a package version is a monotonic counter, so applying the
  literal timestamp-winner (incoming, Aug 13, vs HEAD, Aug 12) would have regressed
  the published tip below main's current version and would re-conflict against every
  later commit in working's tail. No developer code lives in this file's conflict.
  **Flagged for post-merge review** per the enrichment rule (intent unknown on one side).
  Validated as parseable JSON after resolution.

The other three files in `caeb60b40` auto-merged cleanly and were already staged;
each staged blob is byte-identical to the incoming blob (verified by `rev-parse`
object-id comparison):

- `apps/control-app/src/builder/builder.css` — M, identical to incoming
- `apps/control-app/src/builder/page-style.js` — M, identical to incoming
- `tests/test_UAT_FC_BUG-34_glyph_fill_preview.test.ts` — A, identical to incoming (new UAT, nothing deleted)

## Incoming changes preserved

Incoming commit: `caeb60b401959fe54206c7c1877103ab9d6debbc`
_fix(builder): preview a run's glyph gradient instead of its transparent colour [FREE-CODED]_

- `builder.css`: the BUG-34 glyph-paint block on `.builder-modal__box .fields-control`
  (`background-image`/`background-clip`/`-webkit-text-fill-color` reading
  `--preview-text-*` with initial-value fallbacks) is present verbatim.
- `page-style.js`: `readGlyphFill()` is present in full, and `readTypography()` carries
  both of its edits — the `isTransparent(cs.color)` guard on `--preview-color` and the
  `Object.assign(vars, readGlyphFill(element, cs) ?? {})` line.
- `test_UAT_FC_BUG-34_glyph_fill_preview.test.ts`: all 220 lines added; no test function
  on either side was removed.
- Only the version-bump hunk from the incoming side was not carried, and only because
  main already carries a strictly higher version. Nothing behavioural was discarded.

## Verification

- `git status --porcelain`: no UU/AA/DU/UD lines remain; three staged entries (M/M/A).
- Net change vs HEAD is non-empty: 3 files, +283/-1.
- `CHERRY_PICK_HEAD` left intact (`caeb60b40...`); no `--continue`/`--skip`/`--quit`/`--abort` was run.
- `npx vitest run tests/test_UAT_FC_BUG-34_glyph_fill_preview.test.ts` -> **1 file passed, 4 tests passed**.
