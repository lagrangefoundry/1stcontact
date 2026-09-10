---
uid: report-19812dd8
id: REPORT-3741
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 7'
created_by: xgd
created_at: '2026-09-10T14:11:09.779948+00:00'
updated_at: '2026-09-10T14:11:09.779948+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 9
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 7
**Fixes applied this call**: 9
**Violations remaining**: 0
**Needs more work**: false

The bottleneck REPORT-3740 named — "no story body changed in seven cycles" — is
cleared. STORY-84's body was rewritten to cover findings 1–5 in one pass, STORY-86's
stale pointer fixed, and the two ACs that positively stated superseded behaviour
(AC-691, AC-731) were corrected rather than left to drive UATs that would pin the
pre-fix rules.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-84 (`story-8acc338d`) | Full body rewrite covering findings 1–5 (detail below) |
| 2 | story-body-edit | STORY-84 | Follow-up patch: name the axis `font size` explicitly so a term sweep resolves it |
| 3 | story-body-edit | STORY-86 (`story-24098299`) | Finding 6 — values-diff duplicate-text pairing pointer `(CAP-72)` → `(CAP-63, STORY-75)` |
| 4 | ac-edit | AC-691 (`acceptance_criterion-304cae4c`) | Finding 1 — widest-sample rule scoped to axes constant across the ladder; verification now asserts *no* track for a constant axis |
| 5 | ac-edit | AC-731 (`acceptance_criterion-6a5e0eec`) | Finding 3 — self-painting run emits no backing box; a backing box's edges/radius/grouping come from the captured surface rect, runs' union only as fallback |
| 6 | ac-add | AC-1625 (`acceptance_criterion-ee8ba69f`) | Finding 1 — a varying numeric axis folds to a per-width track; a constant one stays a scalar |
| 7 | ac-add | AC-1626 (`acceptance_criterion-1e5570ac`) | Finding 2 — per-side padding folds onto a leaf and insets content inside the pinned border box |
| 8 | ac-add | AC-1627 (`acceptance_criterion-96ccb3ce`) | Finding 4 — height probe → measured `{yFactor, heightFactor}` response; a probe is evidence, never a keyframe |
| 9 | ac-add | AC-1628 (`acceptance_criterion-3bce83ba`) | Finding 5 — a retained bundle materializes as a servable site whose home page is its folded L1 document |

## Finding-by-finding

**Finding 1 (violation, STORY-84 + AC-691) — BUG-18 responsive text tracks.**
The body now carries a dedicated paragraph, *"An axis the page makes responsive folds
to a track, not to one desktop value"*, stating that a numeric axis differing across
sampled widths becomes a per-width keyframe track (font size, line height, letter
spacing, and each padding side), that an axis holding one value stays a plain scalar,
and that reading every axis from the widest sample rendered text oversized at mobile.
Technical Context records the emission rule (≥2 widths carrying the axis AND values
differing; the widest keyframe equals the scalar; segments omitted so the default is
`interpolate`) — matching `fold.ts:607` `RESPONSIVE_TEXT_AXES` / `:623`
`responsiveTextTracks` / the `:638` gate. AC-691's widest-sample sentence is now
scoped to *"an authored axis whose value is identical at every sampled width"*, and
AC-1625 owns the track itself.

**Finding 2 (violation, STORY-84) — BUG-17 / REQ-88 padding.**
Padding went from 0 occurrences to 12. It is now named on the text, image and box
leaf bullets, given its own paragraph (*"Padding folds inward, never outward"*) with
the border-box rationale — the captured box already includes the pad, so folding it
insets content rather than inflating pinned geometry — folded into the responsive-track
paragraph for the varying-side case, added to In scope, and given the drop rules in
Technical Context (`foldPadding`, `fold.ts:552`; `responsivePaddingTracks`, `:657`).
AC-1626 covers it.

