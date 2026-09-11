---
uid: comment-e2aeda11
id: COMMENT-578
type: comment
title: Claude response for fix_review_free_coded report
created_by: xgd
created_at: '2026-07-29T05:50:56.729163+00:00'
updated_at: '2026-07-29T05:50:56.729163+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-d194c165
  kind: note
---

All five review items are fixed and verified.

## Issues fixed

**Critical — `foldToL1` crashes on an envelope-unsafe image `src`**
- `tools/generate/src/l1/fold.ts:604` — the image-leaf gate now also fails on `!isSafeUrl(widest.src)`, emitting a typed `FoldResidual` with the reason `'media element src is not an allowed URL (http/https or relative only) — asset must be mirrored before it can fold'` instead of letting the value reach `validateL1` and take the fold-level throw path. `isSafeUrl` imported from `@1stcontact/site-schema` (`fold.ts:21`). The envelope and `isSafeUrl` are untouched — the security boundary is unchanged; the fold simply stops feeding it unrepresentable values.

**Warning — font `src` has the same unguarded-throw class**
- `tools/generate/src/l1/fold.ts:111` — `usedFontFaces` now filters on `isSafeUrl(f.src)`, so an unmirrored face is dropped (degrading that family to the fallback) rather than throwing the fold.

**Warning — overlap exclusion too broad**
- `tools/generate/src/l1/probes.ts:356-363` — `l.kind !== 'box'` replaced with `!(l.kind === 'box' && isSynthesizedSurfaceId(l.id))`. Only fold-invented backing surfaces are exempt; two genuine captured `box-*` surfaces colliding is reported again. Comment rewritten to state the narrowed intent.

**Warning — `rotateDeg` bounded by a length range**
- `packages/site-schema/src/l1/validate.ts:38` — added `rotateDeg: { min: -3600, max: 3600 }` to `L1_ENVELOPE`; `checkEffects` (`:137-144`) now checks it inline with its own message instead of calling `checkEffectLen`.

**Nit — `px(...)` computed twice**
- `packages/framework/src/l1/render.ts:387-393` — `fontSize` / `lineHeight` / `letterSpacing` hoisted into locals.

## Tests added (5 UATs, all real entry points, no internal mocks)
- `tests/req92-image-box-fold.test.ts` — `test_UAT_FC_REQ-92_data_url_media_src_is_a_residual_not_a_throw`, `..._paren_bearing_media_src_is_a_residual_not_a_throw`, `..._safe_media_src_still_folds_alongside_an_unsafe_one` (safe sibling still becomes an `image` leaf while the bad one signals).
- `tests/bug11-fold-surface-fill.test.ts` — `test_UAT_FC_BUG-11_only_synthesized_surfaces_are_exempt_from_overlap`. **Verified it bites**: reverting the predicate to `l.kind !== 'box'` turns it red (`expected [] to contain ["box-0","box-1"]`); file restored afterwards.
- `tests/req90-l1-font-resources.test.ts` — `test_UAT_FC_REQ-90_fold_drops_an_unmirrored_face_instead_of_throwing` (both `data:` and paren-bearing srcs; mixed safe/unsafe keeps the safe entry).

## Verification run
| Check | Result |
|---|---|
| `npx vitest run` (full) | 98 files, **668 passed**, 0 failed (was 663 + 5 new) |
| `tsc --noEmit` — framework / generate / site-schema | exit 0 / 0 / 0 |
| `pnpm -r build` | exit 0 (7 of 8 projects, as before) |
| `./bin/1c list` | exit 0, **stderr empty** |
| `./bin/1c render gigabytealchemy` | exit 0, 2 files, stderr empty; `font-size` still emitted after the px hoist |

`1c l1-gate` against a real bundle could not be smoke-tested — `storage/references/` is gitignored and empty in this worktree, so no capture exists locally. That path is covered by the synthetic-capture UATs, which drive the real `foldToL1`.

**Confidence: high.** The critical finding is closed at the exact seam the reviewer identified and reproduced, with a UAT per reproduction case; the three warnings and the nit are all addressed; every gate the reviewer ran is green, and the one new-behaviour test was confirmed to fail without its fix.
