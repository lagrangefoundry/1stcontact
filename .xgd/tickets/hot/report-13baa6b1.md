---
uid: report-13baa6b1
id: REPORT-11563
type: report
title: 'Code Review: bundle-0d00566a'
created_by: xgd
created_at: '2026-11-08T20:17:11.019033+00:00'
updated_at: '2026-11-08T20:17:11.019033+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: bundle-0d00566a
  overrides_audited: 2
  trust_boundary_overrides: 0
  anchor_uid: bundle-0d00566a
---

# Code Review

**Result**: FAIL

## Summary
The free-coded bundle (REQ-210 Marked Points, REQ-211 multi-variate text runs, REQ-212 L1 modals, REQ-213 material role correction, BUG-67/69/70/71/72) is wired in, readable and consistent with its surroundings, and the quality gates pass. One finding fails the review: the new text-run emitter in the L1 renderer writes two numeric axes into CSS without the emit-time numeric guard that the Security Policy (§2 Layer 2) requires and that every neighbouring emitter applies. 2 overrides audited, 0 touched a trust boundary.

## Quality Gates
- Lint: success. Build: success. Preflight: pass. Overall: success (report 2026-11-08T20:06:31Z).
- Re-run in this review: typography, REQ-211 multi-variate text, REQ-212 modals, library role-correction and BUG-70 test files: 5 files, 59/59 pass.
- The workers test files for `/api/material/role` could not be re-run here because the sandbox blocks local port binding (`listen EPERM 127.0.0.1`). The pipeline's quality report covers them.

## External Interface Accessibility
New entry points are wired in: yes.
- `POST /api/material/role` is registered in `apps/control-app/src/router.ts` (the `p === '/api/material/role'` branch). It calls `reviseRole` (`material.ts`), and `RoleNotChosenError` (403) and `AlreadyOnSiteError` (409) are mapped in the shared error block through `scrub`.
- `points.js` is imported by `app.js:4`. The framework `marked-points.js` and site-schema anchors are imported by `main.js:7-8`.
- `inline-runs.ts` is imported by `fold.ts:67`. `L1_DIALOG_SCRIPT` is pushed to `scripts` only when `state.hasDialog` is set.

## Code Quality
| File | Finding | Severity |
|------|---------|----------|
| packages/framework/src/l1/render.ts:2163,2166-2168 | `textRunsHtml` emits `font-size: ${a.sizeScale}em` and `vertical-align: ${a.baselineShiftEm}em` with only an `!== undefined` check. Neighbouring emitters use `Number.isFinite` (`px` helper :91, weight :232, rotate/scale :671-673). A value that bypassed `validateL1` would be written raw into the published stylesheet. This breaks Security Policy §2 Layer 2 ('lengths are numeric'). No test passes a non-numeric run axis to the renderer. | Critical |
| packages/framework/src/l1/render.ts:2165 | Run `fontStyle` is emitted without re-checking the enum at emit time. This matches the existing pattern at :233 and :2350, so it is not a regression, but it is weaker than Layer 2 intends. | Warning |
| apps/control-app/src/builder/points.js (`evaluateMeasure`) | Parses uploaded SVG as live markup into a shadow root in the builder's own document (`new Function`), gated by `isMeasurable` and the closed SVG grammar. It is documented and fails closed, but any loosening of `svg.ts` becomes script execution with the builder's session. | Warning |
| apps/control-app/src/builder/builder.css:1146 | `.builder-library__badge--role` restates the base badge's colour and border. This is redundant but intentional (AC-2232 requires a matching rule) and has no visible effect. | Info |

## Checklist Compliance
No architecture_checklist, security_checklist or design_checklist reports exist for this bundle, so this section was skipped. The Security Policy was applied directly; see Code Quality.

## Mode Override Audit
2 overrides audited, 0 touched a trust boundary.
- report-22b124dd (code_frozen, rung 3). Item 1: only builder.css changed. Item 2: tests green. Item 3: AC-2232 'none restates the size as a literal' is satisfied. Item 4: the single declaration at builder.css:2064 is `font-size: var(--builder-control-font-size)` immediately after `font: inherit`. Item 5: no trust boundary. Item 6: the file is named and no behaviour was added. PASS.
- report-974846f1 (code_frozen, rung 2). Item 1: `unnamed_files_touched` is empty. Item 2: the typography file is green. Item 3: AC-2232 'every builder-* class matched by a rule' is satisfied; library.js:472 emits `--role`, and builder.css:1146 matches it. Item 4: within the justification. Item 5: no trust boundary. Item 6: the rule restates the existing muted look, so no new behaviour. PASS. Note: the same batch edited the typography test's fake `subscribe` to return `{ close }`, although the planner instructions said to leave the test alone. The edit only makes the fake match the real `subscribeMaterial` (`api.js`, which returns `{ close }`). It does not weaken any assertion and is outside code_frozen scope, so it is recorded here and not failed.

## Smoke Test
Entry points tested: `POST /api/material/role` is exercised by `reconciliation-library-role-correction.workers.test.ts` and `test_UAT_FC_REQ-213_material_role.workers.test.ts`. They are green per the quality report but could not be re-run locally because the sandbox forbids local port binding. Renderer and builder entry points were exercised by the re-run test files (59/59 pass).

## Issues Found
**Critical (must fix)**:
- `packages/framework/src/l1/render.ts:2163` and `:2166-2168`: the text-run `sizeScale` and `baselineShiftEm` values reach the stylesheet with no emit-time numeric guard (Security Policy §2 Layer 2).

**Warnings (should fix)**:
- `render.ts:2165`: run `fontStyle` is not re-checked against its enum at emit time.
- `points.js` `evaluateMeasure`: live-parsing uploaded SVG relies entirely on the `svg.ts` grammar. Keep that coupling explicit.

## Fix-It Prompt
In `packages/framework/src/l1/render.ts`, function `textRunsHtml` (around lines 2155-2176), add the same emit-time guards the neighbouring emitters use:
1. Change `if (a.sizeScale !== undefined)` to `if (a.sizeScale !== undefined && Number.isFinite(a.sizeScale))`.
2. Change `if (a.baselineShiftEm !== undefined)` to `if (a.baselineShiftEm !== undefined && Number.isFinite(a.baselineShiftEm))`.
3. Change `if (a.fontWeight !== undefined)` to also require `Number.isFinite(a.fontWeight)`, matching line 232.
4. Emit `fontStyle` only when it is `'normal'` or `'italic'`, for example `if (a.fontStyle === 'italic' || a.fontStyle === 'normal')`.
Do not change the validator, the schema or any other emitter. Add one UAT to the existing REQ-82 envelope-security suite or to `tests/test_UAT_FC_REQ-211_multi_variate_text.test.ts`. It should pass `renderL1Document` a document whose run axes carry strings (`sizeScale: '1;}body{display:none' as unknown as number`, the same for `baselineShiftEm`, and `fontStyle: 'italic;color:red' as never`), skipping `validateL1`. It should assert that the emitted CSS contains neither `}body{` nor `color:red`, and that the run text is still rendered and escaped. Name the test `test_UAT_..._run_axes_are_inert_at_emit_time`, following the suite's existing AC naming. Run the REQ-211 and REQ-82 suites and confirm they are green.
