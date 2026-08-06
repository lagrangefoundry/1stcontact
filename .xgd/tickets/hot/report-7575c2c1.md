---
uid: report-7575c2c1
id: REPORT-1387
type: report
title: 'Code Review: bundle-ee56a66e'
created_by: xgd
created_at: '2026-08-06T04:44:16.290336+00:00'
updated_at: '2026-08-06T04:44:16.290336+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-ee56a66e
  anchor_uid: bundle-ee56a66e
---

# Code Review

**Result**: PASS
**Mode**: commits
**Anchor**: bundle-ee56a66e (BUNDLE-11)

## Summary

53 free-coded commits across 16 source tickets (BUG-11..BUG-28, REQ-88..REQ-107), ~9,200 lines of production change in `packages/site-schema`, `packages/framework` and `tools/generate`, plus ~34,000 lines of tests and site data. The work is architecturally coherent with the REQ-96 pivot the bundle itself codifies: `carousel`'s `config.view` and `contact-form`'s stylesheet are **deleted, not deprecated**; both modules now paint only declared invariant elements; the default look is relocated to a genuine L2 preset (`packages/framework/src/l2/contact-form.ts`); and every stored site instance is migrated to `contact-form@4` with the new required `form` slot — no legacy path, no version-detection branch, consistent with CLAUDE.md §"No Legacy Modes".

Gates verified independently rather than taken from the report. Every new CLI verb is dispatched, documented in `USAGE`, and smoke-tested. Findings are four warnings; none is a correctness or security defect.

## Quality Gates

The most recent quality ticket (report-59cda115) is a **scoped** run reporting `0 tests, 0 failed` with an empty `suites` map and a lint stage of 0.0001s — it carries no signal for this bundle, so the gates were re-run directly in this worktree.

| Gate | Source | Result |
|---|---|---|
| Tests | `pnpm vitest run` (this worktree) | **931 passed / 0 failed / 67 skipped**, 140 files passed / 4 skipped |
| Build | `pnpm -r build` (`tsc --noEmit` × 7 projects) | **exit 0** |
| Lint | `.xgd/config.yaml` defines no lint command; `package.json` has no lint script | **no-op** — the reported "0 errors, 0 warnings" is vacuous. `tsc --noEmit` is this project's real static gate and passes. Pre-existing project configuration, not introduced here. |
| Coverage | `quality.min_coverage_percent: 25.0`; the scoped run measured none | not measured. 998 tests over the changed surface; the new code carries dense per-REQ UAT files (req94/96/97/98/99/100/101/102/103/104/105/106/107, bug12–bug28). |

## External Interface Accessibility

New entry points wired in: **yes**, all of them.

| Surface | Registration | Evidence |
|---|---|---|
| `1c gate` (REQ-94) | dispatch + USAGE + exports | `tools/generate/src/cli/index.ts:510`, USAGE block, `index.ts:127-141` |
| `1c fonts check` (REQ-101) | dispatch + USAGE + exports | `tools/generate/src/cli/index.ts:827`, `index.ts:55-70` |
| `1c new` L1 scaffold (REQ-102) | existing verb, new behaviour | `tools/generate/src/cli/scaffold.ts`, dispatch at `index.ts:303` |
| `contactFormPreset` (L2) | framework barrel | `packages/framework/src/index.ts:110`; used by `tests/framework-content-modules.test.ts:60` and `tests/reconciliation-behavior-l1-composition.test.ts:449` |
| `projectIssues` | both validators | `packages/site-schema/src/validate.ts:42`, `l1/validate.ts:557` |
| `l1ControlNames` / `resolveControlNames` / `validateBehaviorControls` | schema + behavior barrels, called by the instance validator | `l1/index.ts:9`, `modules/behavior.ts:354`, `behavior.ts:386` |
| `latestModuleVersion` | framework barrel, called by repro | `modules/registry.ts:32`, `tools/generate/src/cli/repro.ts:157` |
| `L1_REVEAL_SCRIPT`, `L1ControlElement`, `L1ControlTag` | framework barrel | `packages/framework/src/index.ts:99-106` |

