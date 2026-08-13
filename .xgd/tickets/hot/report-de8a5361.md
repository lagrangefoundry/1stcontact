---
uid: report-de8a5361
id: REPORT-1966
type: report
title: 'Code Review: request-1ff09fab (REQ-138 — copy modal live preview)'
created_by: xgd
created_at: '2026-08-13T01:53:46.631814+00:00'
updated_at: '2026-08-13T01:53:46.631814+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: code_review
  subject_uid: request-1ff09fab
  anchor_uid: request-1ff09fab
---

# Code Review

**Result**: FAIL

## Summary

The implementation is well-structured, correctly integrated and does exactly what
its own commit message claims for three of the four parameters REQ-138 names. It
fails on the fourth: `textTransform` is registered in `PREVIEW_PARAMETERS` and
writes `--preview-text-transform` on the box, but that property has no route to
the words the operator is editing, so picking a capitalisation visibly does
nothing. The operator reported this on the anchor itself ("Capitalization is not
previewing", comment-a5255c4d, four times), and the project's own browser UAT now
measures and pins the inert behaviour. A parameter registered as previewable that
previews nothing is a feature branch reporting success while doing nothing — the
one thing this review exists to catch — so it fails here rather than landing on
main with a test asserting the defect is correct.

Everything else is clean: the design decisions (scale rather than re-clamp; write
only what changed) are correct and well defended, the regression scope is green,
and no checklist tickets exist to violate.

## Quality Gates

| Gate | Status | Evidence |
|------|--------|----------|
| Lint | success (0 errors, 0 warnings) | report-843ab059 |
| Build | success | report-843ab059 |
| Tests | **not exercised by the gate** | report-843ab059 `suites: {}` — zero suites executed |
| Coverage | n/a (no suites ran) | threshold 25.0 in `.xgd/config.yaml` |

The quality report proves less than it appears to. `.xgd/config.yaml` `quality:`
holds only `min_coverage_percent`, and the report records lint at 0.0001s and
build at 0.0s with `suites: {}` — no-ops. So I ran the tests directly rather than
accept the gate:

- `tests/test_UAT_FC_REQ-138_live_preview.test.ts` — 6/6 pass
- `tests/reconciliation-copy-edit-live-preview.test.ts` — 3/3 pass, and the
  guards are genuinely satisfied on this worktree: no `NOT VERIFIED` warning is
  emitted, so the Playwright halves really executed (AC-1138 1.79s, AC-1140 1.07s)
- Regression scope — `reconciliation-copy-edit-{form-presentation,parameter-sheet,typography,write-path}`,
  `req117-copy-editing`, `test_UAT_FC_REQ-135_text_properties`: 50/50 pass

Tests therefore pass. The gate itself is not the reason for this FAIL, but the
`suites: {}` report is flagged for the operator: a quality gate that runs zero
suites is not evidence.

## External Interface Accessibility

Wired in — with one exception that is the reason for the verdict.

| Symbol | Wiring | Evidence |
|--------|--------|----------|
| `previewScale` | exported, imported and called at modal open | `page-style.js:50`, `editor.js:4`, `editor.js:387` |
| `previewSizePx` | exported, called from the `fontSizePx` row | `page-style.js:76`, `page-style.js:96` |
| `previewVarFor` | exported, called on every `change` | `page-style.js:113`, `editor.js:389` |
| `properties.on('change')` | subscribed inside the sheet block, guarded on `box` | `editor.js:386-392` |
| `fontSizePx` / `fontWeight` / `italic` rows | reach the words | `builder.css:245,249,250` via `.fields-control { font: inherit }` |
| `textTransform` row | **inert** — writes a property nothing user-visible consumes | see below |

`--preview-text-transform` is consumed only by `builder.css:253` on
`.builder-modal__box`. That element draws no text of its own: its only text
descendant is the component's `.fields-control` (`<textarea>` / `<input>`), and
`fields.css`'s `font: inherit` carries family, size, weight and style but **not**
`text-transform`, which the UA stylesheet resets on form controls. The row is
therefore registered, called, and visibly does nothing.

This is not my inference — it is measured in a real browser by the change's own
evidence, and it passes:

`tests/reconciliation-copy-edit-live-preview.test.ts:508-513`
```
expect(onBox, 'the property IS written, on the box').toBe('uppercase')
expect((await shown()).transform, 'and does NOT reach the words').toBe('none')
```

## Code Quality

| File | Finding | Severity |
|------|---------|----------|
| `page-style.js:87-112` | `textTransform` row writes a property with no route to the copy; the feature it advertises does not exist for that parameter | **Critical** |
| `builder.css:253` | `text-transform` on `.builder-modal__box` has styled nothing since REQ-121; REQ-138 is what turned it into a user-facing claim | Critical (same defect) |
| `builder.css:252` | `letter-spacing` on the box is the identical UA-reset gap — REQ-135's box mis-mirrors a tracked headline. Pre-existing, not an editable parameter, outside REQ-138's declared scope | Warning |
| `page-style.js:35-112` | `previewScale` / `previewSizePx` / `PREVIEW_PARAMETERS` — correct, well-bounded, degrade to scale 1 on missing ends; the table-not-a-chain-of-ifs choice makes colour's absence legible rather than accidental | None (good) |
| `editor.js:240-244, 371-392` | `box` hoisted alongside `fields`/`properties` for the documented TDZ reason; `if (box)` is a real guard (a background picker has parameter fields and no box), not redundant; scale measured once at open, so the subscription is O(1) per change | None (good) |
| `editor.js:387` | `spec.values.fontSizePx` is the one field name hardcoded outside the mapping table — minor coupling, acceptable since scale is inherently size-specific | Nit |
| both files | no debug code, no commented-out blocks, no TODO stubs, no magic numbers (reuses `PREVIEW_MIN_PX`), buffered commit untouched, comment density matches the surrounding files | None |

Architecture: the change is control-app builder chrome only. It adds no raw-CSS
hole to the site-definition path, writes no instance data, and reaches no origin
— `PREVIEW_PARAMETERS` values are a closed table of typed scalars written as CSS
custom properties on a dialog element. Nothing here touches L1, the validator,
the renderer or the write path.

## Checklist Compliance

No `architecture_checklist`, `security_checklist` or `design_checklist` report
tickets exist (`xgd ticket list --type report --filter fields.report_kind=... ` →
0 for each). Sections omitted.

## Smoke Test

The user-facing entry point is the copy-edit modal, and it is exercised for real
rather than described: `reconciliation-copy-edit-live-preview.test.ts` drives the
real `defaultModal` over a real `1c render --edit` page in Chromium, through the
gestures a user makes. Measured on the words themselves:

- weight 700 → 400: the copy is drawn lighter ✓
- italic ticked / unticked: the copy is drawn italic, then upright ✓
- size 72 → 120: the copy is drawn bigger (53px, not the re-clamped 32px) ✓
- capitalisation → uppercase: **the copy does not change** ✗

No stack traces, no crashes. Three of four gestures do what the ticket says.

## Issues Found

**Critical (must fix)**:

- Capitalisation does not preview. `textTransform` is one of the four parameters
  REQ-138's own Design table and test plan name, the operator reported it as
  broken on the anchor (comment-a5255c4d), and the current state of the change is
  that the defect is *documented as intended behaviour* by a passing UAT
  (`reconciliation-copy-edit-live-preview.test.ts:512`) and by AC-1138's text.
  Landing this on main writes "capitalisation does not reach the words" into the
  capability matrix as truth, for a request that asked for the opposite. The root
  cause is a one-line CSS inheritance gap and the fix was already verified in a
  browser during the free-coding session; there is no reason to carry it forward.

**Warnings (should fix)**:

- `letter-spacing` on `.builder-modal__box` (builder.css:252) has never reached
  the words either — same UA reset, one line apart. It is not an editable
  parameter, so it shows as the box quietly mis-mirroring a tracked headline
  rather than as a dead control. Fixing capitalisation alone leaves a
  known-false claim in the same rule. Outside REQ-138's declared scope, so this
  is the operator's call rather than a condition of passing.
- `report-843ab059` records `suites: {}` — the quality gate executed zero test
  suites, and `.xgd/config.yaml` configures no lint or build command either. The
  gate is currently a no-op for this project. Not a REQ-138 finding; raised
  because every review downstream of it inherits the same blind spot.

## Fix-It Prompt

Make capitalisation reach the words, then re-point the evidence that currently
pins it as inert. Four edits, in this order.

**1. `apps/control-app/src/builder/builder.css`** — add a rule scoped to the
editing box, after the `.builder-modal__box` block:

```css
/*
 * THE CONTROL HAS TO BE TOLD. `fields.css` gives `.fields-control`
 * `font: inherit`, and that shorthand carries family, size, weight and style —
 * which is exactly the four axes that already arrive. It does not carry
 * `text-transform`, and the UA stylesheet resets that on form controls, so the
 * box's capitalisation stops at the wrapper and never reaches the words.
 */
.builder-modal__box .fields-control {
  text-transform: inherit;
}
```

Verified in Chromium during the free-coding session: with this rule both
`<input>` and `<textarea>` come back `uppercase`. Do NOT instead move the
declaration off the box — the box is what carries the mirrored dressing.

(Optional, same root cause, same rule: adding `letter-spacing: inherit` fixes the
sibling gap noted above. No test pins letter-spacing as not-arriving, so this is
safe but not required.)

**2. `tests/reconciliation-copy-edit-live-preview.test.ts`** — the browser half
of `test_UAT_AC1138_...` currently asserts the defect. Rewrite the block at
lines ~490-513:

- `expect((await shown()).transform, 'and does NOT reach the words').toBe('none')`
  becomes an assertion that the words ARE drawn `'uppercase'`; keep the
  `onBox` assertion.
- Extend the "off clears" path: after selecting `none`, the words must read
  `'none'` in the rendering, not only in the property — capitalisation now
  belongs in the same two-sided treatment italic already gets.
- Rewrite the "CAPITALISATION: THE DIVERGENCE" comment block and the file header
  (lines ~18-23) to state the behaviour rather than the gap, naming the UA reset
  as the reason the rule in step 1 has to exist.

**3. AC-1138 (`acceptance_criterion-2d587432`)** — the criterion claims three
parameters and records capitalisation as a divergence. Update it via
`xgd ticket update` to claim all four, and remove the divergence clause.

**4. `story-3bf94bd4`** — Technical Context lines ~119-122 and ~257-263 describe
the divergence and its mechanism. Rewrite to describe the fix: the mechanism
paragraph stays (it is why the rule exists), the "recorded as a divergence from
what this was asked to do" framing goes.

Then re-run, and expect all four green:
`npx vitest run tests/test_UAT_FC_REQ-138_live_preview.test.ts tests/reconciliation-copy-edit-live-preview.test.ts tests/reconciliation-copy-edit-form-presentation.test.ts tests/reconciliation-copy-edit-parameter-sheet.test.ts tests/reconciliation-copy-edit-typography.test.ts`

Do not change `page-style.js` or `editor.js`. The subscription, the table and the
scale-not-re-clamp decision are all correct — the `textTransform` row was writing
the right property to the right element the whole time; only the control's
inheritance was missing.
