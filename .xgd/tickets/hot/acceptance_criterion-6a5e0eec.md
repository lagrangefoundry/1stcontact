---
uid: acceptance_criterion-6a5e0eec
id: AC-731
type: acceptance_criterion
title: Run-composited surfaces are reconstructed as a page background band plus backing
  box leaves
created_by: xgd
created_at: '2026-07-29T04:05:20.467187+00:00'
updated_at: '2026-08-20T13:09:56.665372+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The capture attributes a card/panel/section fill onto each text run rather than to a
standalone element, so the fold reconstructs it. The solid fill that the greatest
number of runs sit on becomes the folded document's background band, painted by the
document body. Every run whose composited surface differs from that band — or that
carries a gradient the body cannot paint — folds an additional backing box leaf
carrying that fill/gradient, a geometry pinning all four sides at every present width,
and its visibility rule. Runs sitting on the band get no backing box. All backing boxes
are ordered ahead of the content leaves, so every leaf paints over its own surface.

**A reconstructed surface takes its rect from the element that painted it.** Where the
capture resolved a surface-bearing box for a row, the backing box adopts *that captured
rect* at each width, rather than computing one arithmetically over where the row's runs
happen to sit — a card's edges and corners are a measured fact. Only a row whose surface
the capture missed falls back to its own run box, and then reaches no further than that
box. Two rules qualify the adoption:

- **Band guard.** A resolved surface as wide as the viewport is the page *band*, not a
  card: the run sits directly on the section with no card element between them. Bands are
  reconstructed separately, so such a row keeps its own run box here. Adopting a band's
  rect would stretch a narrow accent rule across the entire section.
- **Accent-bearer fallback.** Where no card-shaped fill resolved but the run bears an
  asymmetric accent rule, the fold takes the rect of the element that *bears* the rule —
  commonly a fill-less wrapper the run sits inside. Without it the rule lands indented
  from the reference by that wrapper's padding and, because a border paints inside its own
  border box, prints over the first glyph. The bearer's rect is consulted **only** where
  no fill was resolved, so a card painting both a fill and an accent keeps one rect for
  both; and corner rounding follows the resolved *surface* shape only, so a row that fell
  back to its accent bearer never inherits a radius that was not its own.

The adopted rect doubles as an **exact grouping identity**: runs painted by the same
element are one card, runs painted by different elements never merge, and the proximity
heuristic arbitrates only those rows whose surface the capture could not resolve. Sibling
tiles can therefore neither merge into one card nor drift apart.

**A full-bleed bar is a second band-seeding path.** A fill also seeds a band when its
same-fill, untreated runs share a horizontal row whose union spans the full content width
**and** whose largest internal horizontal gap dominates — a footer or nav strip whose
items hug the left and right edges (space-between). No single run there is full-width, so
the majority rule alone misses it and each run wrongly becomes a tiny card exposing the
page background across the bar. The dominant-gap test is what discriminates a distributed
bar from an evenly-tiled card grid, whose small, even gaps keep it as cards. The two paths
are ordered so the majority rule still wins the page; the bar path only rescues a strip
the majority rule cannot see.

**A self-painting run paints its own surface on its own text leaf.** A run whose own
border box already spans the surface it sits on — a fully-rounded pill (its radius
reaching half its painted height), or a control carrying authored vertical inset over its
own fill — folds the fill, corner radius, border and shadow **onto the text leaf itself**,
with the radius clamped into the L1 length envelope (any radius at or past half the height
paints the same pill). It is excepted in both directions: because it carries that surface
itself, it contributes nothing to this reconstruction — no row, no backing box, and its
fill is not evidence for the band or for any card signature; the enclosing card is defined
by its other runs. A backing box behind such a run would duplicate the pill as a card.

## Verification
Fold a multi-viewport capture whose runs carry composited fills; assert the document
background equals the dominant run fill, that runs on that fill emit no backing box,
that a run on a differing fill (and a run carrying a gradient even when its solid
equals the band) emits one, and that every backing box precedes the content leaves in
document order. Render and assert both the body background and the panel fill paint.

Adopted rect: give a card row a captured surface-bearing box strictly larger than the
union of its runs and assert the emitted card keyframe equals that captured rect at each
width (not the run union); drop the surface box from one row and assert that row alone
falls back to its run box. Band guard: give a row a resolved surface spanning the full
viewport width and assert the row keeps its run box — the accent rule stays at the run's
own width instead of spanning the section. Accent-bearer fallback: a fill-less run bearing
an asymmetric accent rule inside a padded wrapper folds to a box at the *wrapper's* rect,
and carries no corner radius even when the band it sits on has one; a row painting both a
fill and an accent uses the fill's rect for both.

Grouping identity: two rows with identical surface signature and near proximity but
*different* captured surface rects fold to two cards, and two rows sharing one captured
rect fold to one — while two rows the capture resolved no surface for still group by
proximity.

Full-bleed bar: fold a capture whose footer is two same-fill untreated runs hugging the
left and right edges of a full-width row, and assert their fill seeds a full-bleed band
rather than two tiny cards; fold an evenly-tiled three-up row of the same fill and assert
it stays cards. Assert the page's own band is still chosen by the majority rule when both
paths apply.

Self-painting run — **both** families, each asserted in both directions:
- **Pill.** Fold a capture holding a run whose own radius saturates (reaching half its
  painted height) over its own fill, and assert its **text leaf** carries that fill,
  radius, border and shadow; that **no** backing box is emitted for it; and that a
  saturating sentinel radius is clamped into the envelope's length range rather than
  rejected.
- **Padded control.** Fold a capture holding a run with authored vertical inset over its
  own fill (a button-shaped run whose rounding is modest, so pill saturation does not
  catch it) and assert the same: surface on the text leaf, no backing box, and the leaf's
  box not outset by an inferred padding.
- **Contributes no evidence.** In a card whose other runs share one fill, assert a
  self-painting run of a *different* fill inside it neither seeds a band nor forms its own
  card nor perturbs the enclosing card's signature or rect — the card is defined by its
  other runs, and the page band is still chosen from the non-self-painting runs.
- **Not over-applied.** Assert a run with only *horizontal* padding, and a run whose
  vertical inset accompanies a surface gradient or a `border-left` accent bar, each stay
  on the card path and still emit their backing box — the exception does not swallow them.
