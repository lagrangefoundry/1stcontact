---
uid: acceptance_criterion-c6af20ad
id: AC-1270
type: acceptance_criterion
title: Every painted panel exposes the colour it is filled with, written the same
  way, while a region that paints nothing is offered none
created_by: xgd
created_at: '2026-08-20T02:56:22.392206+00:00'
updated_at: '2026-08-20T06:32:36.832948+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A painted panel exposes **what colour it is filled with**, written by the same
rule and in the same shape as a run's own colour: a reference into the site's
palette, never a free colour value, landing in the panel's fill and painted by
the re-render.

It is offered on **every** painted panel, including one whose only paint today is
a rounded corner or a background image — such a panel had nothing to edit before
and could be clicked, outlined and opened only to be told so. Setting a fill on
it lands alongside whatever it already paints, leaving every other parameter it
carries byte-identical.

**A panel painted only by a palette reference is still a painted panel.** A fill
holding a reference is paint on the strength of the axis being there, not of what
the reference happens to compile to on the surface reading it — the editor reads
the definition before the palette is folded, so a rule that asked what colour the
fill produces *today* would report a panel with nothing else on it as painting
nothing. It would then stop being addressable and stop offering the field, and
the surface would take the panel away at the moment somebody used it.

The fill is offered on the panel and **not** on a run of copy or an image region
that happens to carry one, because a folded run's box is glyph-tight: filling it
paints a tight rectangle behind the words rather than the background anybody
means by "behind this text".

And a region that paints **nothing** is not a region at all: a box or container
with no paint, and a behavior module's seam, are never offered a fill, because
neither is addressable and a control on an unreachable node is a control nobody
can use.

## Verification

Seed a page carrying a panel with a fill, a panel painting only a rounded corner,
a panel whose only paint is its fill, a run of copy that also carries a fill
parameter, an unpainted container, and a module seam. Assert the first three
expose a fill field — the first reporting its current fill, the second reporting
no value — and that the run exposes no fill field despite carrying one. Assert
the unpainted container and the seam expose no fill: the seam answers with an
empty field list, and the unpainted container is not addressable at all. Write a
palette reference into each of the panels' fills and assert the stored panels
carry the reference, that the re-rendered page paints it, and that the rounded
corner and any other parameter the panel held are untouched. For the panel whose
only paint is its fill — the one with no second axis to keep it alive — assert
that after the reference lands it still exposes the fill field, still reports the
reference as its value, and is still stamped with an address by the edit render.
