---
uid: report-847c35d9
id: REPORT-2455
type: report
title: 'Fix UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate — attempt
  7'
created_by: xgd
created_at: '2026-08-20T14:52:48.793993+00:00'
updated_at: '2026-08-20T14:52:48.793993+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_uat_coverage
  subject_uid: capability-2049c9ec
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix UAT Coverage: L1 Reproduction Pipeline: Fold & Acceptance Gate

**Attempt**: 7
**Fixes applied**: 3 (2 violations, 1 warning)
**Violations remaining**: 0
**Needs more work**: false

Both violations from REPORT-2606a5ba are closed, plus warning 3. Warning 4 is
left as-is on the assessor's own sanctioned option. No AC bodies changed — both
violations were `uat-edit`, and the AC text already specified the fixtures.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-edit | AC-705 | Added `test_UAT_AC705_slot_covered_oracle_text_is_diverted_to_the_mounted_channel` + a `mountedFormOracle()` fixture to `tests/reconciliation-3probe-gate.test.ts`. Drives `foldToL1` → `evaluateLayout` → `sampleFidelityProbe` and `oracleBoxes`. **Bite verified by counterfactual** (below). `uat_coverage: pass` |
| 2 | uat-edit | AC-694 | Split `tests/reconciliation-l1-fold.test.ts`'s single test in two: an offline half that proves the sidecar is written and round-trips losslessly, and `test_UAT_AC694_structural_hints_report_ancestry_layout_units_and_breakpoints` gated with `it.skipIf(!browserOk)` covering **all eight** Criterion dimensions against a real engine. `uat_coverage: pass` |
| 3 | uat-edit | AC-691 | Added an image leaf and a painted box leaf (distinct captured heights at each of the three widths) to the existing fixture, and asserted every keyframe pins x/y/width **and height** — the positive half its Verification named but its text-only fixture could not reach. `uat_coverage: pass` |
| 4 | — | STORY-84, STORY-86 | Both set `uat_coverage: pass`; each had exactly one remaining gap and it is closed |
| 5 | (declined) | AC-731 | Left as-is — the assessor's explicit alternative. Re-attribution would have meant duplicating the `bug19-*` / `bug20-*` / `bug21-*` fixtures, which the finding itself forbids under the one-authoritative-location rule. AC-731's evidence spans three files by design |

## Verification

