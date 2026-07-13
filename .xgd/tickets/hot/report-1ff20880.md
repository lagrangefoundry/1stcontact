---
uid: report-1ff20880
id: REPORT-533
type: report
title: 'Code Review: bundle-d9c2e655'
created_by: xgd
created_at: '2026-07-13T21:40:32.959894+00:00'
updated_at: '2026-07-13T21:40:32.959894+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-d9c2e655
  anchor_uid: bundle-d9c2e655
---

# Code Review

**Result**: FAIL

## Summary
The bundle (REQ-51/52/53/54/55/56/57 — object-grouped fidelity report, hero positioning, exact-match values-diff, styled-text markup, content-width scale, component-typography subscales, rich text blocks) is large (~11k source lines) and largely clean, with strong reuse/generalization (subscales, hero slot positioning, unified text-style vocabulary) and all quality gates green. One genuine defect blocks: a newly-added footer surface dial value (`accent-muted`, REQ-36) references an undefined CSS custom property `--color-accent-mid` with no default token and no fallback, so the dial renders broken when used. Its test asserts only that the rule *references* the var, not that it *resolves*, so the gate did not catch it.

## Quality Gates
From latest regression quality report `report-c04c1ea7` (2026-07-13):
- Lint: success — 0 errors, 0 warnings
- Build: success
- Tests: javascript-vitest 54 passed / 0 failed / 0 skipped
- Preflight: pass
All gates PASS. (Gate status is not the reason for FAIL.)

## External Interface Accessibility
New modules are correctly wired and exported:
- `text-markup.ts`, `text-style.ts` (replacing the fully-removed `gradient.ts`) — exported via `modules/index.ts` and re-exported from `packages/framework/src/index.ts` (parse/serialize/normalize + all Block/StyledText types).
- `validate.ts` `validateModuleContent` exported.
- New dials (`FOOTER_SURFACE_DIAL`, subscales) reach their `meta.ts`. CLI `--tolerant` flag (REQ-53) is wired end-to-end: `args.ts` BOOLEAN_FLAGS -> `index.ts` flags.tolerant -> `fidelity.ts` diffOptions -> `values-diff.ts` DiffOptions.tolerant.
- No stale references to removed symbols (`gradient.ts`, `gradientImage`, `SIZE_DIAL`).

**Gap**: `FOOTER_SURFACE_DIAL` value `accent-muted` is wired into the dial and footer CSS but its backing token `--color-accent-mid` is never declared (no default in `tokens/defaults.ts` palette) — the dial value is integrated but non-functional out-of-the-box.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| packages/framework/src/tokens/defaults.ts (palette) + modules/footer/index.astro:87 | `accent-muted` footer surface emits `background: var(--color-accent-mid)` (no fallback); `accentMid` is not in the default palette, on `main`, or in any site's palette. Breaks the codebase invariant that every palette role has a default (cf. accentLight/accentDeep comment). Renders transparent bg + `--color-bg` text when used. | Critical |
| packages/framework/src/modules/text-style.ts:189 (`resolveFamily`) | Literal family names wrapped in `"..."` without escaping quotes/backslashes -> latent CSS-injection if a font-family value ever comes from untrusted input. Currently mitigated by schema/validate constraints. Defense-in-depth. | Warning |
| tools/generate/src/conformance/checks.ts:243 | `const innerWidth = window.innerWidth;` declared but unused inside the RESPONSIVE_PROBE browser template string (not lint-analyzed because it lives in a string). Dead code. | Nit |
| tools/generate/src/cli/capture/values-diff.ts:875-884 vs capture/theme.ts:39 (`isPill`) | Pill/badge geometry test duplicated across the capture/diff boundary; comment acknowledges the mirror but no shared constant keeps them in sync. | Nit |
| packages/framework/src/modules/row.ts:44-47 (ROW_CSS) | Shared `.fc-band` band lacks a `surface-accent-muted` rule; only relevant if a footer-style column ever participates in an fc-row shared surface (edge case; footer paints its own `.footer.surface-accent-muted`). | Nit |
| packages/framework/src/modules/text-markup.ts:437-462 | Unclosed emphasis marker (e.g. `hello *world`) is parsed as emphasized rather than literal. Lenient-parse choice; does NOT violate the documented `parse(serialize(x))` invariant (serialize always emits closing markers). Behavioural note only. | Nit |