No dead module, uncalled export, or unconfigured surface found.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/framework/src/modules/behavior.ts:78` | `BehaviorControlSpec.element` is documented as "the tag the module emits" but is never read anywhere, and the shipped values are wrong: `contact-form.controls.field` says `'input'` though a `textarea`-typed field emits `<textarea>` (`contact-form/controls.ts:53-58`), and `label` / `turnstile` say `'span'` while `index.astro` emits `<label>` / `<div>`. | Warning |
| `bin/author_xgd_sections.py`, `bin/verify_req100_reveal.mjs` | Both self-labelled "Throwaway … not shipped … not part of the test suite" (764 lines combined) yet committed to `bin/`, alongside project tooling. | Warning |
| `packages/framework/src/l1/render.ts:811` | `controlHtml` interpolates `el.tag` into markup with no runtime membership check, while attribute names in the same function are guarded by `isSafeAttrName` with an explicit defence-in-depth rationale. | Warning |
| tests | 67 skipped, several AC-bearing (`test_UAT_AC871_*`, `test_UAT_FC_REQ-96_gigabyte_*`, `test_UAT_FC_BUG-25_*`, `test_UAT_FC_REQ-88_surface_attribution_*`). | Warning |
| everything else | No TODO/FIXME/HACK, no `@ts-ignore`, no `eslint-disable`, no commented-out code, no stray `console.log` (the 5 present are CLI output). Constants are named, exported and documented (`PERCEPTUAL_MEAN_FLOOR`, `PERCEPTUAL_PCT_FLOOR`, `SECTION_DENSITY_PX`) and overridable per run via `--mean-floor` / `--pct-floor`. | — |

Positive notes worth recording: `packages/site-schema/src/issues.ts` solves union-path localisation by *discovering* the discriminator and requiring a single survivor, so a non-tag enum can never be mistaken for the tag — and declines to guess when the union is genuinely ambiguous. `modules/styles.ts` `extractStyleBlocks` fixes two real emitters of corrupt `theme.css` (a doc comment mentioning `<style>`, and self-closing `<style set:html>`), each with the failure mode written down. `client.js` `canEnhance` decides *before* `preventDefault`, restoring the no-JS baseline for `mailto:`/`tel:` actions.

## Checklist Compliance

No architecture, security, or design checklist report exists (`xgd ticket list --type report --filter fields.report_kind=<kind>` returns 0 for all three). Sections omitted per the review contract.

The standing policies in CLAUDE.md and DOC-2 were checked against the diff regardless:

- **Structured-only / no raw-CSS hole**: held. Every new axis is a typed scalar or closed enum (`border.style`, `fontStyle`, `objectFit`, `listMarker`, `ring.style` are all `z.enum`). The new URL sinks are allowlisted at both layers — `link.href` (`l1/validate.ts:526`, `render.ts:1139`), `resources.fonts[].src` (`validate.ts:578`, `render.ts:151`), `backgroundImageUrl` (`validate.ts:356`) — and `cssUrl` (`render.ts:104`) checks scheme *and* an independent character allowlist that excludes newline, quote and paren.
- **Module ships zero CSS beyond declared invariants**: held, and now *enforceable*. `contact-form`'s stylesheet is reduced to the visually-hidden label, honeypot, Turnstile mount, error surface and zero-layout wrapper; `carousel`'s to track mechanics plus one opacity state signal. `validateBehaviorControls` (`behavior.ts:341`) is the check that makes it verifiable, and `test_UAT_AC809_modules_ship_no_css_beyond_declared_invariant_elements` passes.
- **`config` is data-only, never aesthetic**: held. `carousel.config.view` (the canonical violation) is deleted along with its `flex-basis` rules; the new config fields — `submitLabel`, `labelMode` — are behavioural copy and a captured a11y fact respectively, with the reasoning recorded at `contact-form/meta.ts:41-46`.
- **Close gaps in L1, not with new modules**: held. Twelve of the sixteen tickets add typed L1 primitives (texture, radial gradient, link role, interaction state, scroll reveal, per-node axis groups, responsive layout track, text measure, `control` leaves); no new behavior module was authored.
- **No legacy modes**: held. `contact-form` 3→4 is a breaking replacement — `intro`/`submit` slots removed, `form` required — with all three stored instances migrated (`storage/sites/{gigabytealchemy,xgd}` → `version: 4`, `slots: ['form']`) and no v3 left in the catalog. The legacy `modules/dials.ts` / `text-style.ts` resolvers were **not extended** by this bundle (zero diff), matching the CLAUDE.md instruction.

## Smoke Test

Run in this worktree against the built tree:

| Invocation | Result |
|---|---|
| `1c help` | usage renders, exit 0 |
| `1c fonts check` | exit 0 — "10 registered families, 6 reference(s) across 2 site(s), 6 font file(s) on disk"; PASS with 3 advisory licence actions (Cinzel, Satoshi, JetBrains Mono) |
| `1c new smoke-b11 --sandbox` | exit 0, draft created |
| `1c render smoke-b11 --sandbox` | exit 0, 2 files — the REQ-102 scaffold renders without hand-editing |
| `1c gate` / `1c l1-gate` (no `--ref`) | clean error + usage, no stack trace |

`1c gate --ref <bundle>` could not be exercised end-to-end: `storage/references/` does not exist in this worktree (the same absence that skips the oracle-gated UATs). Its error path, its report formatter and its reconciliation logic are covered by the 359-line `tests/req94-cross-gate-reconciliation.test.ts` and 749-line `tests/reconciliation-cross-gate-reconciliation.test.ts`, all passing. Working tree left clean (`git status --porcelain` empty; sandbox and dist are gitignored).

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:

- `BehaviorControlSpec.element` is unread contract metadata whose shipped values contradict what the modules emit (`behavior.ts:78`; `contact-form/meta.ts:56-64` vs `controls.ts:53-58` and `index.astro:76,130,136`). Dead metadata that is also wrong will mislead the first validator that tries to use it — either enforce it in `validateBehaviorControls` or drop the field.
- Two self-declared throwaway scripts are committed to `bin/` (`author_xgd_sections.py`, `verify_req100_reveal.mjs`). If the authoring helper is genuinely how `storage/sites/xgd/draft/pages/home.json` is regenerated, it is a tool and should say so instead of "throwaway"; the REQ-100 verifier is superseded by the passing UATs.
- `controlHtml` does not re-check `el.tag` against the `L1ControlTag` set at the sink, unlike the attribute names beside it. Unreachable today (control elements are framework-authored and TS-typed), so this is a consistency gap in the stated Layer-2 posture rather than a live vulnerability.
- 67 tests skip in this environment, including AC-bearing UATs gated on `it.runIf(browserOk)` and `it.skipIf(!HAVE_GA_ORACLE)`. The gating pattern is pre-existing and not introduced by this bundle, but it means AC-871 and the REQ-96 gigabyte-oracle ACs are proven only where a browser and `storage/references/` are present — the regression environment, not here.
