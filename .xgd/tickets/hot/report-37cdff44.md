---
uid: report-37cdff44
id: REPORT-3774
type: report
title: 'Fix Structured Copy Editing: One Validated, Atomic Write Path (ac) — attempt
  7'
created_by: xgd
created_at: '2026-09-10T18:20:15.020895+00:00'
updated_at: '2026-09-10T18:20:15.020895+00:00'
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

**Attempt**: 7
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

Both of REPORT-BF5F3E68's findings were AC prose defects with no code or UAT
component, and both are closed. No new AC was needed and none was deprecated:
the finding set was two *statement* defects inside existing criteria, exactly as
the assessor graded them.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-1130 (`acceptance_criterion-0e2f38fa`) | Retired the word "scaling" from the AC; named the two partitions separately and stated that they deliberately do not coincide |
| 2 | ac-edit | AC-1117 (`acceptance_criterion-0c85504b`) | Qualified the reported-values sentence to cover the absent-weight seed |

### 1 — AC-1130 (violation, consistency)

The defect was intra-AC: attempt 6 pinned "the four **scaling** adjustments" to
the *percent-carrying* set (which includes black-and-white), while the untouched
identity paragraph used the same phrase for the *identity-100* set. Read together
the AC asserted black-and-white's identity is 100%. It is 0.

Applied the assessor's suggested edit in full:

- **Paragraph 2** — "That is true of the four **scaling** adjustments." →
  "That is true of the four **percentage** adjustments — brightness, contrast,
  saturation and black-and-white." The unit partition (4 vs 2), enumerated
  inline so the term is self-defining rather than leaning on a convention.
- **Paragraph 3** — "unchanged for the scaling adjustments, none-at-all for the
  rest" → "unchanged (100%) for brightness, contrast and saturation,
  none-at-all (0) for black-and-white, the hue shift and the blur". The identity
  partition (3 vs 3), named explicitly.
- **Added the recurrence guard the assessor asked for**: a sentence stating the
  two partitions are deliberately not the same one — "black-and-white is
  submitted as a percentage like the first three, but paints nothing at zero
  rather than at a hundred, so which unit a control carries says nothing about
  where its identity sits."

Two consequential departures from "the whole verification must not move", both
form-only, neither altering what is asserted:

- The verification also said "carries each **scaling** adjustment … converted
  from the percentage that was submitted" — the percent set, i.e. the same
  ambiguous use. Left as-is it would have re-seeded the exact defect two
  paragraphs after the fix. Changed to "each **percentage** adjustment".
- Appended "— a hundred for brightness, contrast and saturation, zero for
  black-and-white —" to the return-to-identity sentence, so the verification
  states the per-control identity it is asserting rather than deferring to a
  phrase. This is what the shipped UAT already does
  (`tests/reconciliation-copy-edit-image-framing.test.ts:386-394`).

The projection/italic clause, the units list in paragraph 1, the one-change
clause and every existing assertion are untouched.

**Evidence the corrected partition is the real one** (all re-read this cycle,
not taken from the report):

- `FILTER_CONTROLS`, `packages/site-schema/src/l1/edit.ts:794-800` —
  `grayscalePct { identity: 0, scale: 100, max: 100 }` sits beside
  `brightnessPct` / `contrastPct` / `saturatePct` at `identity: 100`. All four
  carry `scale: 100` (percent); `hueRotateDeg` and `blurPx` carry `scale: 1`.
  So percent-set = 4, identity-100 set = 3. The partitions genuinely differ.
- REQ-136 line 106: "1 the identity of every **scaling filter**, 0 of the rest";
  line 61 bounds "the three **scaling** filters"; line 141: "`grayscale(0)` and
  `saturate(1)` are both no-ops; `grayscale(1)` and `saturate(0)` are both
  extremes." REQ-136 has spent "scaling" on the identity-1 set — which is why
  the AC could not keep the word for the other one.
- `tests/reconciliation-copy-edit-image-framing.test.ts:386-394` clears
  `saturatePct` / `brightnessPct` with `100` and `grayscalePct` with `0`.

### 2 — AC-1117 (warning, consistency)

"The values reported are the run's own as they stand in the draft" is false for
the weight of a run declaring none. Replaced with the assessor's clause, plus
one sentence reconciling it against the size bullet two bullets above (which
justifies withholding size on the ground that "a fabricated number is worse than
an absent control" — the reader is otherwise owed an explanation of why weight
fabricates and size does not):

