---
uid: bug-95fcf0da
id: BUG-173
type: bug
title: 'L1 above the widest rung: full-bleed surfaces freeze while content keeps tracking
  the viewport, and no probe samples there'
created_by: EPIC-12
created_at: '2026-10-02T00:34:56.539149+00:00'
updated_at: '2026-10-02T01:00:43.792752+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  severity: medium
  priority: high
  defect_class:
  - instrument-blind
  - fold-wrong
  epic_parent: epic-bf282b3d
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dd7a80cc
---

# Above the widest captured rung, full-bleed surfaces freeze while their content keeps tracking the viewport — and no probe samples there

Raised from the operator's observation on faelan.com and gigabytealchemy.ai: the originals scale cleanly at
any browser width; the reproductions stop growing their background at a certain width, and content keeps
moving past the edge of the background that has stopped.

- evidence: `storage/tmp/repro-console/repro-gigabytealchemy-ai/iteration-11/site/home.html`,
  `storage/tmp/repro-console/repro-faelan-com/iteration-5/site/home.html`, and each iteration's `page.json`
- references: `storage/references/{gigabytealchemy.ai,faelan.com}/index`

`defect_class`: **`instrument-blind`** (nothing samples above the top rung) and **`fold-wrong`** (the capture
carries the answer and L1 can express it; the fold emits pins instead).

## The mechanism

`packages/framework/src/l1/render.ts` (`geometryRules`, "Final keyframe held statically above the last
breakpoint") holds every keyframed box at its widest-rung value above 1440px. Three other mechanisms keep
tracking the viewport there: REQ-88 column anchoring (`left: calc(max(0px, (100vw - Cpx)/2) + …)`), relaxed
flow widths (`width: fit-content`), and the height response (`100vh`). So above 1440 the page is a mixture of
frozen and live boxes, not a copy of the 1440 sample.

Measured in the served CSS for gigabytealchemy iteration 11:

| block | `100vw` terms | literal px decls |
|---|---|---|
| `@media (min-width: 1280px)` | 240 | 0 |
| `@media (min-width: 1440px)` | 3 | 215 |

Faelan, `@media (min-width: 1440px)`: the hero band `.l1-1` is `width: 1440px`, and all six hero children are
`left: calc(max(0px, (100vw - 896px) / 2) + 24px + OFFSET)`. At a 1920px viewport `.l1-4` (224px wide, offset
+776) has its right edge at 1536px — 96px past the band. At 2400px it is 336px past.

## Part 1 — the alarm: the envelope probes sample above the top rung

`offSampleWidths` (`tools/generate/src/l1/probes.ts`) deliberately excludes widths above the last rung, on the
premise that "the renderer holds the end keyframe there, so the geometry is identical to the rung's". That is
true below the first rung and **false above the last**, for the reasons above. The exclusion below the first
rung stays; the one above the last is removed.

Required behaviour:

1. The off-sample probe evaluates the document at at least one width above the widest captured rung (for
   example 1920px), in addition to the interior samples it takes today.
2. The layout evaluator used by the probe resolves widths above the last rung exactly as the renderer's CSS
   does — held keyframes stay held, while column-anchored positions, `fit-content` widths and fluid sizing keep
   tracking the viewport. An evaluator that simply holds every box at the last rung would reproduce the blind
   spot this ticket removes.
3. A backing surface (band or panel) whose content extends past its right edge, or whose width stops short of
   the viewport while it was full-bleed at every captured rung, is reported as a finding at that width, naming
   the surface and the overhang in px — the same shape as the existing "no longer covered by its backing
   surface" findings.
4. Against the current documents (before Part 2), the probe names gigabytealchemy's frozen full-bleed surfaces
   and faelan's hero band at the above-top-rung width. This is the proof the alarm works, and it is recorded
   in the ticket before Part 2 lands.

## Part 2 — the defect: the fold emits a viewport-tracking width for a full-bleed node

The data already answers "does this box keep scaling?". A node whose keyframe width equals the viewport at
every captured rung (within 1.5px) is full-bleed. Against the current documents that predicate selects:

- gigabytealchemy: 6 of 90 nodes — `section-bg-0`, `section-band-1` … `section-band-5`
- faelan: 3 of 13 nodes — `section-bg-0`, `section-band-0`, `section-band-1`

These are exactly the full-bleed surfaces, with no false positives. The fold currently emits them as six
keyframes that trace the identity line, and the "hold the final keyframe" rule then freezes them. No node on
either page carries `sizing` today, although `l1SizingSchema` already offers `mode: 'fluid'` with an optional
`maxPx` and the renderer compiles `fluid` to `width: 100%`.

Required behaviour:

5. The fold marks a node whose width equals the viewport at every captured rung as viewport-tracking, and the
   rendered page gives it a width that keeps following the viewport above the widest rung instead of a frozen
   literal.
6. When the original page caps its width, the reproduction caps too: capture already records
   `containerMaxWidthPx` (`extract.ts`), and a node whose width stops growing across the upper rungs (a
   plateau) keeps holding its captured width. The reproduction scales above the top rung only where the
   original did. A node that is not full-bleed at every rung is left exactly as it is emitted today.
7. The keyframe width must not override the viewport-tracking width. Today `nodeWidthAt` and `geometryRules`
   read keyframes first and fall back to `sizing` only when there are none, so adding `sizing` alone would
   change nothing. REQ-88's column anchor already suppresses keyframe widths for the same reason
   (`render.ts`, `nodeWidthAt` docblock); the viewport-tracking width needs the same precedence, in both the
   CSS and `nodeWidthAt` (which also chooses background-image renditions, so it must report the viewport width
   for these nodes).
8. At every captured rung the rendered box is unchanged (the identity-line nodes are already exactly the
   viewport width there), so on-sample fidelity does not move. Report the at-rest gate numbers before and after
   for both sites to show that.
9. After the change, the Part 1 probe is clean above the top rung for these surfaces on both sites.

## Out of scope

- A capture projection wider than 1440px. It would turn the inference in Part 2 into a measurement for a site
  that happens to cap at exactly its widest rung, and it has the same shape as REQ-88's extra height
  projection. It is optional hardening, not a prerequisite, and it is not part of this ticket.


## Part 1 evidence — the alarm against the current documents (recorded before Part 2)

`offSampleProbe` on the served `page.json` of each iteration named in the evidence, with the Part 1 evaluator
(above-top-rung sample = `round(1440 × 4/3)` = **1920px**; column anchors resolved from the column function):

gigabytealchemy iteration 11, at 1920px (both sampled heights):

- `section-bg-0`, `section-band-1` … `section-band-5`: each "was full-bleed at every captured width and stops
  **480px** short of the viewport's right edge"
- 'LinkedIn' / 'GitHub' "no longer covered by … `section-band-5`": 3px / 72px right of its right edge

faelan iteration 5, at 1920px: `section-bg-0`, `section-band-0`, `section-band-1` each stop **480px** short.

The same evaluator also exposes the same mixture *inside* the 375→768 `snap` window, which the old model read
from keyframes and so could not see. The bands hold their 375px width there while column-anchored runs keep
following the column: at 506/637px faelan's 'Faelan', 'Worlds End Studio…' and '© 2025…' sit 107/238px past
`section-band-0`/`-1`, and gigabytealchemy's LinkedIn/GitHub sit past `section-band-5`. These are real
served-CSS findings of the same class (a frozen surface beside live content), not a model artifact.