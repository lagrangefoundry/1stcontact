---
uid: request-07d0e3e1
id: REQ-64
type: request
title: 'Noise audit: every values-diff delta must be a real visible difference (kill
  false positives)'
created_by: xgd
created_at: '2026-07-17T01:33:57.749953+00:00'
updated_at: '2026-07-19T01:04:56.974535+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  commits:
  - working_sha: 78fda0ad5b19db3cf0f5647bdd2cab13540508f0
    reconcile_sha: null
    main_sha: null
  - 0b76ce6e
  - a20c906a
  - ec764f63
  - '43748537'
  - 6ea85d74c7665fab685e556a45aa7dd8ffffd80c
  - ab8a707f10043ef5f92e5ef22c4eb8e9198b28e9
  version: 0.0.137
---

## Goal

**Noise audit / management: every delta the values-diff reports must be a REAL,
visible difference** — eliminate false positives so a clean gate means clean, and
"0 diffs" is reachable by a genuinely-faithful reproduction.

## Why

The gate over-reports: deltas that change no pixel inflate the count and erode
trust (the operator learns to ignore the number, which defeats it). Generalises
the operator's "tolerance layer" from a size tolerance to a full noise-management
discipline: criticality is a per-run overlay ON TOP of complete capture, never a
reason to drop an axis.

## Known noise sources (to characterise + fix)

1. **Font-metric residuals** — a shrink-to-content title box is 170px ours vs
   167px ref (a 3px font-rendering difference, sub-visual). Box `size` flags it
   exact; needs a sub-visual tolerance keyed to the rendered-text metric.
2. **Box-width of single-line, left-aligned text** — the box width differs but
   nothing reflows (text at the same position). Distinguish from the multi-line
   case where wrapping IS visible.
3. **Aggregation** — "systemic drift xN" rollups + per-element duplication across
   the 6-viewport ladder inflate the raw count; report per-defect, not per-cell.
4. **Shape pill-radius clamp** — `33554400px` (browser max) vs an authored
   `9999px` are the same pill; normalise.
5. **Sub-pixel position/size jitter** — cross-engine rounding.

## Approach

- Per-axis: define what "no visible difference" means (a tolerance, a
  normalisation, or a pairing fix) and apply it as a SEPARATE layer over the raw
  capture — the raw axis stays exact; the noise layer is a dial the operator can
  turn off to see everything.
- A delta that survives the noise layer is, by construction, visible.

## Notes

- Sibling to the coverage audit (REQ-63, false negatives). Coverage + noise
  together make "0 value-diffs ⟺ pixel-faithful" hold.
- Do NOT bake criticality into capture (that hides real signal for other sites);
  it is a per-run overlay.


---

## Session note (2026-07-17) — gigabytealchemy re-diff + 2 new noise sources

Fresh recapture of gigabytealchemy.ai + multi-viewport values-diff to exercise
the gate. Fixed one **real** repro defect and surfaced two new noise sources.

### Real fix (committed, [FREE-CODED] 78fda0ad)
- `contact-form` `submit-inline` was `flex-direction:row` at all widths — the
  subscribe strip squished the field+button on mobile. Reference is
  `flex-col sm:flex-row`. Made responsive (stacked <640, row from sm). This is
  the one delta the operator flagged as caring about (responsive behaviour).

### Demonstration of the ticket's premise
Fixing that real, user-visible responsive defect moved the multi-viewport count
only **1323 → 1318 (−5)** — because the count is dominated by noise. A genuine
fix is invisible in the gate number. This IS the problem REQ-64 exists to solve.

### New noise sources (extend the list above)
6. **Visually-hidden a11y text nodes.** `fieldLabels:placeholder` renders a
   clipped/off-screen `<label>` (a11y tree only, paints nothing). The values-diff
   measures it as a visible "label (outside/above)" text node → containment +
   arrangement CRITICALs on all 4 form fields = **8 false CRITICALs/viewport (48
   across the ladder)**. Fix: exclude nodes that paint nothing (clip-rect /
   off-screen / 1px) from the visible-content comparison.
7. **Computed `list-style-type` on non-rendering list items.** The reference's
   cards are flex `<li>` (`flex items-start`) whose computed `list-style-type` is
   `disc`, but flex layout paints NO marker. Ours computes `none`. Both show zero
   bullets → identical, yet `listMarker` compares the raw computed property =
   **~18/viewport, 108 across the ladder**. Fix: key the marker axis on whether a
   marker is actually painted (display==list-item), not the computed value.

### Composition of the residual (desktop cell, 203 deltas)
- `position` 59 — CORRELATED-real (per-section vertical-rhythm drift, ~8 root
  causes not 59 defects); collapse via container attribution (source #3).
- `renderedTextBox` 40 + `size` 38 — largely NOISE (shrink-vs-block box width;
  28/38 size are width-only, no reflow) (source #2).
- `listMarker` 18 — NOISE (source #7, new).
- `containment` 4 + part of `arrangement` 6 — NOISE (source #6, new).
- `shape` 9 — mixed (pill-radius clamp NOISE #4 + radius 8→6 real).
- remainder — near-neighbour colour, misc; small genuinely-visible residual.

> Net: >50% of the diff is provably invisible; most of the rest is over-counted
> correlated-real. The genuinely-visible-defect residual is small — the
> reproduction is "good enough" per the operator.

### Open (repro-fidelity, not noise — operator to decide)
- Contact-form "Send message" button: ref `w-full md:w-auto` (full-width on
  mobile), ours auto at all widths. Needs a submit-width dial (a global default
  change would perturb faelan/joyful).
- Header nav (`hidden md:flex`, 6 links top-right desktop, no mobile hamburger):
  we omit it. Adding needs header-layout work (right-align nav + a no-toggle
  collapse mode). Tried + reverted this session (introduced a left/stacked nav +
  a phantom mobile hamburger).