---
uid: report-720bf34d
id: REPORT-2166
type: report
title: 'Code Review: bundle-d9226698'
created_by: xgd
created_at: '2026-08-16T23:37:01.320705+00:00'
updated_at: '2026-08-16T23:37:01.320705+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bundle-d9226698
  anchor_uid: bundle-d9226698
---

# Code Review

**Result**: PASS

## Summary

The three free-coded commits this bundle carries — BUG-34 (`38cb202b1`, glyph-fill preview) and REQ-137 (`d0a569a3e` + `c48b7be69`, shade-on-the-reference) — are high quality: fully integrated, no legacy path left standing, densely evidenced, and consistent with the surrounding code. The single CRITICAL from the prior review (`report-2793d074`) — the remapped orphan `64a1f7023` reverting main's echo-guard fix in `packages/site-schema/src/l1/edit.ts` and deleting the three suites that proved it — is **verified resolved**: `edit.ts` and all three suites are now byte-identical to main.

The scoped quality gate on this bundle is vacuous (`"suites": {}`, 0 tests executed), so the test evidence below was re-established by this reviewer, including a **main-baseline comparison run** to separate this bundle's effect from the branch's pre-existing failures.

## Quality Gates

| Gate | Status | Evidence |
|---|---|---|
| Lint | pass (vacuous) | `report-893a2bbe`: 0 errors / 0 warnings in 0.0001s. The project declares no lint script, so this gate is a no-op by configuration. |
| Build | **pass** | `pnpm -r build` → **exit 0**, 7 workspace projects, `tsc --noEmit` clean for `control-app` and `public-site`. |
| Typecheck (changed packages) | **pass** | `packages/site-schema` → `tsc --noEmit` **exit 0**. `tools/generate` fails at `src/cli/builder.ts:337` (TS2345) — **verified identical in the `main` worktree (`5046dd0db`)**, and `builder.ts` is not in this diff. Pre-existing, not this bundle's. |
| Tests (scoped report) | pass, but **vacuous** | `report-893a2bbe` records `"suites": {}` — 0 tests executed. Proved nothing about this bundle. Re-run below. |
| Tests — HEAD, full suite | 74 failed / 1454 passed / 67 skipped (223 files: 12 failed, 207 passed, 4 skipped) | `pnpm test` on `4093b7e70`. |
| Tests — **main baseline**, full suite | 74 failed / 1421 passed / 67 skipped (218 files: 12 failed, 202 passed, 4 skipped) | Same vitest binary, `main` @ `5046dd0db` in a detached worktree with the workspace `node_modules` grafted in. |
| **Net effect of this bundle** | **+33 passing tests, +5 test files, ZERO new failures** | The 74 failures fall on the **identical 12 files** in both runs — all AI tool-surface suites (`box.run(...)` returns an array where a string is expected). Pre-existing on main; the REQ-137 ticket body flags the same population. |
| Tests — the bundle's own 8 suites | **70 passed / 70, nothing skipped** | `vitest run` over `test_UAT_FC_BUG-34_glyph_fill_preview`, `test_UAT_FC_REQ-137_palette_shade`, `reconciliation-colour-shade-axis`, `reconciliation-colour-retrofit-shade-model`, `reconciliation-copy-edit-glyph-paint`, `req114-palette-model`, `reconciliation-colour-census-and-retrofit`, `reconciliation-colour-palette-overlay`. The two `skipIf(!WEBUI_INSTALLED)` suites **ran** — the webui components are present, so the BUG-34 evidence is real and not a silent skip. |
| Coverage | not measured | The configured scoped gate emits no coverage figure. No threshold breach is assertable; the bundle adds 33 passing tests across 5 new suites. |

### Prior-review CRITICALs — verified resolved

- **Orphan reverted main's `edit.ts` fix** → `git diff main -- packages/site-schema/src/l1/edit.ts` prints **nothing**.
- **19 tests of `locked`-field evidence removed** → none of `test_UAT_FC_REQ-135_text_properties.test.ts` or its two sibling suites appear in `git diff main..HEAD --stat`; all three are byte-identical to main. Corroborated by the baseline arithmetic: main runs 218 test files, HEAD runs 223 — the delta is exactly this bundle's 5 new suites, with nothing lost.

## External Interface Accessibility

Wired in — **no dead code found**.

