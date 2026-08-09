---
uid: acceptance_criterion-0ec45c68
id: AC-821
type: acceptance_criterion
title: Every focusable control presents a visible focus indicator on keyboard focus
  whether or not one was authored, the indicator appears instantly rather than fading
  in, and no site definition can express its removal
created_by: xgd
created_at: '2026-08-06T02:03:14.046104+00:00'
updated_at: '2026-08-09T05:40:53.712875+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A control bound to a behavior module and reached by keyboard presents a visible
focus indicator in all three of these cases:

- it declares no interaction at all;
- it declares a hover state and nothing else;
- it declares a focus state with no indicator of its own.

The supplied indicator takes its colour from the node's own text colour, so it
stays visible on a light or a dark surface without the substrate assuming a
palette. An authored indicator (width, colour, offset, line style) replaces the
supplied one — taste may restyle the indicator, never remove it.

The indicator is never animated: even where the focus state's paint delta
transitions, the indicator is present the instant focus arrives, because an
indicator that fades in is one that is briefly absent.

No site definition can express the indicator's removal: a zero-width or
negative-width ring fails validation, the vocabulary offers no "none" variant,
and no published page suppresses the indicator by any other means.

## Verification
Render a page with a module-bound control in each of the three unauthored cases
and assert a focus indicator is presented on keyboard focus in every one, in the
node's own colour, and that nothing in the output suppresses an outline. Render
a control with an authored indicator and assert the authored values are used.
Assert the indicator is excluded from the animated property set of a control
whose focus state also changes paint. Assert a zero-width ring fails validation
with a message explaining why.