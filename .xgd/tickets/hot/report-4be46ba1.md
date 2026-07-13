---
uid: report-4be46ba1
id: REPORT-538
type: report
title: 'Code Review: bundle-d9c2e655'
created_by: xgd
created_at: '2026-07-13T21:56:11.977878+00:00'
updated_at: '2026-07-13T21:56:11.977878+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-d9c2e655
  anchor_uid: bundle-d9c2e655
---

# Code Review

**Result**: PASS

## Summary
Bundle REQ-51..57 (object-grouped fidelity report, hero positional control, exact-match values-diff + `--tolerant`, styled-text block-document notation, content-width scale, component-typography subscales, rich text blocks) — ~11k source lines. Large but consistently structured, with strong reuse/generalization (the unified `TextRun`/diff vocabulary, theme subscales, shared `positionVars`). The single blocking defect from the prior review (report-1ff20880) — the `accent-muted` footer surface referencing an undeclared `--color-accent-mid` — is genuinely fixed and now guarded by a strengthened test. All quality gates green; the bundle's own feature UATs pass through the real render transform. No critical code-quality defects remain.

## Quality Gates
Latest regression quality report `report-293044bc` (2026-07-13T21:47Z):
- **Lint**: success — 0 errors, 0 warnings
- **Build**: success
- **Tests**: javascript-vitest 54 passed / 0 failed / 0 skipped (reconciled AC set)
- **Preflight**: pass
All gates PASS. Independently re-ran the bundle's own feature files (req51..req57): **76/76 UATs pass** through the Astro/Vite transform path.

## External Interface Accessibility
New/modified features are wired in:
- `resolveTextStyle` (text-style.ts) consumed by all six modules (hero, header, services-grid, text-block, contact-form footer paths).
- `--tolerant` flag (REQ-53) wired end-to-end: `args.ts` BOOLEAN_FLAGS -> `index.ts` -> `fidelity.ts` diffOptions -> `values-diff.ts` DiffOptions.
- New dials (`FOOTER_SURFACE_DIAL`, subscales) reach their `meta.ts`; new tools functions (`evaluateResponsive`, `evaluateXBrowser`, `evaluateXBrowserBackstop`, `createEngineDriver`, `engineAvailable`) consumed in `conformance/harness.ts`.
- `gradient.ts` fully removed; no stale refs to `gradientImage`/`SIZE_DIAL`.
- **Note (warning, non-blocking)**: `parseStyledText`/`serializeStyledText`/`normalizeStyledText` (text-markup.ts) and `validateModuleContent` (validate.ts) are exported via the public framework API (`packages/framework/src/index.ts`) and round-trip/validation-tested, but have no in-repo runtime call site yet — their consumers (capture-emit, authoring UI, a validation gate) are downstream. This is the block-document *notation* primitive delivered ahead of its renderer/consumer, consistent with the project's primitives-before-builder methodology and the prior review's PASS on this same surface. Not a dead module (public contract + full UAT coverage), but wiring the notation into the capture/validation flow is expected follow-up.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| hero/index.astro:59 + header/index.astro:47 | `withPos` and `wordmarkPosStyle` reimplement the identical "strip trailing `;`, join resolved text-style to `positionVars` with `; `" logic (same comment, verbatim). `positionVars` was already exported from layer.ts for reuse; extract a shared `withPositionStyle(base, position)` helper beside it. | Warning |
| conformance/checks.ts:250,368 | Browser-scope `visible`/`describe` helpers repeat across `RESPONSIVE_PROBE` and `X_BROWSER_BOX_PROBE`. Inherent to string-serialized page scripts (cannot share a TS helper); matches the file's existing SAFETY/SECURITY probe pattern. | Nit |
| text-style.ts / text-markup.ts / values-diff.ts / fidelity.ts / dials.ts | Clean — thorough docs, no debug code, no commented-out blocks, no TODO stubs, no unused imports. Old dial CSS (`size-*`/`treatment-*`/`subhead-*`) fully deleted (no legacy left). CSS-injection escape added in `resolveFamily`. | — |

## Smoke Test
Entry points: the bundle modifies the `1c` CLI (fidelity/values-diff/conformance) and the `@1stcontact/framework` library.
- **CLI binary (`1c --help`)**: could not run in this worktree — blocked by a **pre-existing** workspace-package resolution issue (`@1stcontact/site-schema`'s tsc `dist/index.js` uses extensionless ESM imports that node rejects when Vite SSR externalizes it). The bundle does not touch the CLI launcher, site-schema `package.json`/`tsconfig`, or vite config; the failure occurs at package import, before any bundle code runs, and reproduces independent of these changes. Flagged as an environment/packaging issue, **not** a bundle regression.
- **Faithful validation path**: the CLI/framework code is exercised via Vitest (same Astro/Vite transform the binary uses). All 76 bundle feature UATs pass — the object-grouped report, hero positioning, exact/tolerant values-diff, styled-text markup, content-width, subscales, and rich blocks all execute green.

## Issues Found
**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- Extract the duplicated positioned-style join (`withPos` / `wordmarkPosStyle`) into a shared helper alongside `positionVars`.
- Wire the styled-text notation (`parse/serialize/normalize`) and `validateModuleContent` into an actual capture/authoring/validation consumer in a follow-up; today they are public-API primitives proven only by their own UATs.
