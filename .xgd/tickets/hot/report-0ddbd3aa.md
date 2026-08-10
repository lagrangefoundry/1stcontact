---
uid: report-0ddbd3aa
id: REPORT-1812
type: report
title: 'Code Review: bug-ede1fb8c'
created_by: xgd
created_at: '2026-08-10T11:35:16.796305+00:00'
updated_at: '2026-08-10T11:35:16.796305+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: code_review
  subject_uid: bug-ede1fb8c
  anchor_uid: bug-ede1fb8c
---

# Code Review

**Result**: PASS

## Summary

BUG-33's free-coded change is test-side only, and that claim holds under
inspection: `git diff main..HEAD -- apps/ packages/ src/` is empty. The four
originally-red assertions and the five `-gesture-modal` ones are green, verified
by running them here rather than trusting the report. One thing worth recording
that the ticket does not say: relative to `main` the cherry-picked commit is
functionally a no-op — `main` already carries the fixed locator/re-lookup code,
so the surviving delta is the version bump, three comment rewrites, and one
variable rename. The reconcile bundle's substance is the new UAT file the
reconciliation cycle generated.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Lint | success (0 errors, 0 warnings) | `report-3e9b75d2`, `report-90aab2ee` |
| Build | success | independently re-run: `pnpm -r build` → 8 projects, `tsc --noEmit` clean in `apps/control-app` + `apps/public-site`, exit 0 |
| Tests | pass | independently re-run (see below) |
| Coverage | threshold 25% (`quality.min_coverage_percent`); no coverage regression possible — no product code changed | `git diff main..HEAD -- apps/ packages/ src/` empty |

Independent test runs on this worktree:

- `req115-builder-composition`, `reconciliation-copy-edit-gesture-modal`,
  `reconciliation-copy-edit-gesture`, `req117-edit-loop-browser`,
  `reconciliation-builder-toolbar-lifetime` → **5 files, 30 passed, 0 failed**
- Surrounding builder area (`req117-copy-editing`,
  `reconciliation-copy-edit-write-path`, `reconciliation-copy-edit-image-selection`,
  `reconciliation-builder-workspace-chrome`, `reconciliation-builder-workspace-mounted`,
  `req115-builder-shell`, `reconciliation-copy-edit-form-presentation`)
  → **7 files, 62 passed, 0 failed**. `req115-builder-shell` did not flake in
  this run.

**Evidence validity — the browser suites are not vacuously green.** These files
early-`return` when Playwright cannot launch, so a fast green would be
meaningless. A `--reporter=verbose` run confirms real browser execution: each of
`AC997` (1529ms), `AC998` (1604ms), `AC999` (2010ms),
`REQ-117_clicking_a_segment_opens_a_modal_over_its_fields` (1275ms) and
`REQ-117_save_writes_the_edit_and_the_page_shows_it` (1146ms) ran against a real
page. These are precisely the assertions BUG-33 claims to have fixed.

## External Interface Accessibility

N/A — no new or modified entry point. The change set is three test files, one
new test file, and a version bump. No exports, routes, CLI subcommands, or
workflow registrations are involved.

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `tests/req115-builder-composition.test.ts:192` | Comment rewrite only; the `const link = () => app.toolbar.get(...)` re-lookup thunk is already on `main`. Reads clearly and states *why* re-reading is required. | None |
| `tests/reconciliation-copy-edit-gesture.test.ts:495` | Comment rewrite only. Now names the responsible symbol (`openLoneControl` in `editor.js`) instead of only the REQ number — better for the next reader. | None |
| `tests/req117-edit-loop-browser.test.ts:141` | `control` → `input` rename plus one-line locator. This makes the block **consistent** with the identical locator at line 161 in the same file, which was already one-line. Not a nit against it. | None |
| `tests/req117-edit-loop-browser.test.ts:137-140` | Comment still says "read off the CONTROL" after the variable was renamed to `input`. Cosmetic only; the sentence remains accurate as prose. | Nit (not actioned) |
| `tests/reconciliation-builder-toolbar-lifetime.test.ts` (new, 257 lines) | Well-built. Both assertions carry explicit non-vacuity guards (`expect(afterOne).toBeGreaterThan(0)`, `expect(app.panel.getSrc()).not.toBe(frozen)`), compare by element identity rather than appearance, and instrument the **real** panel in place rather than substituting a stand-in — correct under the thin-mock rule. | None |
| `tests/reconciliation-builder-toolbar-lifetime.test.ts:39` | `mountBuilder: (…) => never` typing and the dynamic `app.js` import match the established convention in 7 sibling suites (`req115-builder-composition`, `reconciliation-builder-workspace-chrome`, `…-mounted`, `REQ-122`, `REQ-127`, …). Consistent, not invented. | None |
| `tests/reconciliation-builder-toolbar-lifetime.test.ts:44` | `memoryStorage()` is now hand-rolled in **7** test files. Pre-existing duplication that this file follows rather than introduces; a `tests/support/` helper is the obvious consolidation. | Warning |

No debug code, no commented-out blocks, no TODO stubs, no magic values belonging
in config. Naming follows `test_UAT_AC{n}_…` / `test_UAT_FC_{REQ}_…`.

## Checklist Compliance

No architecture, security, or design checklist reports exist in the ticket store
(`fields.report_kind=architecture_checklist|security_checklist|design_checklist`
each return `items: []`). Sections omitted per the review contract.

Noted separately: the standing security invariant (DOC-2, structured-only site
definitions) is untouched — no renderer, schema, or validator file is in the
diff.

## Smoke Test

N/A — no user-facing entry point added or modified. The equivalent check for a
test-only change is that the tests actually execute rather than skip, which is
verified above.

## Issues Found

**Critical (must fix)**: none.

**Warnings (should fix)**:

- `memoryStorage()` is duplicated across 7 builder test files. Not introduced by
  this change and not blocking; worth a follow-up move into `tests/support/`.

**Informational (no action required in this review)**:

- The cherry-picked commit `153a0fd17` is functionally already on `main`. Its
  net delta here is the `0.1.34 → 0.1.35` bump, three comment rewrites, and one
  rename. The end state is correct and nothing is reverted — the branch's
  comments are equal or better than `main`'s — but the reconcile bundle's real
  content is the reconciliation-generated `reconciliation-builder-toolbar-lifetime.test.ts`
  and the widened AC-970 / new AC-1110, not the commit itself.
- The two most recent scoped quality reports (`report-3e9b75d2`,
  `report-c84a7746`) record `pass (0 tests, 0 failed)` with an empty `suites`
  object — the gate passed without executing anything. `report-90aab2ee`
  (121 tests, 0 failed) is the last report with real test execution. This is why
  the runs above were performed directly rather than read off the report.
- `lint` and `build` phases in the quality reports show ~0.0001s and 0.0s
  durations, i.e. no lint tool is configured for this project and the lint gate
  is currently vacuous. Pre-existing and out of scope for BUG-33, but it means
  "0 errors, 0 warnings" carries no signal here. The `pnpm -r build` run above
  was done to get real build evidence.
