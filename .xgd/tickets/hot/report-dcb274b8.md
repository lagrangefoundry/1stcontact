---
uid: report-dcb274b8
id: REPORT-432
type: report
title: 'Code Review: bundle-df065afc (REQ-45/39/40/46/47/48)'
created_by: xgd
created_at: '2026-07-10T02:19:05.220476+00:00'
updated_at: '2026-07-10T02:19:05.220476+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-df065afc
  anchor_uid: bundle-df065afc
---

# Code Review — bundle-df065afc

**Result**: FAIL

## Summary
The implementation quality across all six tickets is high: capabilities are delivered as generalizations of existing modules (no new modules), token-backed with `.strict()` preserved, every new dial defaults to prior behaviour, and the REQ-46 content-safety boundary is wired thoroughly into every raw `href`/`src`/`action` sink. However, the review **FAILS on the test gate**: running the full suite (`vitest run`, the project's canonical `test` script) surfaces a regression this bundle introduced — `test_UAT_AC425` — that the reconcile's filtered quality run (96 of 553 tests, 457 deselected) never executed. A second full-suite failure (`test_UAT_AC424`) is pre-existing/environmental and **not** attributable to this bundle.

## Quality Gates
- **Lint**: success (0 errors, 0 warnings) — per report-19bf7640 / report-aadb4ad2.
- **Build**: success.
- **Tests (as reported by reconcile)**: pass — but this was a *filtered* run (`javascript-vitest`, 96 passed / 457 deselected). The filter did not include AC424/AC425.
- **Tests (full suite, run during this review)**: **2 failed | 551 passed (553)**. See below.

### Full-suite failures
1. **`tests/reconciliation-site-schema.test.ts > test_UAT_AC425_valid_site_validates_and_returns_value` — BUNDLE-CAUSED (blocking).**
   REQ-45 added a `tracking` group to `typographyTokensSchema` (`packages/site-schema/src/schema.ts:554`) using `.default({ normal: '0em', tight: '-0.025em', tighter: '-0.05em' })`. Because it is a `.default()` (not `.optional()`), `validateSite()` now *injects* the tracking group into its output. The reconciliation UAT does `expect(full.value).toEqual(submitted)` (line 180) against a `fullTheme()` fixture whose `typography` block (lines 33–48) has **no** `tracking` key — so the validated value carries an extra key the fixture lacks and the deep-equal fails. This is a pure in-memory validation test (no filesystem), so the failure is unambiguously the schema change. The REQ-45 notes updated the REQ-4 token-count UATs (61→64) but missed this round-trip-equality fixture.
2. **`tests/reconciliation-platform-scaffold.test.ts > test_UAT_AC424_identifiers_normalized_to_1stcontact` — PRE-EXISTING / ENVIRONMENTAL (non-blocking).**
   Fails at `expect(existsSync('sites/1stcontact')).toBe(true)`. The `sites/` directory is untracked in git (`git ls-tree HEAD sites` is empty) and absent from this reconcile worktree. The bundle touches nothing under `sites/`, `apps/`, or this test file, so it fails identically on `main`. Flagged for separate investigation; it does **not** gate this bundle.

## External Interface Accessibility
New entry points are wired in — no dead code found:
- REQ-46 safety boundary exported from framework (`packages/framework/src/modules/index.ts:28`, re-exported `src/index.ts:56`) and consumed in `hero`, `header`, `footer`, `services-grid`, `contact-form` `.astro`, `nav.ts`, and `markdown.ts`.
- REQ-39/40 conformance harness exported (`tools/generate/src/conformance/index.ts`) and surfaced from the package root (`tools/generate/src/index.ts`). It is a test-infrastructure seam (`assertModuleConforms`), not a CLI command — no parser registration expected or needed.
- REQ-48 ignore-mask flags wired into the `values-diff` CLI (`tools/generate/src/cli/index.ts:280`, help text at :92).
- REQ-45 dials wired into each module's `class:list` / `style` and backed by `--tracking-*` tokens (`tokens/defaults.ts`, `tokens/css.ts`).

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| packages/framework/src/modules/safety.ts | Clean single-source definition of "unsafe"; loud `ContentSafetyError` naming field+value. Well-documented. | OK |
| packages/framework/src/modules/{hero,header,footer,services-grid,contact-form}/index.astro | Every raw href/src/action sink wrapped in `assertSafeUrl(...)` with a descriptive context string. Consistent, complete. | OK |
| packages/framework/src/modules/dials.ts | New dials (`contentWidth`, `tracking`, `subheadLeading`, `submitForeground`, subhead/caption size) all closed enums, token-backed, default-preserving. | OK |
| tools/generate/src/conformance/{harness,checks}.ts | Isolation via `mkdtemp` (no site-data pollution), preserves sandbox on failure, `ContentSafetyError` treated as a safe rejection in the security dimension. Solid. | OK |
| tools/generate/src/conformance/checks.ts (SECURITY_PROBE) + framework/safety.ts | The "unsafe URL" rule is mirrored in two places (Node TS + a page-scope JS string). This is inherent — browser-scope code cannot import the framework module — and is documented, but the two copies can drift. Consider a shared source stringified into the probe if this grows. | Minor (non-blocking) |
| packages/site-schema/src/schema.ts:554 | `.default()` for `tracking` is a deliberate, correct choice per CLAUDE.md (don't break themes predating the group); the defect is the *un-updated fixture*, not the schema. | See gate failure |

No leftover debug code, commented-out blocks, TODO stubs, `_v2` suffixes, or duplicate files found. `.xgd/config.yaml` was not edited. New tokens added via `templates`/`defaults`, not the live config.

## Smoke Test
The changes touch the render path and the `values-diff` CLI; both are exercised by the test suite (551 passing tests including the new REQ-45/46/47/48 UATs and the REQ-39/40 conformance self-tests). The single blocking failure is a stale fixture, not a runtime crash.

## Issues Found
**Critical (must fix)**:
- `test_UAT_AC425_valid_site_validates_and_returns_value` fails: the `fullTheme()` fixture in `tests/reconciliation-site-schema.test.ts` was not updated for REQ-45's new `tracking` typography group, so the schema round-trip deep-equal breaks. The full `vitest run` is not green.

**Warnings (should fix)**:
- Pre-existing `test_UAT_AC424` failure (`sites/1stcontact` absent, untracked dir) leaves the full suite red in this worktree — not caused by this bundle, but should be tracked/resolved separately so `vitest run` can be green.
- Minor: the unsafe-URL rule is duplicated between `safety.ts` and the `SECURITY_PROBE` page-scope string; keep them in lockstep (or single-source) to prevent detector/enforcer drift.

## Fix-It Prompt
Fix the bundle-caused test regression only (do not touch the schema — its `.default()` is intentional per CLAUDE.md "don't break themes predating the group"):

1. In `tests/reconciliation-site-schema.test.ts`, in the `fullTheme()` fixture's `typography` block (after `lineHeights`, ~line 47), add the `tracking` group so the fixture matches the schema's now-defaulted output:
   ```ts
   lineHeights: { tight: '1.1', normal: '1.5', relaxed: '1.75' },
   tracking: { normal: '0em', tight: '-0.025em', tighter: '-0.05em' },
   ```
   This mirrors how the REQ-4 token-count UATs were updated (61→64) when the tokens were added. Any other `fullTheme()`-style superset fixtures in the same file used for round-trip equality must get the same key.
2. Re-run the full suite: `npx vitest run`. Confirm `test_UAT_AC425` passes and the only remaining failure (if any) is the pre-existing environmental `test_UAT_AC424` (`sites/1stcontact`), which is out of scope for this bundle.
3. Do NOT change `packages/site-schema/src/schema.ts` (the `.default()` is correct) and do NOT convert it to `.optional()` (that would make the resolved type nullable and break the token emitter).
