---
uid: report-4924cc6b
id: REPORT-1051
type: report
title: 'Code Review: bundle-cceaba25'
created_by: xgd
created_at: '2026-07-29T05:44:41.883254+00:00'
updated_at: '2026-07-29T05:44:41.883254+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-cceaba25
  anchor_uid: bundle-cceaba25
---

# Code Review

**Result**: FAIL

## Summary

The two critical findings from the previous review (REPORT-1048) are genuinely fixed and I verified both independently: `cssUrl()` is now the sole CSS `url()` sink with its own character allowlist on top of `isSafeUrl`, `escapeHtml` no longer appears in any CSS context (`grep 'url('` in `render.ts` hits only `cssUrl`), and `sampleFidelityProbe` skips fold-synthesized `surface-*` boxes so real `box-*` leaves pair correctly. Every quality gate is green — full suite 663/663, `pnpm -r build` exit 0, `tsc --noEmit` clean on both `packages/framework` and `tools/generate`, and `1c` boots silently (REQ-89 acceptance confirmed on the real binary).

One **new** blocking defect surfaced, introduced by the interaction of REQ-92's new `image` leaf path with the fix commit's tightened URL rule: a captured `<img>` whose resolved `src` is not envelope-safe makes `foldToL1` **throw**, which crashes `1c capture page` and `1c l1-gate` for the whole page instead of signalling a residual. A `data:` lazy-load placeholder — pervasive on real sites, including the repro targets — is enough to trigger it. Reproduced against the real code, not inferred.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Lint | PASS | REPORT-1050: 0 errors, 0 warnings |
| Build | PASS | REPORT-1050 + independent `pnpm -r build` (7/8 projects, exit 0) |
| Typecheck | PASS | `npx tsc --noEmit -p packages/framework` and `-p tools/generate`, both exit 0 |
| Tests (scoped) | PASS | REPORT-1050: 54 passed, 0 failed |
| Tests (full suite, run for this review) | PASS | `pnpm vitest run` — 98 files, 663 tests, 0 failed, 0 skipped |
| Coverage | PASS | REPORT-1050: threshold 60% met |

## External Interface Accessibility

New entry points wired in: **yes**.

- `FoldResidual` / `classifyElement` / `isSynthesizedSurfaceId` / `SYNTHESIZED_SURFACE_ID_PREFIX` exported from `tools/generate/src/l1/index.ts:14-22`.
- `foldResiduals` threaded `cmdL1Gate` → `L1GateResult` (`tools/generate/src/cli/repro.ts:116,140-144`) and printed by the CLI on both the human and `--json` paths (`tools/generate/src/cli/index.ts:354-386`).
- Font substance wired capture → fold (`tools/generate/src/cli/capture/capture.ts:82`); `resources` emitted by `fontFaceRules` (`packages/framework/src/l1/render.ts:128`).
- Media `src`/`alt` threaded extract → field → element → fold (`extract.ts:843-845`, `sections.ts:157-159`, `values-diff.ts:779-781`).

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/l1/fold.ts:596-618` | Image leaf emits `widest.src` with no envelope pre-check; an unsafe src makes `validateL1` reject and `foldToL1` throw (fold.ts:679-683) — a fatal crash where the bundle's own contract requires a typed residual | **Critical** |
| `tools/generate/src/l1/probes.ts:353-357` | Overlap detection now excludes **all** `box` leaves, but the stated justification covers only fold-synthesized backing surfaces; `isSynthesizedSurfaceId` now exists and would express the intended predicate exactly | Warning |
| `tools/generate/src/l1/fold.ts:674-677` | Font `src` has the same unguarded-throw class as the image src (lower likelihood — mirrored local asset paths) | Warning |
| `packages/site-schema/src/l1/validate.ts:120-124` | `transform.rotateDeg` is bounded with `L1_ENVELOPE.effectPx` (a *length* range) — functionally a bound, semantically mislabelled | Warning (minor) |
| `packages/framework/src/l1/render.ts:387,389,390` | `px(...)` computed twice per axis (`if (px(x)) base.push(px(x))`) | Nit |
| `packages/site-schema/src/l1/schema.ts` (REQ-91 forms) | Structured typed forms throughout — `.strict()`, hex-only colours, closed enums, no raw-CSS passthrough. Clean. | — |
| changed prod files | No TODO/FIXME/debugger/console.log leftovers (grep over the `packages/` + `tools/` diff) | — |

### Test evidence validity

UATs exercise real `foldToL1` / `renderL1Document` / `validateL1` / `evaluateLayout` / the real `EXTRACT_SCRIPT` under jsdom — no internal mocking. The two security regressions (`test_UAT_FC_REQ-90_font_src_cannot_break_out_of_the_css_string`, `test_UAT_FC_REQ-91_background_image_url_cannot_break_out_of_the_css_string`) assert both layers refuse the newline break-out payload and check brace balance. Valid evidence.

## Checklist Compliance

No architecture, security, or design checklist reports exist for this project (`xgd ticket list --type report --filter fields.report_kind=<kind>` returned empty for all three). Sections omitted.

## Smoke Test

Entry points tested (real `bin/1c`):

- `1c --help` — usage printed, **stderr empty** (no `Missing pages directory`). REQ-89 acceptance met.
- `1c list` — 3 sites listed, **stderr empty**.
- `1c render gigabytealchemy --out …` (L1-only page) — exit 0, 2 files written, stderr empty, no Astro container constructed.
- `1c render harbor-cafe` (behavior-module page) — exit 1: `Module not found in catalog: 'header' v2`. **Pre-existing, not caused by this bundle**: the `header` module does not exist on `main` either (`git ls-tree -r main | grep modules/header` → empty; it was deleted with the semantic layout modules), and the bundle does not touch `storage/sites/harbor-cafe`. The module render path itself is covered green by `tests/req89-astro-lazy.test.ts`.

## Issues Found

**Critical (must fix)**:

- **`foldToL1` crashes the whole capture/gate on an envelope-unsafe image `src`.** `tools/generate/src/l1/fold.ts:596-618` emits an `image` leaf carrying `widest.src` verbatim with no safety pre-check. `validateL1` rejects it (`packages/site-schema/src/l1/validate.ts:213`) and `foldToL1` throws (`fold.ts:679-683`). Reproduced through the real `foldToL1`:
  - `data:image/svg+xml,<svg/>` → `THROW foldToL1: produced an invalid L1 document — /root/children/0/src: image src '…' is not an allowed URL`
  - `https://ex.com/logo(1).png` → same throw (newly unsafe because the fix commit's `URL_FORBIDDEN_CHARS` forbids raw parens)
  - `https://ex.com/a.png` → OK
  
  Blast radius: `cmdCapturePage` (`capture.ts:82`) calls the fold **after** the browser work and after `writeBundle`/`writeMultiState`/`writeLadderScreenshots`, so a real capture of any page with a `data:` placeholder or a parenthesised image URL burns the full capture run and then aborts with no `l1.json` / `hints.json`; `cmdL1Gate` (`repro.ts:140`) then throws on the same bundle. `data:` placeholders are the standard lazy-loading pattern on exactly the kind of site this pipeline targets.
  
  This also contradicts the bundle's own shipped contract: BUG-6 / REQ-92 established *signal, don't drop* — an element the language cannot express must become a typed `FoldResidual`, not a fatal error. An unrenderable image src is a content condition, not a system bug, so it must not take the fold-level throw path (which is reserved for a genuinely invalid document the fold itself built).