**Verified false positives** (raised during review, refuted against the code — NOT issues):
- theme.ts `modal()` "crash on empty lineHeightPx array" — the guard `lineHeightPx: lh.length > 0 ? modal(lh) : null` is already present (theme.ts:55); `modal()` is otherwise only called on non-empty `cohort` (early-returns when `cohort.length < 2`). No crash path.
- hero/index.astro `<Fragment>` "missing import" — `Fragment` is an Astro built-in available in all `.astro` templates; no import required. Build + 54 UATs (which render the hero) are green.
- `extract.ts:283` regex un-escape (`/matrix\(...\)/`) — a correct fix, not a defect.

## Positives
- REQ-56 subscales generalize the existing token/dial + resolver pattern (`subScaleVars` in css.ts) rather than adding a parallel mechanism — consistent with project policy.
- REQ-52 hero slot positioning reuses the framework `--fc-*` coordinate model (`positionVars`) instead of duplicating.
- Old `gradient.ts` fully deleted and replaced (no legacy/fallback mode) — consistent with the no-backward-compat policy.
- REQ-52 oklch/modern-CSS colour resolution (canvas probe with jsdom regex fallback) handles invalid/transparent input gracefully.
- Hygiene clean: storage changes are JSON site content only; no `_v2` dup files; no debug/TODO/console.log in changed source.

## Checklist Compliance
No architecture, security, or design checklist reports exist for this anchor — sections skipped per instructions.

## Smoke Test
- Sanctioned path (the CLI's real Vite/Astro SSR transform, same as Vitest): exercised by the 54 passing regression UATs — the `1c` CLI logic (values-diff, fidelity, capture, render, conformance) runs green.
- Raw `node tools/generate/bin/1c.mjs --help` fails on a Node-ESM extensionless import of the externalized `@1stcontact/site-schema` `dist/` — this is a pre-existing worktree/tooling artifact (identical on `main`; this bundle does not touch site-schema package.json/tsconfig/exports or the bin), not a bundle regression.

## Issues Found
**Critical (must fix)**:
- Add a default `accentMid` gold to `defaultTokens.palette` so `--color-accent-mid` is always declared (the `accent-muted` footer surface — REQ-36's reference-footer gold — otherwise renders with an undefined background). Follow the accentLight/accentDeep precedent.

**Warnings (should fix)**:
- Escape quotes/backslashes in `resolveFamily` (text-style.ts) for defense-in-depth.
- Remove the unused `innerWidth` declaration in RESPONSIVE_PROBE (checks.ts:243).

## Fix-It Prompt
Scope: `packages/framework/src/tokens/defaults.ts` (primary), plus optional cleanups. Do NOT change behaviour elsewhere.

1. (REQUIRED) In `defaultTokens.palette` (tokens/defaults.ts), add an `accentMid` role — a muted/less-saturated gold between `accent` (`#f59e0b`) and `accentDeep` (`#b45309`), e.g. `accentMid: '#d98324'` (pick the value that matches the REQ-36 reference footer). Mirror the existing accentLight/accentDeep comment explaining the token is declared so `--color-accent-mid` always resolves even when a site omits it. This makes `paletteVars` emit `--color-accent-mid` in `:root`, so `.footer.surface-accent-muted { background: var(--color-accent-mid) }` renders. If the palette/token contract type enumerates roles, add `accentMid` there too so the token type-checks.
2. (RECOMMENDED) Strengthen the existing test so it catches this class of gap: in `tests/req36-heading-treatment.test.ts` around the accent-muted case, also assert the generated theme CSS declares `--color-accent-mid` in `:root` (i.e. the var resolves), not only that the footer rule references it.
3. (OPTIONAL) Remove `const innerWidth = window.innerWidth;` at `tools/generate/src/conformance/checks.ts:243` (unused).
4. (OPTIONAL) In `resolveFamily` (`packages/framework/src/modules/text-style.ts:~189`), escape `"` and `\\` in the literal family name before quoting.

Re-run the changed-test subset + the framework token/footer tests to confirm green.
