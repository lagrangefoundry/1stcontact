---
uid: report-67e7e4cb
id: REPORT-2445
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (ac) — attempt 9'
created_by: xgd
created_at: '2026-08-20T13:11:33.614516+00:00'
updated_at: '2026-08-20T13:11:33.614516+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: ac
  fixes_applied: 5
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (ac)

**Attempt**: 9
**Fixes applied this call**: 5
**Violations remaining**: 0
**Needs more work**: false

All three findings of `report-81bbe352` (2 violations + 1 warning) are resolved. As the
report's *Notes for the Editor* directed, `probes.ts:405-488` was read end to end before
editing so the two envelope findings were fixed as one coherent statement rather than
clause by clause. No story body was touched and no new AC was created — neither was
required at this level.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | ac-edit | AC-736 (body) | Re-keyed the overlap exemption on **fold-synthesized identity** and added the missing corollary |
| 2 | ac-edit | AC-736 (title) | Title re-worded to match: "A fold-synthesized backing surface is not a sibling overlap, but a captured one is — and both stay subject to the clip check" |
| 3 | ac-edit | AC-710 | Added the third envelope violation (pinned-box content overflow) to the finding-shape clause + verification |
| 4 | ac-edit | AC-706 | Widened the off-sample probe's envelope from "clips beyond the viewport" to the evaluator's full three-violation envelope |
| 5 | ac-edit | AC-707 | Same widening for the content-robustness probe, with the pinned-container case stated in its own clause |
| 6 | ac-edit | AC-731 | Added the self-painting run to Verification (both families, both directions) and stated its positive half in the criterion |

### Finding 1 (violation, consistency) — AC-736

The criterion described the exemption by *shape* ("a childless box carrying a
card/panel/section fill"), which also fits the leaf AC-730 folds from a genuinely
captured standalone panel. `probes.ts:465-474` exempts only `slot` leaves and `box`
leaves whose id passes `isSynthesizedSurfaceId` (`section-band-` / `section-bg-` /
`card-`, `fold.ts:892-897`).

- The criterion now names the exempt set as the boxes the fold **invented** for fills the
  capture composited onto runs, and says the exemption is keyed on that identity, not on
  the leaf's shape.
- Added the corollary from STORY-86's Technical Context (lines 213-218 of the story body)
  in full: a genuine captured standalone surface box is real painted content and **still
  participates in the overlap check**; being a painted surface is not itself a ground for
  exemption.
- Verification now requires the discriminating assertion the finding asked for: two
  captured standalone surface boxes that intersect **are** reported, while in the same
  document a synthesized backing surface under its own content is not.

A UAT authored from the revised AC now agrees with shipped code; the previous wording
would have licensed one that fails.

### Finding 2 (violation, coverage) — AC-710 + AC-706 / AC-707

`probes.ts:405-416` pushes a `kind: 'clip'` finding, detail `content height Npx exceeds
pinned box height Mpx`, `paths: [path]` (the **container's** own path), whenever a node
with a fixed keyframe height has flowed children stacking past it. No AC named it.

- **AC-710** now enumerates all three envelope violations explicitly and gives the third
  its shape: reported under `clip`, detail naming **both** heights, path of the container
  rather than of a leaf inside it. Verification adds the positive case plus two negatives
  (pinned height accommodates its content; container not pinned at all).
- **AC-706 / AC-707** stated the pass condition as "no overlap and no clip beyond the
  viewport" — strictly the `probes.ts:449-458` check. Both now state the evaluator's full
  envelope, and AC-706 adds the explicit tie: the probe's pass condition *is* the
  evaluator's finding set, so it does not pass a width at which a pinned-box overflow was
  reported even though nothing crossed the viewport edge.
- AC-707 gained a dedicated clause for the pinned **container** under perturbation. This
  is code-true and load-bearing: `probes.ts:295-343` scales leaf heights by
  `contentScale`, but the pinned height of a *container with children* (line 408) is read
  unscaled, so grown interior content genuinely overruns it. Its verification pairs that
  against the same container left unpinned, which passes.

### Finding 3 (warning, coverage) — AC-731

The criterion carried the self-painting exception but only in its negative form, and the
Verification section never exercised it. Both halves are now covered, written against
`fold.ts:1003-1037` (`isSelfPaintingRun` / `isPaddedControlRun`) and `fold.ts:1834-1877`
(chip axes on the text leaf, `if (chip) continue`):

- The criterion's clause now leads with the positive half — the fill, corner radius,
  border and shadow ride on the text leaf itself, radius clamped into the L1 length
  envelope — before the "contributes nothing" half.
- Verification adds four assertions: the **pill** family (saturating radius, sentinel
  clamped not rejected), the **padded-control** family (modest rounding, box not outset by
  an inferred padding), **contributes no evidence** (a differently-filled self-painting run
  inside a card neither seeds a band nor forms its own card nor perturbs the enclosing
  card's signature or rect), and **not over-applied** (horizontal-padding-only, plus the
  gradient and `border-left` guards, all stay on the card path and still emit a backing
  box).

## Code Edits (if any)

None this call. Every behaviour written into the ACs was located in shipped code first
(`probes.ts:405-416`, `:449-458`, `:465-474`, `:295-343`; `fold.ts:892-897`,
`:1003-1037`, `:1834-1877`) — consistent with the report's note that nothing here is a
`code-issue`. No test file was modified, so nothing could regress; no test run was
warranted.

## Coverage implication for the next level

These edits widen what the ACs demand of their UATs, and the shipped tests do not yet
meet the widened demand. `uat_coverage` fields were left untouched (flipping them is not
an ac-level lever), but the uat-level cycle should expect these gaps:

| AC | Existing test | Gap now open |
|---|---|---|
| AC-736 | `test_UAT_AC736_backing_surface_is_not_an_overlap_but_still_clips` (`tests/reconciliation-3probe-gate-evaluator.test.ts:386`) | Covers the synthesized case and the clip corollary; asserts nothing about **captured** standalone surfaces still overlapping |
| AC-710, AC-706, AC-707 | `tests/reconciliation-3probe-gate.test.ts` | No test anywhere greps for `exceeds pinned box height`; the whole third envelope violation is untested |
| AC-731 | `tests/bug14-fold-surface-hierarchy.test.ts`, `tests/bug19-fold-bar-band-fill.test.ts` | No self-painting-run assertion in the AC's own verification chain |

## needs_review Items Forwarded

None. Every finding in `report-81bbe352` was categorized `ac-edit` and all three were
applied. The report's info items 5 and 6 (STORY-84 body wording on the scrim; two
AC-1349 clauses thinner in the story body than in the AC) are recorded there as
story-level notes with "none at this level" — deliberately not acted on here.
