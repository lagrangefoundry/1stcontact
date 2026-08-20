---
uid: report-ba8a5db7
id: REPORT-2428
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 11'
created_by: xgd
created_at: '2026-08-20T12:11:24.126300+00:00'
updated_at: '2026-08-20T12:11:24.126300+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 11
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

All three findings of `report-c2092e9d` (2 violations + 1 warning) are addressed.
Per the report's "Notes for the Editor", findings 1 and 3 were applied as a single
edit to STORY-84's derived-config paragraph plus its matching In-scope clause and a
new Technical Context bullet; finding 2 was applied to the capability body itself
(`capability-2049c9ec`), which is the element the finding names even though the
resolution vocabulary carries no `capability-body-edit` category.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-84 (`story-8acc338d`) | Finding 1 + warning 3. Rewrote the derived-config paragraph so its enumeration is **explicitly complete** — field list, each field's label, each field's type, **where the reference renders that label**, the endpoint, and **the claimed submit button's own words** — closing with "Nothing else about a seam is derived." Added a following paragraph stating the derivation rule (a name sourced from the placeholder folds to placeholder labelling, anything else to a visible label above the box), why it is a fidelity fact and not a style choice (the a11y tree is its only witness; no painted axis can hold the difference), and its geometric cost (a label row the reference never had displaces every field below it, so the form drifts progressively). Framed the submit wording as behavioural copy that names the action, with the button's *look* already owned by its `control` leaf |
| 2 | story-body-edit | STORY-84 (`story-8acc338d`) | Finding 1 + warning 3, In-scope parallel edit. Widened "their capture-derived behavioural config" to enumerate the same six facts, so the scope clause and the body agree |
| 3 | story-body-edit | STORY-84 (`story-8acc338d`) | Finding 1 + warning 3, Technical Context parallel edit. New bullet after the "derived config is bounded by what a resting capture can see" bullet: label placement and submit wording are the two derived facts with **no painted witness**, both read off what the capture recorded *about* the controls rather than off pixels, and both cost geometry when wrong. Explicitly defers *where the parameter lives in the module's declared config, and why it is not an L1 axis* to the behavior-module contract, keeping STORY-82's ownership intact as the finding required |
| 4 | story-body-edit (element = capability) | CAP-71 (`capability-2049c9ec`) | Finding 2. Added a fourth Scope bullet — **the cross-gate acceptance verdict**: the two browser-free signals (geometry gate + reference coverage) first so a stale or half-captured bundle fails before a headless browser starts; the perceptual and value eyes through the same offline seams their own verbs expose; the perceptual floor that fails a run regardless of the value gates; named cause + one next step instead of bare pass/fail; value deltas as evidence not exit code; hard refusal of a bundle with no retained reference manifest. Adjusted the opening line so "the acceptance boundary" is no longer read as the three probes alone. Added to Out of scope: the perceptual and value eyes' own measurement contracts are reconciled here, not defined here — mirroring STORY-86's existing clause. Pure summarization of STORY-86's "The boundary is wider than geometry" section and its In-scope clause; no claim introduced that STORY-86 does not already make |
| 5 | story-body-edit (title) | STORY-86 (`story-24098299`) | Title drift flagged in the editor notes alongside finding 2 (same drift, same pass). `End-to-end 3-probe reproduction acceptance gate` → `End-to-end reproduction acceptance gate: 3 probes, structure recovery, and the cross-gate verdict`. Body untouched — STORY-86 drew no finding this cycle |

## Code Edits (if any)

None this call. All five mutations are ticket-body/title edits through
`xgd ticket update`.

## Verification

Ran the evidence file the report names for both STORY-84 findings,
`tests/req88-form-labelling-and-submit.test.ts` (`npm test --`, 8 tests):

- **6 passed**, including both tests cited as evidence —
  `test_UAT_FC_REQ-88_a_placeholder_named_control_folds_to_placeholder_labelling`
  (finding 1) and
  `test_UAT_FC_REQ-88_the_real_capture_derives_placeholder_labels_and_both_submit_buttons`
  (findings 1 and 3) — plus
  `test_UAT_FC_REQ-88_a_button_beside_a_form_becomes_that_forms_submit_control`,
  `..._a_claimed_submit_leaves_the_page_body_exactly_once`,
  `..._an_unrelated_page_button_is_never_claimed_by_a_form`,
  `..._the_form_seam_grows_to_hold_its_claimed_button`.
- **2 failed** —
  `test_UAT_FC_REQ-88_placeholder_labelling_renders_inside_the_box_and_stays_accessible`
  and `test_UAT_FC_REQ-96_a_bound_submit_control_is_the_only_button`. Both fail at
  `startServe` (`tools/generate/src/cli/serve.ts:53`) with
  `{ code: 'EPERM', errno: -1, syscall: 'listen', address: '0.0.0.0' }`, then time
  out at 60s. **Environment, not regression**: this session's sandbox denies socket
  binding, and both failures are the browser/server-backed tests in the file. This
  call changed no code, so nothing in the run is attributable to it.

Source claims encoded in the story body were checked against the files as bytes
(NUL-byte caveat from the report's notes): `l1/forms.ts:242` for the `nameSource`
→ labelling derivation, `forms.ts:53-62` and `:92-96` for the two doc comments,
`forms.ts:238` for the 1.5× textarea rule the enumeration restates.

## needs_review Items Forwarded

None. No finding this cycle was categorized `needs_review`.

## Not Actioned (by instruction)

- The two `ac-add` items in the report's "Downstream work implied" table
  (`labelMode` derivation; captured submit wording) — explicitly marked *do NOT
  action at this level*. Both now have story-body backing, so the AC level can
  attribute the existing passing `FC`-named evidence rather than author new tests.
- The matrix-hygiene item (per-AC `intent_uid` backfill, `updated_by` as a list) —
  seventh cycle unaddressable at `level=story`; needs a field-level fix.

## Notes for the Assessor

- The report's return-field sweep is now spent and its two flagged fields
  (`FoldedFormField.labelMode`, `FoldedForm.submitLabel`) are both expressed. Of
  the two never-run angles the notes suggest, **(b) the archived CAP-73 body** is
  the more promising after this call: finding 2 is direct evidence that the
  2026-08-05 consolidation moved scope statements into CAP-71's story tree without
  merging them into CAP-71's Scope list, and the fourth bullet added here was
  reconstructed from STORY-86 rather than from CAP-73's original text — so a
  further unmerged boundary, if one exists, would still be invisible.
