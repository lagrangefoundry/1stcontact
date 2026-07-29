---
uid: report-d194c165
id: REPORT-1049
type: report
title: Claude fix_review_free_coded report
created_by: xgd
created_at: '2026-07-29T05:36:20.472858+00:00'
updated_at: '2026-07-29T05:36:20.472858+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_review_free_coded
  subject_uid: bundle-cceaba25
---

All fixes are in and verified. Summary:

## Issues fixed

### Critical 1 — CSS `url()` injection (DOC-2 §2)
- **`packages/site-schema/src/l1/validate.ts:57,64`** — added `URL_FORBIDDEN_CHARS` (C0/C1 controls, all whitespace, `"`, `'`, `\`, `(`, `)`, `<`, `>`) and rejected any URL containing them in `isSafeUrl`, alongside the existing scheme allowlist. Covers font `src`, `backgroundImageUrl`, and image `src` at Layer 1.
- **`packages/framework/src/l1/render.ts:69-93`** — new `cssUrl()`, the sole CSS `url()` sink: returns the complete quoted token only when the value clears `isSafeUrl` *and* an independent `CSS_URL_ALLOWED` character allowlist; null otherwise. `escapeHtml` is gone from both CSS contexts — `@font-face src` (`render.ts:132`) and `background-image` (`render.ts:471`).
- Defence in depth verified independently: with the validator check removed, `CSS_URL_ALLOWED` alone still rejects the payload.

### Critical 2 — non-text fidelity mispairing
- **`tools/generate/src/l1/fold.ts:264-280`** — exported `SYNTHESIZED_SURFACE_ID_PREFIX` / `isSynthesizedSurfaceId` as the single place that knows the backing-surface marker (re-exported from `l1/index.ts:18`).
- **`tools/generate/src/l1/probes.ts:527`** — synthesized `surface-*` boxes are skipped when building `nonTextQueues`, so the k-th oracle `box` sample pairs with the k-th real `box-*` leaf. Oracle side untouched.

### Warnings
- **`fold.ts:544,624`** — surface ids are now allocated *after* the band filter, so they are contiguous.
- **`fold.ts:619-626`** — a painted surface with no geometry gets its own reason (`'painted surface has no geometry at any sampled width'`) instead of falling through to "neither media…".
- **`probes.ts:763-771`** — the forced `stack` in `promoteToFlow`'s `rebuilt` is now explicitly documented (only vertical stacking is unconditionally overlap- and clip-free under perturbation; the absolute base keeps the authored layout).
- **`fold.ts:262-370`** — `residualKindOf` is now a pure lookup over `classifyElement`'s result. To keep it a lookup rather than a re-derivation, `FoldLeafKind` gained an explicit `unknown` member (previously collapsed into `control`), which `oracleBoxes` already excludes from the measure.

### Tests added (4 new UATs, all verified to bite when the fix is reverted)
- `test_UAT_FC_REQ-90_font_src_cannot_break_out_of_the_css_string`
- `test_UAT_FC_REQ-91_background_image_url_cannot_break_out_of_the_css_string`
- `test_UAT_FC_BUG-11_synthesized_surfaces_do_not_mispair_real_box_leaves` — the reviewer's exact reproducer; reverting the probes guard reproduces `dy 400 / dw 1200`
- `test_UAT_FC_BUG-11_surface_ids_are_contiguous_after_the_band_filter`

### One existing test corrected (strengthened, not weakened)
`tests/reconciliation-l1-language.test.ts:489-517` (AC-727) asserted `src: url("/fonts/a&quot;.ttf")` — i.e. it encoded the HTML-escaper-in-CSS behaviour that *is* the critical finding. It now asserts the safe contract: a source carrying a quote or newline produces **no** rule at all, no `display: none` injection, and balanced braces.

## Verification (all run to completion in this turn)
- Full suite: **98 files, 663 tests, 0 failed** (was 659 — +4 new).
- `tsc --noEmit` on `site-schema`, `framework`, `tools/generate`: clean.
- `pnpm -r build`: 7/8 projects, exit 0.
- `./bin/1c render gigabytealchemy`: exit 0, **stderr empty**, no injected CSS. (The 0 `@font-face` count is pre-existing — the stored draft has no `resources.fonts`.)
- `l1-gate` against a real capture could not be run: `storage/references/` is gitignored and absent from this worktree, so the real-capture UATs skip cleanly. The synthetic fold→gate coverage above exercises the same seam.

**Confidence: high** on both criticals — each was reproduced against the real code before and after the fix, and each new UAT was confirmed to fail when the corresponding fix is reverted. The one residual risk for re-review is the AC-727 test edit; it is an assertion correction rather than a matrix mutation, and it strengthens the security contract.
