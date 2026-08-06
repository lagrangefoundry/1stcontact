---
uid: acceptance_criterion-23adbe3e
id: AC-809
type: acceptance_criterion
title: A behavior module ships no CSS beyond its declared invariant elements
created_by: xgd
created_at: '2026-08-06T01:33:13.159031+00:00'
updated_at: '2026-08-06T01:33:13.159031+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
Neither survivor behavior module paints. Every rule either module contributes to
a page belongs to behavioural mechanics (the scroll-snap track and its snap
targets, the wrapper chrome zeroed so it adds no layout of its own) or to a
**declared invariant element** — one whose presentation is pinned by an
obligation rather than by the author:

- the honeypot is removed from view and from the accessibility tree without
  becoming skippable, and a designer has no way to reveal it;
- the programmatic label is present and associated but out of the visual flow, so
  it neither paints nor displaces the L1 layout;
- the Turnstile mount sits where the widget expects it;
- the carousel signals which slide is current in a size- and colour-agnostic way,
  because that is a behavioural state a static L1 subtree has no axis to express.

No rule sets a field's surface, height, spacing or arrangement; none sets a
slide's width, the gap between slides, or a pagination dot's size or colour.
Every invariant element is marked as such in the emitted DOM, so a downstream
consumer can tell module chrome from reference content.

## Verification
Collect every rule the two modules contribute and assert each selector targets
either a declared invariant element or a behavioural-mechanics element, and that
the exact properties the deleted stylesheets used to pin — field `border`,
`background`, `border-radius`, `padding`, the field stack's `flex-direction` and
`gap`, the submit button's fill and `align-self`, the slide `flex-basis`, the
track `gap`, the dot's width and colour — appear nowhere. Render both modules and
assert each invariant element carries its marker attribute.
