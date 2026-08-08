---
uid: acceptance_criterion-23adbe3e
id: AC-809
type: acceptance_criterion
title: A behavior module ships no CSS beyond its declared invariant elements
created_by: xgd
created_at: '2026-08-06T01:33:13.159031+00:00'
updated_at: '2026-08-08T00:42:39.243175+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Neither survivor behavior module paints. Every rule either module contributes to
a page belongs to behavioural mechanics, to a **declared invariant element** —
one whose presentation is pinned by an obligation rather than by the author — or
to a **declared settled state** for the edit channel.

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

**The settled state is the second carve-out, and it is bounded the same way.** A
module whose behaviour holds content out of view owes the edit channel a
behaviour-off state, because only the module knows what its own behaviour was
holding back — a carousel's slides are all in the DOM, but with behaviour off
they sit scrolled out of view, unreachable to click and invisible to read. The
channel must not need to know what a carousel is, so the module declares the
state itself. Its bounds:

- **Scoped to the edit channel** by the document-level edit marker, which only
  the edit render sets — so the rule cannot reach a published or draft-preview
  page at all, and the zero-CSS guarantee is untouched everywhere it is
  load-bearing.
- **It releases; it does not paint.** It may set only flow- and scroll-release
  properties — the ones that undo the module's own mechanics — and no property an
  L1 subtree owns. A settled state can make content visible; it can never decide
  how that content looks.

No rule sets a field's surface, height, spacing or arrangement; none sets a
slide's width, the gap between slides, or a pagination dot's size or colour. That
holds in every channel, the edit channel included.

## Verification
Collect every rule the two modules contribute and assert each selector targets a
declared invariant element, a behavioural-mechanics element, or a settled state,
and that the exact properties the deleted stylesheets used to pin — field
`border`, `background`, `border-radius`, `padding`, the field stack's
`flex-direction` and `gap`, the submit button's fill and `align-self`, the slide
`flex-basis`, the track `gap`, the dot's width and colour — appear nowhere.
Assert every settled-state rule is scoped by the document-level edit marker and
sets only properties drawn from the declared release set, and none that paints.
Render the form module and assert each of its invariant elements carries the
marker attribute and that naming one from an L1 control node is refused. Render
the carousel and assert the current-slide signal is present and carries no size
or colour.