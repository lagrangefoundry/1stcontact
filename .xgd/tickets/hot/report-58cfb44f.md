---
uid: report-58cfb44f
id: REPORT-3768
type: report
title: 'Fix Structured Copy Editing: One Validated, Atomic Write Path (ac) — attempt
  4 (warnings cleared)'
created_by: xgd
created_at: '2026-09-10T17:35:56.962727+00:00'
updated_at: '2026-09-10T17:35:56.962727+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-f753cecd
  level: ac
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Structured Copy Editing: One Validated, Atomic Write Path (ac)

**Attempt**: 4 (second invocation)
**Fixes applied this call**: 6 (4 AC bodies + 1 story body + 1 UAT extension)
**Violations remaining**: 0
**Needs more work**: false

Every finding in REPORT-A0142017 that carried a resolution category is now
applied. The three violations were repaired in the previous invocation
(REPORT-3767); this call clears the remaining seven warnings — including the
three that were on their fourth unrepaired cycle.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-990 (`acceptance_criterion-f984033f`) | **Warning 6.** Reduced to the full-fidelity readback it uniquely covers: the multi-line-control request is struck from both criterion and verification, leaving AC-980 — which owns the descriptor shape — sole owner of that rule. Added the *why* in its place (overflow is a fact about the box, not about what the region holds; an editor handed a shortened value would save the shortening back) so the AC did not shrink to a bare assertion. |
| 2 | ac-edit | AC-1122 (`acceptance_criterion-66f57a24`) | **Warning 7.** Added the negative half the story body gained in today's attempt-4 repair: absent-is-the-default now reads "for every parameter that *has* a value at which it says nothing", followed by one paragraph stating that a size, a weight and a colour have no such setting, so those controls change a parameter and never clear one. Verification scoped accordingly — the removal case is now asserted on italic/capitalisation, with a new step asserting size and weight write and clear nothing. |
| 3 | ac-edit | AC-1045 (`acceptance_criterion-8a3c8c3e`) | **Warning 9.** Reduced to the read shape it uniquely covers: which fields come back for a panel, that the image field appears only when a background is carried, and that no other paint parameter is offered. The every-painted-panel paragraph and the rounded-corner worked example are gone — AC-1270's title *is* that claim, and it keeps the write rule, the palette-reference shape, the painted-only-by-a-reference case and which regions are offered a fill at all. AC-1045 keeps the current-value/no-value read behaviour and the palette-rides-the-read-call half. |
| 4 | ac-edit | AC-1273 (`acceptance_criterion-95697465`) | **Warning 4, the judgement call.** Kept the cross-reader claim but rephrased it as the report advised — the pairing is a property of the derivation, received by *whatever* reads the answer — rather than a second origin-parity assertion. "Assert the same answer through the command line and through the builder origin" is replaced by asserting the reason travels on the field itself, so no reader has to ask separately for it. Warning 4 is now clear across all six ACs. |
| 5 | story-body-edit | STORY-100 (`story-37a3921b`) | **Warning 10**, on its fourth cycle. AC-980 and AC-990 now have a parent bullet: the "Asking what a region exposes" bullet gained, after the colour sentences and before the image-region half, that the words come back whole — overflowing copy is accepted and reopening returns the entire string, never truncated, elided or clipped — and that a long or multi-line value therefore asks for a control able to display it in full while a short single-line one does not. Placed where the copy-region content lives, not appended; nothing else in the body was touched (52,815 → 53,352 chars, the addition alone). |
| 6 | uat-edit | `test_UAT_AC1122_a_typography_edit_writes_into_the_runs_parameters_and_a_no_op_produces_no_diff` | Warning 7 widened AC-1122, so its UAT was extended in the same call rather than left as a fresh coverage gap: it now sets size and weight to new values, asserts both are written and present, then returns each to the value the run started at and asserts the axis is still declared — proving no value on either control clears the parameter. Passes. |

## Verification

| Command | Result |
|---|---|
| `npm test -- tests/reconciliation-copy-edit-typography.test.ts -t AC1122` | **1 passed** (the extended UAT) |
| `npm test -- ` the seven affected suites (typography, write-path, image-selection, background-selection, colour-row, colour-and-availability, image-framing) | 7 files, **55 passed** |

Evidence the new AC-1122 prose matches the shipped surface:
`writeTypography` writes-or-no-ops for `fontSizePx`
(`packages/site-schema/src/l1/edit.ts:1289-1301`) and `fontWeight` (`:1302-1320`)
and never deletes either, while `italic` (`:1328`) and `textTransform` (`:1335`)
delete on their undeclared default; `writeColor` always assigns into the axes
bag. The extended UAT exercises exactly that asymmetry against the real `1c copy
set` entry point.

## Code Edits

None this call, and none in the previous one. The only non-ticket mutation is the
AC-1122 UAT extension (row 6), which asserts behaviour the write path already
ships.

## Findings Status — all 13

| # | Severity | Status |
|---|---|---|
| 1 | violation | Fixed (AC-1117, previous invocation) |
| 2 | violation | Fixed (AC-992, previous invocation) |
| 3 | violation | Fixed (AC-1026, previous invocation) |
| 4 | warning | Fixed — origin clause dropped from AC-1024, AC-1026, AC-1045, AC-1048, AC-1111; AC-1273 rephrased per the report's own recommendation |
| 5 | warning | Fixed (AC-1026's second paragraph reduced; AC-983 sole owner of one-diff) |
| 6 | warning | Fixed this call (AC-990 reduced) |
| 7 | warning | Fixed this call (AC-1122 negative half + UAT) |
| 8 | warning | Fixed (AC-982 now owns the command line's both-channels claim, with its UAT extended) |
| 9 | warning | Fixed this call (AC-1045 reduced; AC-1270 sole owner) |
| 10 | warning | Fixed this call (STORY-100 body) |
| 11, 12, 13 | info | No action required by the report |

## Notes for the Assessor

- **One deliberate non-edit.** AC-990's UAT still asserts the `textarea` widget
  alongside the full readback, and AC-1045's still seeds a rounded-corner-only
  panel. Both now assert slightly more than their reduced ACs require. That is
  over-coverage in a test, not drift in the tree: the widget rule is
  independently proven under AC-980's own UAT
  (`tests/reconciliation-copy-edit-write-path.test.ts:239-247`), and the
  every-painted-panel rule under AC-1270's. Left alone rather than trimmed,
  since removing passing assertions buys nothing.
- **The pattern the report flagged for future cycles** — pre-colour ACs read
  against the post-colour body — was the source of findings 1 and 7. Both are
  now repaired, but the remaining ~25 ACs untouched since 2026-08-16 were not
  re-swept this call; that comparison is the report's own recommendation for the
  next cycle, not an open finding from this one.

## needs_review Items Forwarded

None.
