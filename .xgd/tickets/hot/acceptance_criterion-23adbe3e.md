---
uid: acceptance_criterion-23adbe3e
id: AC-809
type: acceptance_criterion
title: A behavior module ships no CSS beyond its declared invariant elements
created_by: xgd
created_at: '2026-08-06T01:33:13.159031+00:00'
updated_at: '2026-08-06T01:40:36.765094+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
Neither survivor behavior module paints. Every rule either module contributes to
a page belongs to behavioural mechanics or to a **declared invariant element** —
one whose presentation is pinned by an obligation rather than by the author.

Behavioural mechanics are the rules without which the behaviour does not work:
the scroll-snap track and its snap targets, the wrapper chrome zeroed so it adds
no layout of its own to the L1 it wraps, and the carousel's current-slide signal
— a behavioural state a static L1 subtree has no axis to express, so it is
expressed in the minimal size- and colour-agnostic way, leaving the dot's actual
look entirely to L1.

Invariant elements are the module's to paint because an obligation, not taste,
fixes how they present: the honeypot is removed from view and from the
accessibility tree without becoming trivially skippable, and no author can reveal
it; the programmatic label is present and associated but out of the visual flow,
so it neither paints nor displaces the L1 layout; the Turnstile mount sits where
the widget expects it. Each is declared as invariant in the contract, is never
bindable by an L1 node, and is marked in the emitted DOM (alongside the client
enhancement's inline error surface) so a downstream consumer can tell repro-only
module chrome from reference content.

No rule sets a field's surface, height, spacing or arrangement; none sets a
slide's width, the gap between slides, or a pagination dot's size or colour.

## Verification
Collect every rule the two modules contribute and assert each selector targets
either a declared invariant element or a behavioural-mechanics element, and that
the exact properties the deleted stylesheets used to pin — field `border`,
`background`, `border-radius`, `padding`, the field stack's `flex-direction` and
`gap`, the submit button's fill and `align-self`, the slide `flex-basis`, the
track `gap`, the dot's width and colour — appear nowhere. Render the form module
and assert each of its invariant elements carries the marker attribute and that
naming one from an L1 control node is refused. Render the carousel and assert the
current-slide signal is present and carries no size or colour.