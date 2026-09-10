---
uid: report-fa69c065
id: REPORT-3772
type: report
title: 'Fix Structured Copy Editing: One Validated, Atomic Write Path (ac) — attempt
  6'
created_by: xgd
created_at: '2026-09-10T18:01:58.671209+00:00'
updated_at: '2026-09-10T18:01:58.671209+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-f753cecd
  level: ac
  fixes_applied: 3
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Structured Copy Editing: One Validated, Atomic Write Path (ac)

**Attempt**: 6
**Fixes applied this call**: 3
**Violations remaining**: 0
**Needs more work**: false

All three of REPORT-44b681c1's findings (1 violation, 2 warnings) are closed by
three `ac-edit` mutations. No AC was added or deprecated, no UAT was touched, no
production code was changed — consistent with the assessor's categorisation of
all three as statement defects inside an AC.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1130 (`acceptance_criterion-0e2f38fa`) | **Violation 1 closed.** Title, criterion and verification rewritten to carry the unit distinction REQ-136 makes. Opening is now "bounded **whole-number** controls — brightness / contrast / saturation / black-and-white in **percent**, hue shift in **degrees**, blur in **pixels**". The projection sentence is scoped to "the four **scaling** adjustments", with an explicit second clause: "The hue shift and the blur **are** the axis — same name, same number, nothing converted — because a control is a projection only where it is one." Verification changed from "each adjustment … converted from the percentages that were submitted" to "each **scaling** adjustment … converted from the percentage that was submitted", plus a new sentence asserting hue and blur are held under the control's own name with no conversion. |
| 2 | ac-edit | AC-1026 (`acceptance_criterion-d4bc1184`) | **Warning 1 closed.** Criterion now opens "Submitting a new choice of image for a region **from the command line** updates the draft definition and re-renders the page…", matching AC-982's repaired wording exactly. One clause; the one-diff claim, the no-change claim and the verification are unchanged verbatim. |
| 3 | ac-edit | AC-1275 (`acceptance_criterion-073d2b90`) | **Warning 2 closed.** "A **region** is marked unavailable on the test…" → "A **field** is marked unavailable on the test…". One word; nothing else in the AC moved. |

### Notes on the AC-1130 edit

Three constraints from the assessor's notes were honoured deliberately:

- **The identity/removal half, the one-change half and the rendered-page
  assertion did not move.** They were correct and are preserved verbatim.
- **The carried-forward whole-number re-save caveat was NOT absorbed.** The notes
  warned that finding 1 is adjacent to the still-info caveat about an AI-set
  fractional framing value being reported at the nearer whole number. The edit
  says nothing about re-save behaviour; it states units only.
- **The italic precedent is stated without a cross-reference.** The assessor's
  suggested edit cited "the same rule AC-1117 states for `italic` over
  `fontStyle`". The repair states the rule inline ("the rule already at work
  where italic projects onto the parameter beneath it") rather than naming
  another AC, keeping the criterion self-contained. This is the same precedent
  the module itself records in the `FILTER_CONTROLS` docblock ("REQ-135 set the
  precedent with `italic` over `fontStyle`", `packages/site-schema/src/l1/edit.ts:778-783`).

The verification's hue/blur clause was deliberately written as a **name-and-no-conversion**
assertion rather than the assessor's literal "stored unconverted". The shipped
UAT offers hue and blur and never submits them (`tests/reconciliation-copy-edit-image-framing.test.ts:378-381`,
asserting the stored filter has no `hueRotateDeg`/`blurPx` property — note it
checks those axis names, which are identical to the control names). A
verification demanding a *stored* unconverted value would require submitting
them, which the shipped test does not do, and would have manufactured a fresh
uat-level gap next cycle. The wording as written is satisfied by the shipped test.

## Successor-Rule Sweeps Run This Call

The assessor asked for the successor rule to be widened in two directions. Both
widened sweeps were run over all 43 of STORY-100's ACs (file set derived from
`fields.story_uid=story-37a3921b`, not from a repo-wide grep, which would have
pulled in other capabilities' ACs).

- **"Grep the unqualified claim, not the qualifier."** Swept
  `on disk|was written|were written|is written` across the 43. Eight ACs match;
  seven are "nothing is written" / "written into" claims (AC-985, AC-1027,
  AC-1048, AC-1122 and neighbours) that assert no artifact and name no path. The
  only two ACs asserting an on-disk artifact with a reported path are AC-982 and
  AC-1026, and **both now carry the producer clause.** The assessor's conclusion
  holds under the wider grep.
- **"Check a control-enumerating AC against the intent's enumeration."** Swept
  `percentage|percent|px|pixels|degrees|deg|hue|blur` across the 43. Four ACs
  make unit claims. AC-1130 is repaired. **AC-1024 needs no edit and is now the
  corroborating sibling** — it already enumerates the same six adjustments and
  calls them "either a **bounded whole number**, carrying the bounds with it, or
  a **closed pick**", i.e. it was unit-neutral and correct all along; AC-1130's
  new opening was phrased to agree with it. AC-1129's "typed percentage pair" is
  correct (`objectPosition: { xPct, yPct }`, `edit.ts:806`). AC-1117's "a whole
  number of pixels" for size is correct.
- **Third sweep, opportunistic:** `region is marked unavailable|region unavailable`
  across the 43 — no hits beyond AC-1275, so finding 3's wrong noun had not been
  copied forward anywhere.

No new findings surfaced from any of the three sweeps.

## Code Edits (if any)

None this call. Facts were read from `packages/site-schema/src/l1/edit.ts:794-801`
(`FILTER_CONTROLS`: `hueRotateDeg` and `blurPx` carry `scale: 1` and an `axis`
string identical to their `name`, against `scale: 100` on the four `*Pct`
controls) to confirm the AC prose — not the implementation — was the wrong layer.

## Verification

`npm test -- tests/reconciliation-copy-edit-image-framing.test.ts` — **1 file
passed, 6 tests passed** (1.18s), including
`test_UAT_AC1130_colour_is_adjusted_in_percentages_over_the_fractions_the_definition_holds`.
The run emits a wrangler `EPERM` log-write error; that is this sandbox refusing
`~/Library/Preferences/.wrangler/logs`, not a test failure. No test file and no
production file was modified this call, so no regression surface was created.

## needs_review Items Forwarded

None — no finding was categorised `needs_review`.

## Deferred to level=uat (carried forward, plus one new)

| Element | Item | Why not fixed here |
|---|---|---|
| `test_UAT_AC991_...four_closed_shapes...` (`tests/reconciliation-copy-edit-typography.test.ts:757`) | Test *name* and opening comment carry the pre-colour count while assertions test all five | Carried forward from attempt 5; uat-level, and renaming a test is not an `ac-edit` |
| AC-981 | Two UATs (`...image-selection.test.ts:370`, `...write-path.test.ts:253`) overlap substantially in shape | Carried forward; both valid, worth a uat-level exclusivity look |
| `test_UAT_AC1130_...` (`tests/reconciliation-copy-edit-image-framing.test.ts:350`) | **New this call.** Its comment reads "Every colour control is a BOUNDED PERCENTAGE" above a loop over only the four `*Pct` controls, and its test name says "in percentages". Its *assertions* are already correct and already scoped to the four — this is the same unit lag as finding 1, one layer down, in test prose only | Level is `ac`; the AC layer is now correct and the assertions never were wrong. Flagging so the uat pass closes the comment/name, not the logic |