All nine AC-named suites, run together:

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-l1-seam-config-and-repro.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
→ Test Files 9 passed (9) · Tests 43 passed | 1 skipped (44) · Duration 1.74s
```

Was 42 passed / 0 skipped. The +1 pass is AC-705's new mounted-channel UAT; the
+1 skip is AC-694's real-engine half, which previously read green from a silent
`return` and now declares itself.

## Finding 2 (AC-705, the priority) — bite proven, not asserted

The assessor's stated failure mode was that a regression deleting the diversion
would leave all 42 UATs green. That was reproduced and then closed:

1. With the new UAT in place, `tools/generate/src/l1/probes.ts:656` was
   temporarily neutered to `if (false && insideSlot(o.box)) …`.
2. The suite went **red on exactly one test** — the new one — at
   `expect(report.pass).toBe(true)`: a correct reproduction of a page with a
   mounted form started failing the gate, which is the precise asymmetry the AC
   describes (`mounted` can neither fail a run nor rescue one, so the regression
   is silent by construction).
3. `probes.ts` was reverted; `git diff` over it is empty. **No production code
   was modified in this call.**

What the UAT asserts, on the real entry points:

- **Setup as assertions** so the fixture cannot rot into a no-op: the fold emits
  exactly one `slot`, no reproduced *text* leaf carries the submit words (the
  fold claimed the button into the seam per REQ-93), `oracleBoxes` *does* carry
  those words as six `text` samples, and the sample's box centre lies inside the
  seam rect.
- **Positive**: `mounted` equals one entry per captured width with the run's
  text; `residuals`, `unmatched` empty; `pass === true`.
- **Negative (the discriminator)**: the same oracle words moved clear of every
  slot — the reproduced document untouched — move to `unmatched` with
  `pass === false` and `mounted` empty. The pair is what proves the diversion is
  keyed on the **slot rect**, not on the text.

## Finding 1 (AC-694) — scope fixed; skip is now declared

The bigger half was scope, and it is closed. The real-engine test now asserts
every dimension the Criterion names, each with a discriminator rather than a
presence check:

| Dimension | Assertion |
|---|---|
| ancestry | both columns' `parentId` → the `section` node; its `parentId` → `body`; `body.parentId === null` (chain terminates) |
| position mode | three modes on one page — row `relative`, its child `absolute`, columns `static` |
| sibling repetition | `repeatCount === 2` for the two same-signature columns, `1` for the differently-classed sibling beside them (a parent-child-count bug would say 3 for all three) |
| parent `flex-direction` | `'row'` on the flex parent, **`null`** on the grid parent |
| parent `gap` | `'40px'` — the value the `@media (min-width: 600px)` rule wins at the 1280 default viewport, so a reported gap proves the *computed* value, not the base `24px` rule |
| parent `grid-template-columns` | two resolved px tracks in the authored `1fr:2fr` ratio; **`null`** on the flex parent |
| authored sizing unit | `percent` survives on `width: 50%` (which the engine resolves to px), `px` on `width: 80px`, `null` width + `px` height on the unsized cells |
| `@media` breakpoints | contains 600 **and** 1200, ascending |

Plus: a node whose parent is neither flex nor grid reports `display: 'block'`
with every distribution axis `null` — so the axes are conditional on container
mode, not always-present.

The silent `if (!(await chromiumAvailable())) return` is gone. `browserOk` is
now probed once at module scope and the real-engine test is
`it.skipIf(!browserOk)`, the idiom `capture.test.ts` / `bug25-*` / `bug27-*`
already use. The offline half is a separate test and no longer claims to prove
the extractor: it asserts what a driver seam genuinely can — that
`cmdCapturePage` writes `hints.json`, that it round-trips losslessly, and that
the sidecar stays separate from `l1.json` (nothing merges it into the render
path). The previous assertions there (ascending breakpoints, a percent unit)
were dropped: as the assessor found, they read straight back out of
`CANNED_HINTS`.

## Operator item — Chromium cannot launch in this worktree

Measured directly this session, not inferred, and it confirms the assessor's
independent measurement:

```
browserType.launch: Executable doesn't exist at
  ~/Library/Caches/ms-playwright/chromium_headless_shell-1228/…/chrome-headless-shell
```

The cache holds `chromium_headless_shell-1234` / `chromium-1234`; the pinned
Playwright wants `-1228`. So it is a **version skew**, not a missing install —
`playwright install` would fix it, but it needs network egress, which this
sandbox denies (and `npx` is blocked).

Consequence for the next cycle: `test_UAT_AC694_structural_hints_report_…` will
report as **skipped**, by design — that is the honest signal the finding asked
for, replacing a green read. Its assertions could not be executed here, so
unlike AC-705 they are unverified-by-running. They are written against the
`HintNode` / `ParentLayout` contracts in
`tools/generate/src/cli/capture/hints.ts` and the 1280×800 default viewport in
`pipeline.ts:367`. **A runner with a matching Chromium should execute this file
once to confirm** — that is the one loose end in this call.

Note also that the repo has no root `tsconfig.json` and no typecheck script, so
Vitest transpiles tests without type-checking them; a browser-gated test's types
are therefore unchecked on a browserless runner. New helpers were written to
avoid conditional-type casts for that reason.

## Code Edits

None. `git status` after this call shows exactly two modified files, both tests:
`tests/reconciliation-3probe-gate.test.ts`, `tests/reconciliation-l1-fold.test.ts`.

## needs_review Items Forwarded

None — the report carried no `needs_review` findings (`needs_review_count: 0`).

## Notes for the next assessment cycle

- **`.xgd/uat_index.json` is still empty** (`{"acs": {}}`) in this worktree. The
  prescribed lookup returns `[]` for all 42 ACs. Rebuild by grepping `tests/`
  for `test_UAT_AC(\d+)_`, as REPORT-2606a5ba did.
- **AC-705 and AC-694 now each have two dedicated tests**, not one. A sweep that
  assumes one test per AC will under-count both.
- **AC-694's coverage is environment-split by design**: emission/persistence
  runs everywhere, the extractor's dimensions run only with Chromium. A skip
  there is the intended state on a browserless runner, not a new gap.
