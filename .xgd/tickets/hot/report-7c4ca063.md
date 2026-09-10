---
uid: report-7c4ca063
id: REPORT-3776
type: report
title: 'Fix Structured Copy Editing: One Validated, Atomic Write Path (ac) — attempt
  8'
created_by: xgd
created_at: '2026-09-10T18:31:44.226728+00:00'
updated_at: '2026-09-10T18:31:44.226728+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-f753cecd
  level: ac
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — Structured Copy Editing: One Validated, Atomic Write Path (ac)

**Attempt**: 8
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

Both of REPORT-DF2EF2A7's findings were Verification-section defects in ACs that
attempt 7 repaired at the Criterion level. Both are now closed with the exact
edit the assessor's *Suggested edit* column named — one clause each, nothing else
in either AC moved. No criterion body, no UAT and no production code was touched.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1130 (`acceptance_criterion-0e2f38fa`) | Extended the Verification's identity enumeration from four controls to all six: "— a hundred for brightness, contrast and saturation, zero for black-and-white, **the hue shift and the blur** —". The sentence now clears every control it earlier required to be submitted and stored, so its own final assertion ("no colour adjustment at all and no empty group in its place") is reachable. |
| 2 | ac-edit | AC-1117 (`acceptance_criterion-0c85504b`) | Added one sentence to the Verification exercising the absent-weight seed the Criterion gained at 18:14:12: address a run declaring no weight of its own on the same multi-face page, assert the reported weight is the lowest declared face, then re-post that value alongside new words and assert the save succeeds reporting the words alone as changed. |

### Why finding 1's enumeration fix, not the read-only alternative

The assessor offered two routes and preferred the enumeration. Confirmed against
`FILTER_CONTROLS` (`packages/site-schema/src/l1/edit.ts:794-800`): `brightnessPct`,
`contrastPct`, `saturatePct` are `identity: 100`; `grayscalePct`, `hueRotateDeg`
and `blurPx` are all `identity: 0`. The extended enumeration therefore now says
exactly what the criterion's own identity paragraph says ("unchanged (100%) for
brightness, contrast and saturation, none-at-all (0) for black-and-white, the hue
shift and the blur") and what REQ-136 line 107 says ("1 the identity of every
scaling filter, 0 of the rest"). The pre-attempt-7 bare "its own identity" was
**not** restored — naming the numbers is what closed REPORT-BF5F3E68's violation.

### Verifying finding 2's added clause is observable, not aspirational

The new clause asserts on the save's changed-field report. That is a real
observable: `applyCopyEdit` returns `{ ok: true; changed: string[] }`
(`edit.ts:1051-1053`, pushed at `:1576-1608`), and the write path returns `false`
— so the name never enters `changed` — when the axis is absent and the echoed
value equals the seed (`edit.ts:1310`: `if (axes.fontWeight === undefined &&
String(next) === String(current)) return false`). The seed itself is
`values.fontWeight = String(axes.fontWeight ?? weights[0])` (`:564`) with
`weightChoices` sorting ascending (`:498-503`), so "the lowest face the document
declares" is exact. A save that only rewrites the words reports `['text']`.

## Successor rule applied to my own edits

REPORT-DF2EF2A7 asked for a standing rule: *when a repair replaces a general
phrase with an enumeration, check the enumeration against every member the
general phrase covered — in this AC, in the criterion's own body, and in the
intent.* Applied to both edits above (AC-1130's enumeration now matches all six
members in all three places), and then swept outward across all 43 ACs: every
Verification section was scanned for a count word or a control-name list and the
five that carry one were read in full — AC-991 ("all five shapes" / "one of the
five shapes above"), AC-1024 ("the first two", bounded-or-closed sweep over the
remainder), AC-1118 ("three widths"), AC-1270 ("the first three" of six seeded
regions), AC-1274 ("two runs"). None narrows a general claim it elsewhere makes;
no further enumeration defect of this shape exists in the tree.

Also applied the report's second proposed rule — *a criterion edit that adds,
narrows or enumerates a behavioural claim should be followed by re-reading that
AC's Verification in full and asking whether it still reaches its own last
assertion* — to both ACs after editing. AC-1130's closing sentence ("a control
left at its identity throughout is never written") still has a witness: the
Verification's opening "several colour adjustments" does not require all six to
be submitted, so a control never submitted remains available to satisfy it, and
submitting identity for an untouched control is the same no-op the sentence
describes. AC-1117's Verification reaches all of its own assertions.

## Code Edits

None this call. `packages/site-schema/src/l1/edit.ts` was read only, to confirm
the two identity partitions and the changed-field observable quoted above.

## Tests

None run — no test file and no production file was modified this call. Both
mutations are ticket prose. The shipped UATs are untouched and, per the anchor
report, neither finding was ever visible from the test side:
`tests/reconciliation-copy-edit-image-framing.test.ts:379-398` never submits the
hue shift or the blur, and no test in
`tests/reconciliation-copy-edit-typography.test.ts` seeds a run without a
`fontWeight`.

## needs_review Items Forwarded

None. Both findings were categorized `ac-edit` and both were actionable as
specified.

## Carried forward for the next level, not actioned here

Unchanged from the anchor report, and deliberately left alone at `ac` level:

1. AC-1117's new Verification clause **hands the `uat` pass a concrete test to
   add** — no existing test seeds a weight-less run. `uat_coverage` was not
   touched on either AC; that field belongs to `check`/`fix_uat_coverage`.
2. AC-1130's Verification sentence 2 (hue shift and blur stored unconverted,
   pre-existing text) is likewise not exercised by the shipped UAT, which names
   `hueRotateDeg` and `blurPx` as controls "offered and never submitted". A `uat`
   pass extending that test would close both this and item 3 below in one edit.
3. The three stale-prose UAT items and the ten colour ACs carrying no
   `uat_coverage` field, against a capability aggregate reading `fail`.
4. STORY-100's "Asking what a region exposes" bullet still justifies withholding
   the size control on a no-fabricated-numbers ground while the weight control
   does show a fabricated seed. AC-1117 now states that seed openly, so the AC
   level is sound; the omission is the story body's and belongs to a story-level
   pass.
