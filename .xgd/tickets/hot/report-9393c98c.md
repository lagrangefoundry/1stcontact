---
uid: report-9393c98c
id: REPORT-3815
type: report
title: 'Fix In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture
  (ac) — attempt 5'
created_by: xgd
created_at: '2026-09-10T23:20:49.696450+00:00'
updated_at: '2026-09-10T23:20:49.696450+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-12fee326
  level: ac
  fixes_applied: 9
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — In-Page Copy Editing: The Editable Render & The Click-to-Edit Gesture (ac)

**Attempt**: 5
**Fixes applied this call**: 9
**Violations remaining**: 0
**Needs more work**: false

Both violations in report-657d1e9a were single-passage edits to one AC each, and
both are applied. Warning 3 (AC-1123's unexercised "never by the region's kind"
half) and warning 5 (the stale UAT name for AC-1138) are applied in the same
pass, as the report prescribed. Warning 4 is a `story-body-edit` that belongs to
the story level and is forwarded below rather than resolved here.

Every edit was made against the code the report cited, re-read in this branch:
`copyFieldsOf` (`packages/site-schema/src/l1/edit.ts:960-1005`), the image
branch's `...framing.fields`, and `imageFramingFields` (`:823-876`) with its
seven framing descriptors plus the six `FILTER_CONTROLS` colour adjustments.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1028 (`acceptance_criterion-26ffac6d`) | **V1 closed.** Replaced the closing exclusion. It no longer says framing, scale, rotation and position "are not offered" — the region now "leads with" the picker and its alt text (order stated as load-bearing) and then exposes "whatever else the write path offers on a picture, which today is …", routed to the parameter sheet by the descriptor's declared control per AC-1123. Exclusions restated as what is **unbuilt**, matching the story body's own four Phase-2 items: zoom and true source-rect crop, tint/scrim, framing of a painted surface's background image, drag-driven crop handles, plus upload and image processing. Picker paragraphs untouched, as instructed |
| 2 | ac-edit | AC-1140 (`acceptance_criterion-b04cbb23`) | **V2 closed.** Struck "including the run's colour and family, which the sheet has no control for at all". The Verification now names the witnesses that survive — **family** (no control at all) and **tracking** (opening dressing, not a control) — and adds the stronger claim REQ-140 makes available: the colour *does* have a row (AC-1279) and must still hold the render's value while untouched. Added the matching Criterion paragraph so the rule is explicitly not softened where a control exists |
| 3 | ac-edit | AC-1123 (`acceptance_criterion-35907074`) | **W1 closed.** Verification extended with an **image** region as the third witness — `src` (descriptor declares its options are images) drawn as the grid, `alt` in the box, framing/shape/rotation/scale/colour-adjustment in the sheet — partitioned from the descriptors the surface reports rather than a list of names. One region proving all three routes, which the two copy-and-panel witnesses could not |
| 4 | uat-edit | UAT for AC-1123 (`tests/reconciliation-copy-edit-parameter-sheet.test.ts`) | Added the image fixture (`AN_IMAGE = '0.2'`, a `kind: 'image'` node holding `/assets/hero.png` with alt text) and the assertion block for the three routes, so the criterion's kind-agnostic half is exercised rather than only asserted. Existing addresses `0.0`/`0.1` unchanged |
| 5 | uat-edit | UAT for AC-1123, same file | **Pre-existing failure repaired**: the parameter type set expected `{integer, enum, boolean}` and REQ-140 added `color`. The AC's own criterion enumerates "a bounded number, a choice from a list …, a yes/no, **a colour**", so the test was the stale side |
| 6 | uat-edit | UAT for AC-1123, same file | **Pre-existing failure repaired**: the painted panel was asserted to render *no* `.builder-modal__props`. REQ-140 gives that panel a colour, and the criterion says the sheet is drawn wherever there is anything to put in it. Now asserts no box **and** a sheet holding every non-grid field it exposes — which also covers the criterion's "a region exposing only a colour renders a sheet and no box" clause |
| 7 | uat-edit | UAT for AC-1140 (`tests/reconciliation-copy-edit-live-preview.test.ts:620-624`) | Fixed the mirroring comment that carried V2's stale claim verbatim ("The run's colour and its family … have no control in the sheet at all"), so the drift does not simply relocate to the test layer. The assertions were already correct — `--preview-color` is in the recorded dressing and is checked unchanged by the loop below it |
| 8 | uat-edit | UAT for AC-1138 (same file, `:377`) | **W3 closed.** Renamed `test_UAT_AC1138_size_weight_and_italic_restyle_the_words_…` → `test_UAT_AC1138_size_weight_italic_and_capitalisation_restyle_the_words_as_confirmed_and_write_nothing`. Body already asserted the fourth parameter on both the box and the words |
| 9 | uat-edit | UAT for AC-1028 (`tests/req118-image-selection.test.ts`) | Backed AC-1028's new Verification clause: asserts `src` and `alt` **lead** the field list, that the list does not stop there, and that every field past them is a closed control (bounded integer or the axis's own keyword list) — read from the response, not from a list written into the test, so a parameter the derivation grows lands without the test being told. Local `Field` interface extended with `min`/`max` |

## Verification

| Suite | Result |
|---|---|
| `tests/req118-image-selection.test.ts` | **11 passed** |
| `tests/reconciliation-copy-edit-parameter-sheet.test.ts` | **1 passed** (was failing before this call — see #5 and #6) |
| `tests/reconciliation-copy-edit-live-preview.test.ts` | **3 passed** |

The two repairs at #5 and #6 were failures already present on the branch: the
diff is purely additive at those lines and both expectations predate REQ-140.
They are named here rather than folded in silently, since they were failing
UATs for an AC this report ruled aligned.

## Code Edits (if any)

None this call. No production file was touched; `packages/site-schema/src/l1/edit.ts`
was read only, to re-verify the report's citations.

## needs_review Items Forwarded

None. One finding is deliberately **not** resolved at this level:

| Element | Finding | Why deferred |
|---|---|---|
| STORY-101 (`story-3bf94bd4`) body | report-657d1e9a finding 4 / report-1321eb22 finding 2 — AC-1037 and AC-1038 (the dialog's themed surface, palette and single app typeface, REQ-121 items 1, 2, 4) do not follow from the story body, which never mentions the dialog's own chrome | Category is `story-body-edit`, and the assessor states the **ACs are right and the body is thin**. It is an in-scope bullet for the story level, not an AC repair. Recorded so the next ac cycle does not re-derive it — and so nobody "resolves" it by deprecating two correct ACs |

Finding 7 (AC-1050 is more complete than its body) was likewise left alone: the
assessor's instruction is explicitly *do not narrow it to match the body*, and no
edit was made to it.
