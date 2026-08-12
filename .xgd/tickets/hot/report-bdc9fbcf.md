---
uid: report-bdc9fbcf
id: REPORT-1882
type: report
title: 'Code Review: request-a8ccd0dd'
created_by: xgd
created_at: '2026-08-12T19:17:18.624561+00:00'
updated_at: '2026-08-12T19:17:18.624561+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: request-a8ccd0dd
  anchor_uid: request-a8ccd0dd
---

# Code Review

**Result**: PASS

## Summary

Re-review after the fix loop. Both defects the prior review (REPORT-1878) raised are
fixed, and I verified each is load-bearing by reverting it in isolation and watching the
exact reported failure return. The implementation is high quality: every control is
closed by construction, the proportional track write is correct, and the commentary
carries the measured evidence behind each decision rather than asserting it.

The two gates the prior review could not verify I verified by direct invocation rather
than through the quality gate: `pnpm -r build` succeeds and `tsc --noEmit` exits 0 on
both changed packages. Lint remains genuinely unrunnable — the repo has no eslint config
and no eslint binary — but that is pre-existing project infrastructure, not something
this ticket introduced or can fix in scope.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Tests (REQ-135 suites) | **PASS** | `test_UAT_FC_REQ-135_text_properties`, `reconciliation-copy-edit-typography`, `reconciliation-copy-edit-parameter-sheet` — **19/19 pass, 0 skipped** |
| Tests (full suite) | **PASS for this change** | 13 failed / 1512 passed / 4 skipped. **Independently verified pre-existing**: I reverted REQ-135's five production files to `eba1c3385^` and reran the three failing suites — identical 13 failures, 13 passed. Worktree restored clean. |
| Build | **PASS** | `pnpm -r build` → all 7 projects Done. `npx tsc -p packages/site-schema/tsconfig.json --noEmit` → exit 0. `npx tsc -p tools/generate/tsconfig.json --noEmit` → exit 0. |
| Lint | **NOT RUNNABLE — pre-existing, out of scope** | `.xgd/quality.yaml` declares `lint.tools: [eslint]`, but no `eslint.config.*` / `.eslintrc*` exists and `node_modules/.bin` has no eslint. The quality report's `lint: success, 0 errors, duration 0.0001s` is vacuous. |
| Coverage | Not separately measured | The gate never executed a test (below). |

### The quality gate is still passing vacuously

REPORT-1880 reads `Scoped quality: pass (0 tests, 0 failed)`; REPORT-1876 records
`deselected: 1527`, `total: 0`, with the gate's own INFO: *"Suite 'javascript-vitest'
ran with an empty scope: 1527 tests were collected and all were deselected by the -k
filter."* **No quality report in this reconcile has executed a test.** Every test result
in this review is from running vitest directly. This is an XGD tooling defect, unchanged
since the prior review, and not attributable to the reviewed code.

## External Interface Accessibility

Wired in — no dead code.

| Seam | Evidence |
|------|----------|
| `L1FieldValue` exported | `packages/site-schema/src/l1/index.ts:51` |
| `fonts` reaches the derivation | `tools/generate/src/cli/edit.ts:468-486` (`segmentOptions` + `documentFonts`) |
| Consumed by both verbs | `editCopyGet` `:501-502`, `editCopySet` `:541` |
| Parameter sheet mounted | `apps/control-app/src/builder/editor.js:287-360`; handle declared `:240`; destroyed `:245`; staged `:380`; dirty `:386` |
| `.builder-modal__props` styled | `apps/control-app/src/builder/builder.css` |
| `boxFields` / `propertyFields` split | `editor.js:296-297`, split on descriptor `type`, and `openLoneControl` correctly recounted over `boxFields` (`:341`) |

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `packages/site-schema/src/l1/edit.ts:787` | **Prior critical FIXED.** Locked field now refused on change, not presence. Doc comment `:762-770` rewritten to state the new rule. | Resolved |
| `packages/site-schema/src/l1/edit.ts:720` | **Prior major FIXED.** Absent `fontWeight` axis is not populated by the seeded default; the cost is stated explicitly in the comment as requested. | Resolved |
| `packages/site-schema/src/l1/edit.ts:787` | `value !== derived.values[name]` is a strict scalar comparison. Sound today — `locked` is only ever set on `italic`, a boolean (`:432-437`). **Latent for phase B**: a locked colour field's derived value is `{ref, step}`, where `!==` is reference inequality and would refuse unconditionally — reintroducing the exact defect just fixed. | Warning |
| `packages/site-schema/src/l1/edit.ts:694` | `const current = axes.fontSizePx` shadows the `current` parameter, which is load-bearing in the very next branch (`:720`). Correct, but a readability trap in the one function where the two meanings differ. | Warning (minor) |
| `tests/test_UAT_FC_REQ-135_text_properties.test.ts:390` | `describe.skipIf(!WEBUI_INSTALLED)(\`the dialog (${WEBUI_SKIP_REASON})\`)` interpolates the skip reason unconditionally, so the report reads "webui components not installed" even when the block runs and passes. **Not pre-existing** as the fix report stated — other suites (`req117-edit-loop`, `req117-builder-viewport-fill`) use plain titles. Cosmetic, but it contradicts `tests/support/webui-installed.ts:18` ("the skip is deliberately visible in the test report"). | Warning (minor) |
| `tests/test_UAT_FC_REQ-135_text_properties.test.ts:390` | The three dialog UATs — including both that prove the critical fix — are gated on `WEBUI_INSTALLED`, an *implicit* dependency absent on a fresh clone or CI. The critical regression's protection is therefore machine-dependent. Established codebase pattern and explicitly reasoned upstream, so not a defect in this change. | Warning |

