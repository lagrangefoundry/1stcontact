---
uid: report-81daebe5
id: REPORT-2433
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (story) — attempt 12'
created_by: xgd
created_at: '2026-08-20T12:26:14.007887+00:00'
updated_at: '2026-08-20T12:26:14.007887+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: story
  fixes_applied: 6
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (story)

**Attempt**: 12
**Fixes applied this call**: 6
**Violations remaining**: 0
**Needs more work**: false

All five findings of `report-3baffe05` land in STORY-84 (`story-8acc338d`) and all
five are applied this call. Body grew 29024 → 33728 chars; re-read through
`xgd ticket get --json` after the write to confirm the mutation landed.

Every cited code site was read before editing, so each new claim is reproducible
from the source rather than paraphrased from the finding:

| Claim written | Verified at |
|---|---|
| per-axis anchor fit, independent suppression | `fold.ts:517-539` (`x` uncapped, `width` capped, `if (x)…; if (width)…`) |
| nested cap, over-determined only, sane fraction | `fold.ts:490-513`, `:442` |
| pxTrack fallback inheriting `segments`, full-bleed refusal | `fold.ts:519-533` |
| content cap as third column term; extent = `min(maxWidthPx, inner)` | `fold.ts:393-398`, `:446-449` |
| modal left edge | `fold.ts:369-373` |
| accent bearer's rect, precedence, radius corollary | `fold.ts:1906-1921` |
| viewport-wide surface refused as a card rect | `fold.ts:1906-1909` (`shape.width < at`) |
| captured rect as exact grouping identity | `fold.ts:1610-1625` |

## Actions Taken — by Resolution Category

| # | Category | Element | Finding | Action |
|---|---|---|---|---|
| 1 | story-body-edit | STORY-84 — Description, column paragraph | 4 | Rewrote the opening sentence: the column is a container maximum and a horizontal inset reproducing every sampled **origin**, plus a **content cap** where the page's content stops short of the container, reproducing the **extent**. Kept the existing all-samples rejection rule verbatim in substance |
| 2 | story-body-edit | STORY-84 — Description, new paragraph beside the column paragraph | 1 | Added "**A column anchor is fitted per axis, not as one undivided thing**": left edge and extent fitted separately, either may anchor alone, because alignment is shared across siblings while width is private. States the measured consequence of coupling (one hero line anchored, three neighbours drifting, a 31px split in text the reference keeps flush — worse than not anchoring). Adds the nested cap with both admission conditions (over-determined fit; plausible share of the column) and the reason (a width that merely correlates over the sampled range is refused, not extrapolated off-sample) |
| 3 | story-body-edit | STORY-84 — Description, same region | 3 | Added the two no-closed-form rules: a layout **mode** change at a breakpoint keeps the closed-form origin and keyframes only the residual inset, snapping where the node's own geometry snaps; and a full-bleed element spanning the viewport is never anchored, because `origin + (-origin)` interpolated walks the band off the left edge |
| 4 | story-body-edit | STORY-84 — Description, new paragraph after the language bullet list | 2 + 5 | Added "**A reconstructed surface takes its rect from the element that painted it**": the captured surface-bearing box as the measured fact, the **band guard** (a viewport-wide surface is the band, adopting it stretches a narrow accent rule across the section), the **accent-bearer fallback** (a fill-less wrapper's measured rect, else the rule lands indented by the wrapper's padding and prints over the first glyph), its **precedence** (consulted only where no fill was resolved, so a card painting both keeps one rect for both), the **radius corollary** (rounding follows the resolved surface, never the accent bearer), and the **exact grouping identity** (same element → one card; different elements never merge; proximity arbitrates only unresolved rows) |
| 5 | story-body-edit | STORY-84 — **In scope** | 1–5 | Both affected clauses scrubbed to match: the reconstructed-surfaces clause now names the captured rect, the band exclusion, the accent-bearer fallback and the grouping identity; the column clause now names container/inset/content cap and the per-axis fit with its capped extent, keyframed-inset fallback and full-bleed refusal |
| 6 | story-body-edit | STORY-84 — **Technical Context** | 5 + supporting | Extended the REQ-88 bullet with the two qualifiers finding 5 named (band refused as a card rect; the accepted rect as grouping identity), so TC no longer states the adoption rule unguarded. Added one bullet carrying the two fit-honesty techniques the new Description rules rest on: the **modal** left edge (a page has more than one gutter; the minimum made the fit fail outright) and the over-determined requirement on a capped extent |

Placement follows the assessor's Notes for the Editor: findings 1/3/4 applied as one
rewrite of the column region plus the matching In-scope clause; findings 2/5 applied
together as one paragraph about which rect a painted surface contributes, since both
resolve in the same function (`fold.ts:1906-1921`).

## Code Edits (if any)

None this call. No production code was touched.

## Verification

`npm test -- tests/req88-viewport-relative-and-nowrap.test.ts` → **21 passed / 21**,
1.00s (vitest 4.1.9). Unchanged from the assessor's own run, as expected for a
matrix-only call — the run confirms every behaviour newly described is live and
pinned, including `test_UAT_FC_REQ-88_x_anchors_even_when_width_is_not_a_column_function`
(finding 1), `..._a_full_bleed_band_is_never_anchored_to_the_column` (finding 3),
and the three accent-bearer UATs at `:99`, `:148`, `:621` (finding 2).

## needs_review Items Forwarded

None. No finding in `report-3baffe05` was categorized `needs_review`.

## Carried Forward (not matrix findings)

- **Stale doc comment, `fold.ts:451-458`.** `fitAnchor`'s comment still asserts the
  pre-Round-8 coupled behaviour ("Returned only when the fit reproduces every
  sample to within a pixel *on both axes*. **Both**, because…"), which the code at
  `:534-539` and the UAT at `tests/req88-viewport-relative-and-nowrap.test.ts:409`
  both contradict. Confirmed still present this call. The behaviour is correct and
  no verdict depends on it, so it is not a `code-issue` and was left alone —
  but it is very likely why finding 1 survived eleven cycles, and it will mislead
  the next reader auditing the fold from its own comments. Worth a separate
  free-coded comment fix.
- The assessor's two deliberately-not-raised items were re-checked. The text leaf's
  `ceil` rule (`fold.ts:1789-1797`) remains unexpressed and remains below the bar.
  `fitColumn`'s modal left edge is now expressed in Technical Context — it is
  code-true, unowned matrix-wide, and directly supports the rewritten column
  paragraph, so carrying it costs nothing and removes a reason for a future cycle
  to re-mine the same region.

## Where This Leaves the Capability

STORY-86 and the CAP-71 body came through the last cycle clean and were not touched
this call. STORY-84's behaviour-seam half completed at attempt 11; its
geometry-derivation half — REQ-88's Round-5 through Round-8 column, anchor and
surface-rect work, which the assessor identified as the last unmined region of this
capability's intent — is now expressed at the level of its own rules. With
BUNDLE-10's round passes all read and applied, no violations remain that I can
identify. Handing back to the assessor.
