---
uid: report-01eeef07
id: REPORT-672
type: report
title: 'Code Review: bundle-ab9e0cb6'
created_by: xgd
created_at: '2026-07-19T04:14:34.846525+00:00'
updated_at: '2026-07-19T04:19:27.567744+00:00'
completed_at: null
last_field_updated: body
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-ab9e0cb6
  anchor_uid: bundle-ab9e0cb6
---

# Code Review

**Result**: FAIL

> **Correction note**: this report initially recorded PASS. That verdict was filed prematurely, before the parallel code-quality read completed. On completion it surfaced a confirmed CRITICAL regression (dangling CSS custom-property on a live footer dial), independently verified below. The verdict is corrected to **FAIL**.

## Summary
Free-coded bundle REQ-58/59/62/61. The CLI/diff/capture surface (responsive-diff, --size/--multi-viewport, new value axes, absolute-or-overlay value system) is well-built, wired, and smoke-clean. **However, a resync commit in this bundle deleted the `accentMid` palette default while leaving the footer's `surface-accent-muted` dial painting `var(--color-accent-mid)` with no fallback — and deleted the very test that guarded the invariant.** That is a latent rendering regression on a live, documented dial value, shipping into `main` via `auto_merge_back`. Fix is small; see Fix-It Prompt.

## Quality Gates
From report-d220c770 (commit d6d6a15b): Lint success (0/0), Build success, Preflight pass, vitest 51/51 passed. `tsc --noEmit` independently clean (exit 0).
**Caveat (evidence validity):** the passing suite does NOT prove correctness of the footer surface. The test asserting `:root` always declares `--color-accent-mid` was removed in the same change (see CRITICAL-1); the remaining footer test only checks the CSS string contains `background: var(--color-accent-mid)`, not that the var resolves. Gates green ≠ this axis correct.

## External Interface Accessibility
New entry points wired in: **yes**. `1c responsive-diff` dispatched (index.ts:440); `--size` on both `values-diff` (index.ts:367) and `diff` (index.ts:428) via `parseSize` (index.ts:605); `--multi-viewport`/`--classify` in BOOLEAN_FLAGS (args.ts). All responsive-diff + multi-viewport symbols re-exported from cli/index.ts. No dead CLI modules.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| tokens/defaults.ts (−`accentMid`) + footer/index.astro:104 | `--color-accent-mid` no longer emitted by default, footer `surface-accent-muted` paints it with no fallback → transparent background regression | **CRITICAL** |
| footer/meta.ts | Newly-consumed `textColor`/`linkColor` dials + `copyright` content not declared in meta (schema permissive → no crash, but off the documented dial surface) | WARNING |
| contact-form/index.astro:46,49 | `submitColor`/`submitInline` read but not declared in contact-form/meta.ts; `submitInline === 'true'` is a stringly-typed boolean dial, a pattern used nowhere else | WARNING |
| header/index.astro | `navCollapse` read but undeclared in header/meta.ts | WARNING |
| header/index.astro:113-115 | Leftover superseded `padding-top/bottom: var(--space-4)` declarations sit above the new `var(--fc-pt)/var(--fc-pb)` ones (cascade masks them; every other module replaced cleanly) | NIT |
| contact-form, services-grid, header, footer /index.astro | `resolveStep` imported but never called (0 call sites) — dead imports | NIT |
| text-block/index.astro:5 | `responsivePropertyRules` imported but only referenced in a comment — dead import | NIT |
| text-style.ts `resolveFamily` (same resync commit) | Dropped `/"` escaping of literal font-family names; minor CSS-injection surface IF family values can be untrusted (likely author-controlled) — confirm intent | NIT/verify |
| responsive-diff.ts, stdio.ts, fidelity.ts, perceptual.ts, capture/extract.ts, capture/values-diff.ts, dials.ts, breakpoints.ts, layer.ts | Clean — reuse-first, well-documented, new axes reuse existing kind/tier/rank tables, null-safe pairing | OK |

## Checklist Compliance
No architecture, security, or design checklist reports exist for this anchor — sections skipped.

## Smoke Test
`1c --help` (exit 0); `responsive-diff` no --ref (exit 1, clean stderr, empty stdout); `responsive-diff --ref <missing>` (exit 1, STALE-REFERENCE guard message); `values-diff … --size bogus` (exit 1, validator rejects). All error paths clean, no stacktraces, `--json` stdout hygiene verified.

## Issues Found
**Critical (must fix)**:
- **CRITICAL-1 — dangling `--color-accent-mid` on the footer `accent-muted` surface.** `packages/framework/src/tokens/defaults.ts` deleted `accentMid: '#d98324'` (and the comment stating the invariant "so `--color-accent-mid` always resolves … even when a site omits accentMid"). `paletteVars` (tokens/css.ts:104) emits only roles present in the palette, so `--color-accent-mid` is now undefined by default. But `FOOTER_SURFACE_DIAL` still lists `'accent-muted'` (modules/dials.ts:76) and `footer/index.astro:104` emits `.footer.surface-accent-muted { background: var(--color-accent-mid); color: var(--color-bg); }` — no fallback. Any site choosing footer surface `accent-muted` without defining `accentMid` renders `background: transparent` (invalid var → initial value). The guard test (`:root` always declares `--color-accent-mid`) was deleted in the same change, so no test catches it.

**Warnings (should fix)**:
- Declare `textColor`/`linkColor`/`copyright` (footer), `submitColor`/`submitInline` (contact-form), `navCollapse` (header) in their module `meta.ts` — align with how `fieldLabels` was added.
- `submitInline` should be a proper enum, not a `=== 'true'` string compare.

**Nits (optional)**: dead `resolveStep` imports (4 modules) + `responsivePropertyRules` (text-block); leftover `var(--space-4)` padding lines in header/index.astro:113-114; confirm the `resolveFamily` escaping removal was intended.

## Fix-It Prompt
For `fix_review_free_coded` — address CRITICAL-1 (blocking); the rest are optional but cheap:

1. **CRITICAL-1 (required).** First determine intent: the `accentMid` deletion rode along in a resync commit next to an unrelated `text-style.ts resolveFamily` change, so it looks like accidental collateral. Then EITHER (preferred, restores the documented invariant):
   - Restore `accentMid: '#d98324'` to `defaultTokens` in `packages/framework/src/tokens/defaults.ts` (with its comment), AND restore the deleted test asserting `:root` declares `--color-accent-mid` even when a site omits `accentMid`.
   OR (if the default removal was deliberate): give the footer rule a literal fallback — `background: var(--color-accent-mid, #d98324)` in `footer/index.astro:104` — and keep a test proving `surface-accent-muted` renders a non-empty background with a default palette.
   Add/keep a UAT that fails today: render a site with footer `surface: accent-muted` and NO `accentMid` in its palette, assert the emitted CSS resolves the background to a concrete colour (not an undefined var).
2. **Warnings (recommended).** Add the undeclared dials/content fields to `footer/meta.ts`, `contact-form/meta.ts`, `header/meta.ts`. Convert `submitInline` to an enum dial and update `contact-form/index.astro`.
3. **Nits (optional).** Remove the unused `resolveStep` imports and the `responsivePropertyRules` import; delete the superseded `var(--space-4)` padding lines in `header/index.astro`.