No leftover debug code, no commented-out blocks, no TODO stubs, no duplicated helper
logic, no magic numbers outside the two named `TEXT_SIZE_*_PX` constants.
`writeTypography` mutates the existing axes bag rather than replacing it, and the
absent-is-the-default rule for `italic`/`textTransform` is right.

### Fixes independently verified load-bearing

Each reverted in isolation against the current worktree; worktree restored clean after
each (`git status --short` empty).

| Reverted | Result |
|---|---|
| Fix 1 → `if (field.locked) {` | **2 failed / 7 passed.** Both new UATs fail with `Field 'italic' is not editable on this segment.` — the exact reported symptom. |
| Fix 2 → guard line deleted | **1 failed / 8 passed.** `expected 400 to be undefined`. |

## Checklist Compliance

No architecture, security, or design checklist reports exist — all three
`xgd ticket list --type report --filter fields.report_kind=<kind>` queries return
`"items": []`. Sections omitted per the review contract.

Noted anyway against DOC-2: the structured-only invariant holds. Every added control is
a bounded integer, a closed enum, or a boolean; nothing on this surface can express raw
CSS or HTML. The security property of `locked` is preserved by the fix — a locked field
still can never be *changed*, only echoed.

## Smoke Test

Entry points exercised end-to-end against the real CLI (`tools/generate/bin/1c.mjs`):

- `1c --help` → exit 0, full usage, `copy get` / `copy set` documented.
- `1c new smoke-req135 --sandbox` → site created.
- `1c copy get smoke-req135 home 0.0 --json` → `ok:true`, text run returns the REQ-135
  descriptors: `text`, `fontSizePx` (integer, min 6, max 128), `italic` (boolean),
  `textTransform` (enum, 4 options). `fontWeight` correctly withheld — the scaffold
  declares no faces, so the option list is under two.
- `1c copy set … --values '{"text":…,"fontSizePx":64,"italic":false,"textTransform":"uppercase"}'`
  → `ok:true, changed:["text","fontSizePx","textTransform"]`; `italic` echoed unchanged
  and correctly not in `changed`. Re-read confirms all three persisted.
- Range refusal: `--values '{"fontSizePx":900}'` → `SCHEMA_INVALID`,
  `Size (px) must be at most 128 (got 900).`
- Missing-arg path returns a structured error, not a stack trace.

Sandbox site removed; worktree clean.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix, not blocking)**:

- `edit.ts:787` — the locked comparison is scalar-strict. Before phase B lands a locked
  colour field, this needs a value-equality comparison or the fixed defect returns.
- `edit.ts:694` — shadowed `current`; rename the inner binding.
- `test_UAT_FC_REQ-135_text_properties.test.ts:390` — the describe title reports the
  block as skipped-for-missing-webui even when it runs.
- Project infrastructure, outside this ticket: no eslint config despite
  `.xgd/quality.yaml` declaring it, and the `-k` filter deselecting all 1527 tests so the
  quality gate proves nothing. Both warrant their own tickets.