> The values reported are the run's own as they stand in the draft — for size the
> run's **representative (widest)** value rather than any one viewport's
> keyframe, and for weight the run's own where it declares one, **seeded from the
> lowest declared face** where it does not. That seed is the one reported value
> not read from the node: a chooser has to show something selected, where a size
> control is withheld instead, and it is why echoing the seed straight back is
> not a change.

Nothing else in the AC moved; the Verification section is unchanged (every
seeded run in `tests/reconciliation-copy-edit-typography.test.ts` declares a
`fontWeight`, so no assertion is affected either way).

**Evidence**: `edit.ts:564` — `values.fontWeight = String(axes.fontWeight ??
weights[0])`; `weightChoices` (`edit.ts:498-503`) returns the union sorted
ascending, so `weights[0]` is the lowest declared face. The write path's comment
at `edit.ts:1302-1310` names it as "a fabrication, not a reading of the node"
and derives the no-op rule from it.

The assessor's alternative — raise the seed to STORY-100 and leave the AC
pointing at it — was not taken. The finding was graded a warning *because*
STORY-100 is silent here, so the story-level omission stands; it is a
story-level pass's business, and the AC is now true independently of whether
that pass happens.

## Successor-Rule Check Applied

The assessor's stated rule — *when a repair pins down a phrase, re-read every
other occurrence of that phrase inside the same AC, and check it against the
intent's own usage* — was run before writing, and then re-run across the tree
after writing to confirm the new term collides with nothing:

- **All 43 active ACs on STORY-100** swept for `scaling|percentage|per cent` and
  for `identit`. "Scaling" now survives in exactly one sibling, AC-1027 — "it,
  scaling it, or adjusting its colour" — where it is the plain verb for resizing
  and is explicitly contrasted *against* colour adjustment. No collision; left
  alone.
- "Percentage" appears in AC-1129 ("a typed percentage pair") for pan's
  `xPct`/`yPct` — a different control family, and AC-1130 enumerates its four
  members inline, so neither reads onto the other.
- "Identity" appears unpinned in AC-1122 and AC-1132 (no number attached), so
  AC-1130's newly explicit per-control numbers contradict neither.
- Intent usage checked directly in REQ-136's control table and design rules, not
  via the report.

## Code Edits

None this call. Both findings were prose-only; the implementation and the
shipped UATs were already correct on both points, which is why neither was
touched.

## Verification

`npm test -- tests/reconciliation-copy-edit-image-framing.test.ts
tests/reconciliation-copy-edit-typography.test.ts` → **2 files passed, 15 tests
passed**, 1.16s. (The `wrangler` `EPERM` log-write noise in the output is the
sandbox denying `~/Library/Preferences/.wrangler/logs`, not a test failure.)

## Deferred — for the `uat` pass, deliberately not done here

`tests/reconciliation-copy-edit-image-framing.test.ts:383-385` carries the old
AC-1130 paragraph 3 verbatim as a comment ("unchanged (100%) for the scaling
adjustments, none-at-all (0) for the rest"). Left in place: within that file
line 81 already defines the phrase the REQ-136 way ("100% for the scaling
functions, 0 for the rest"), so the comment is ambiguous rather than false, and
the assessor explicitly scoped it to the uat pass. **The shape it should take,
now settled by finding 1**: name the partition rather than the phrase —
"unchanged (100%) for brightness, contrast and saturation, none-at-all (0) for
black-and-white, the hue shift and the blur". Its assertions are already
correct and must not move.

The other two carried-forward uat items are unchanged and still out of level:
`test_UAT_AC991_every_field_is_one_of_four_closed_shapes_and_markup_stays_literal`
(`tests/reconciliation-copy-edit-typography.test.ts:757`) carries a pre-colour
count in its name while testing all five, and AC-981's two UATs overlap in shape.

Note that `edit.ts:786`, `edit.ts:1404`,
`tests/reconciliation-copy-edit-image-framing.test.ts:81` and
`tests/reconciliation-l1-image-framing.test.ts:266` all use "scaling" in
REQ-136's own correct sense (the identity-1 / identity-100 set). Those are right
and must **not** be swept along with the AC change.

## needs_review Items Forwarded

None. Neither finding was graded `needs_review`, and neither required a
judgement the intent ledger did not already settle.