**Finding 3 (violation, STORY-84 + AC-731) — BUG-20/21 self-painting, BUG-22/REQ-88
surface rect.** The "reconstructed run surfaces" bullet no longer states the retired
unqualified rule. It now says a run whose own border box already spans its painted
surface is self-painting and contributes **no** backing box (naming both families —
pill saturation at radius ≥ half the painted height, and an authored vertical inset on
a padded control), that every other differing run still emits a backing box, and that
the box's edges, radius and grouping come from the **captured surface rect** with the
runs' union only as a fallback where the capture resolved none. Technical Context adds
the discriminator detail (own computed style vs. ancestor-walked surface axes;
horizontal padding alone deliberately insufficient; gradient / left-accent keep the
treatment on the box), the rect-as-grouping-identity property, the viewport-wide-surface
band guard, and that the inferred card padding/outset estimates were deleted rather than
corrected. AC-731 rewritten to match, including verification that two runs sharing one
surface rect fold to a single box and two on different rects never merge.

**Finding 4 (violation, STORY-84) — REQ-88 viewport-height response.**
New paragraph *"A second sampling axis: viewport height"*, covering what a height probe
is (one ladder width re-shot at a second viewport height), that the response is a
measured finite difference and not an inference — with no probe the fold emits none —
that a probe is evidence about the height axis and **never a keyframe of its own**
(first projection at a width defines the ladder, later ones are evidence), that each
response applies against its own keyframe's captured height so keyframes still evaluate
exactly at capture size, and that a reconstructed card inherits its representative row's
response. Technical Context records why the probe re-shoots an existing width rather
than adding one, and that a band takes its response from its section edges rather than
its runs. Matches `fold.ts:171-199`, `:250`, `:266`, `:1743-1744`, `:1578`, `:1687-1688`.
AC-1627 covers it.

**Finding 5 (violation, no owning story) — `1c repro` materialization.**
Resolved as the report's first-listed option: STORY-84's scope extended, on the
precedent that it already owns the sibling `refold` verb (AC-814) and that the verb sits
between fold and render, inside this capability's own "capture → fold → render → gate"
framing. Added to the Story statement ("materialize that document as a servable site"),
given a paragraph placed next to the offline re-fold (the other operator verb over a
retained bundle), and added to In scope. It states the verbatim-copy property,
idempotence, asset mirroring, the BUG-23 hard failure on an unmirrored handle with its
reason, and the unreferenced-mirrored-asset report. Technical Context adds the
disposable-site-config point and the seams/bindings mismatch rejection. Matches
`cli/repro.ts:95` `cmdRepro`, `:132` `localizeAssets`, `:48-58`.

**Finding 6 (warning, STORY-86).** Pointer corrected to CAP-63 / STORY-75. Verified by
sweep: `CAP-72` now 0 occurrences, `CAP-63` and `STORY-75` 1 each.

## Verification performed

- Code citations spot-read before writing, so the body describes what is actually
  implemented rather than what the report paraphrased: `fold.ts:552` (`foldPadding`),
  `:600-670` (`RESPONSIVE_TEXT_AXES`, `responsiveTextTracks`, `responsivePaddingTracks`),
  `:157-199` (`restingByWidth` probe partition, `HeightProbe`, `heightProbesFor`),
  `:250-275` (`responseFrom`, `probeResponses`), `:980-1045` (`isSelfPaintingRun`,
  `isPaddedControlRun`, `chipAxes`), `:1310-1340` / `:1605-1670` / `:1930-1950`
  (`surfaceFrames`, surface-key grouping, surface-rect-preferred card box),
  `cli/repro.ts:1-150`.
- REQ-88 (`request-7ff1bacd`) read past its opening section as the report instructed —
  rounds 5, 6 and 7 are where the captured surface rect, the `100vh` unfittability
  argument, `responsivePadding`, and the probe-vs-ladder-cell partition are recorded.
- Post-edit term sweep on both stories confirms every previously-absent term is now
  present and the stale pointer is gone.

## Code Edits (if any)

None this call. Every finding was categorized `story-body-edit` and resolved in the
matrix.

## needs_review Items Forwarded

None.

## Notes for the next phase

The four new ACs (AC-1625 → AC-1628) carry no `uat_coverage` field: that field is owned
by the check/fix_uat_coverage cycle and is deliberately not set here. They are the
expected work for the uat-level phase. Note also that AC-691 and AC-731 changed
substance, so any existing UAT written to their prior text now pins superseded
behaviour — the report itself flagged these two as the likely source of the
capability's standing `uat_coverage: fail`.