**Warnings (should fix)**:

- `probes.ts:353-357` — narrow the overlap exclusion to `isSynthesizedSurfaceId(l.id)` rather than every `box` leaf, so a genuine collision between two captured standalone surfaces is still reported by the robustness probe. The helper the fix commit added expresses exactly the documented intent.
- `fold.ts:674-677` — apply the same guard to font `src` (drop the face + signal, don't throw).
- `validate.ts:120-124` — give `rotateDeg` its own envelope entry (e.g. `rotateDeg: { min: -3600, max: 3600 }`) instead of reusing `effectPx`.
- `render.ts:387,389,390` — hoist the `px(...)` results into locals.

## Fix-It Prompt

1. **Guard the image leaf's `src` in `foldToL1` (required).** In `tools/generate/src/l1/fold.ts`, in the image-leaf branch (~line 596), extend the existing gate so an unsafe src signals a residual instead of reaching `validateL1`:
   - Import `isSafeUrl` from `@1stcontact/site-schema` (already exported at `packages/site-schema/src/l1/index.ts:7`).
   - Change the guard to also fail when `!isSafeUrl(widest.src)`, with its own reason string, e.g. `'media element src is not an allowed URL (http/https or relative only) — asset must be mirrored before it can fold'`, keeping the existing `capturedAxes` / `presentWidths` payload so the gate reports it like any other folder-power gap.
   - Do **not** relax `isSafeUrl` or the envelope to accept `data:` — the security boundary is correct; the fold must stop feeding it unrepresentable values.
2. **Same treatment for fonts.** In `usedFontFaces` (`fold.ts:99-105`) or at the `doc.resources` assignment (`fold.ts:674-677`), drop any face whose `src` fails `isSafeUrl` rather than letting it reach `validateL1`.
3. **Narrow the overlap exclusion.** In `tools/generate/src/l1/probes.ts:353-357`, replace `l.kind !== 'box'` with `!(l.kind === 'box' && isSynthesizedSurfaceId(l.id))` so only fold-invented backing surfaces are excluded from overlap findings (the horizontal-clip check is unaffected). `isSynthesizedSurfaceId` is already imported in this file.
4. **Add UATs** named `test_UAT_FC_REQ-92_*` covering: (a) a captured `<img>` with a `data:` src folds to a typed residual and `foldToL1` does **not** throw; (b) a captured `<img>` with a paren-bearing http src likewise; (c) a safe src still folds to an `image` leaf; and `test_UAT_FC_BUG-11_*` for (d) two genuine standalone `box-*` surfaces that overlap are still flagged by `evaluateLayout`, while a synthesized `surface-*` behind its run is not.
5. Re-run the full suite (`pnpm vitest run`) and `tsc --noEmit` on `packages/framework` and `tools/generate`.
