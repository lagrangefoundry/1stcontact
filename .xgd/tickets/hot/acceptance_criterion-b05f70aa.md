---
uid: acceptance_criterion-b05f70aa
id: AC-1608
type: acceptance_criterion
title: A band's translucent veil is captured as its own overlay value, resolved through
  the colour probe
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:48:02.774603+00:00'
updated_at: '2026-09-10T00:56:55.441754+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A band records the translucent layer blanketing its backdrop — the scrim that darkens
a hero photograph so text stays legible — as its own **overlay** value (colour +
alpha), distinct from the backdrop image beneath it and from the composited surface
fill of AC-631, and `values-diff` compares it as a section-level axis.

The veil is resolved through the same **canvas colour probe** every other captured
colour goes through, **not** by pattern-matching an `rgba(...)` string. An authored
veil computes to whatever colour syntax the reference's build emits, and a modern
form (`color-mix(in oklab, …)`, `oklch(… / .3)`) matches no `rgba` shape at all, so a
regex drops precisely the veils modern stacks produce — silently, as "this band has
no overlay", and the hero renders unveiled. Serialising through the canvas is what
makes the alpha readable whatever the source syntax was.

Only a genuinely translucent fill is an overlay: a fully opaque background and a fully
transparent one are both not one. And because the full-bleed-translucent backdrop
exclusion of AC-816 keys on the fill being *read* as translucent, the captured overlay
is what makes that exclusion fire — a dropped veil loses the axis **and** returns the
scrim to the backdrop index as an opaque second copy of the photograph it was veiling.

## Verification
Capture a band whose veil is authored as `rgba(...)` over a photograph, and an
otherwise identical band whose veil is authored in a modern colour syntax
(`color-mix(in oklab, …)` / `oklch(… / .3)`); assert both record an overlay carrying
the same colour and the same alpha. Assert a band whose blanketing layer is fully
opaque, and one whose layer is fully transparent, each record no overlay. Diff a
reproduction whose veil alpha differs beyond tolerance and assert a section overlay
delta; diff a matching reproduction and assert none. Assert the modern-syntax veil is
excluded from the backdrop index rather than captured a second time as an opaque
image.