| Surface | Wiring | Evidence |
|---|---|---|
| `shadeHex` (the shade axis) | exported from the package barrel | `packages/site-schema/src/l1/index.ts:18`; consumed by `resolveL1Color` (`palette.ts:243`) and by `tools/generate/src/cli/colors.ts:42` |
| `shade` on the reference | in the schema and the validator | `palette.ts:105`; `validate.ts:642` |
| `SHADE_FIT_TOLERANCE` | reaches the operator through `--help` | exported `colors.ts:372`, interpolated into the CLI help at `cli/index.ts:317` |
| `AssignResult.drift` | printed by `formatAssign` | `colors.ts:722-730`; deliberate `--json` omission documented at `cli/index.ts:999-1004` |
| `--preview-text-image` / `-clip` / `-fill` | emitted by `readGlyphFill`, consumed by the stylesheet | `page-style.js:203-238` → `builder.css:284-300`; asserted end-to-end by `test_UAT_FC_BUG-34_the_control_draws_the_glyph_paint_not_the_box` |
| `steps` removal | complete, no legacy path | `grep` over `packages/`, `apps/`, `tools/`, `storage/` finds no `step`/`steps` palette key; `storage/sites/xgd` is 7 single-value entries, `gigabytealchemy` 15 |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tools/generate/src/cli/colors.ts:595` | `resolvedHex` re-implements `resolveL1Color`'s shade + alpha resolution instead of calling it. Proof 1 therefore validates the census against a *second copy* of the resolution logic, not the path the renderer takes — the one duplication the bundle elsewhere goes out of its way to avoid (`fitShade` deliberately searches over the renderer's own `shadeHex`). Mitigated: `test_UAT_FC_REQ-137_retrofitted_sites_use_shades_and_resolve_within_the_bound` and `test_UAT_FC_REQ-114_derived_references_reproduce_every_literal` both drive the real `resolveL1Color`, so a divergence would not pass silently. Pre-existing shape, updated in place. | Warning |
| `tools/generate/src/cli/colors.ts:498` | `best as { … }` cast in `toEntry`. Safe (a family always has ≥1 member so the loop always assigns), but a non-null assertion or an initialised accumulator would carry the invariant in the types. | Nit |
| `packages/site-schema/src/l1/palette.ts:210` | `shadeHex` parses the three channel bytes before the `shade === 0` early return — trivial dead work on the hot path. | Nit |
| `packages/site-schema/src/l1/palette.ts` | Oklab conversion, the `[-1, +1]` axis, and the chroma-only-decreases corollary are one implementation with the rationale stated at the point of the trade-off. `steps` deleted outright — no fallback, no dual reader, no mode detection. Matches CLAUDE.md → "No Legacy Modes". | ✅ |
| `tools/generate/src/cli/colors.ts:527-563` | The round-based derivation terminates on a *proved* invariant, and the impossible case throws `CommandError{code:'INTERNAL'}` rather than looping or silently leaving a colour unconverted — correct failure-vs-error taxonomy. | ✅ |
| `apps/control-app/src/builder/page-style.js:203-238` | `readGlyphFill` returns `null` when there is no glyph fill, so no variable is written; every `builder.css` fallback is the property's own initial value. A run without a gradient computes exactly what it computed before — and the UAT asserts precisely that, including `expect(rule).not.toMatch(/var\(--preview-text-[a-z]+\)/)` to catch a fallback being dropped later. | ✅ |
| changed files | No TODO/FIXME, no `console.log` debug, no commented-out blocks, no `.only`/`.skip` introduced. | ✅ |

### Evidence validity

New and modified UATs use real components throughout — no `vi.mock`, no `vi.fn`, no internal stubbing in any of the five new suites. BUG-34's suite renders through the real `1c render --edit`, mounts the real edit bridge and the real dialog, and opens it by dispatching a click on the words; the only substitution is the origin's port. Its one unavoidable gap (jsdom does not resolve `var()` in `getComputedStyle`) is **declared in the file header** and covered by asserting `builder.css` directly rather than being quietly skipped. Suite modifications to `req114-palette-model` and `test_UAT_FC_REQ-130_beyond_l1` update the model, they do not weaken it — REQ-130's deep-merge evidence is relocated to `theme.typography`, where depth still exists, rather than dropped.

## Checklist Compliance

No architecture, security, or design checklist reports exist for this project (`xgd ticket list --type report --filter fields.report_kind=…` returns 0 items for all three). Sections omitted per the review contract.

Checked against the standing policy in CLAUDE.md and DOC-2 regardless: the change adds a **typed** axis to L1 rather than a raw-CSS hole, keeps every value a bounded scalar (`z.number().min(-1).max(1)`, rejected out-of-range with a UAT), keeps entries `.strict()`, and introduces no new module. The builder's `--preview-text-image` carries an already-parsed *computed* value from a render whose gradient came through the validated L1 schema, absolutised by the existing `withAbsoluteUrls` — no new injection surface.

## Smoke Test

| Entry point | Invocation | Result |
|---|---|---|
| `1c --help` | `node tools/generate/bin/1c.mjs --help` | Colours section renders, `SHADE_FIT_TOLERANCE` interpolates as `8/255`, REQ-137 contract stated. No trace. |
| `1c colors <slug>` | `node tools/generate/bin/1c.mjs colors xgd` | 18 distinct colours / 16 distinct RGB, alpha families reported. Exercises the retrofitted `site.json` through `resolveL1Palette` end-to-end — the stored shade references resolve. No trace. |

`--assign` was **not** invoked: it writes to `storage/`, and this review is read-only. Its behaviour is covered by `reconciliation-colour-retrofit-shade-model.test.ts` (AC-941/944/945/947, including the fixpoint), all green.

## Issues Found

**Critical (must fix)**:
- None.

**Warnings (should fix)**:
- `tools/generate/src/cli/colors.ts:595` — `resolvedHex` duplicates `resolveL1Color`. Two implementations of shade+alpha resolution now have to stay in sync. Not blocking (independent UAT coverage drives the real function), but worth collapsing.

**Flagged for the operator (pre-existing, out of this bundle's scope, verified identical on `main`)**:
- 74 tests across 12 AI tool-surface suites (`REQ-122/126/127/129/130`, `reconciliation-assistant-*`, `reconciliation-page-composition-surface`, `reconciliation-beyond-l1-authoring`) fail on `main` and on this branch with the same count and the same file set — `box.run(...)` returns an array where a string is expected.
- `tools/generate` typecheck: `src/cli/builder.ts:337` TS2345, identical on `main`; the file is untouched here.
- The scoped quality gate for this bundle (`report-893a2bbe`) executed **0 tests**. It is passing vacuously and gives the reconcile no test signal at all — worth fixing so the next bundle does not depend on a reviewer re-running the suite by hand.
