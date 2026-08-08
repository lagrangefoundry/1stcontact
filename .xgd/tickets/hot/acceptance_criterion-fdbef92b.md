---
uid: acceptance_criterion-fdbef92b
id: AC-820
type: acceptance_criterion
title: 'Interaction and entrance axes admit typed values only: a document naming a
  selector, a style string, a raw timing curve, an unsafe URL, an unknown state or
  an out-of-range duration is rejected with a message naming the offending field'
created_by: xgd
created_at: '2026-08-06T02:02:59.312640+00:00'
updated_at: '2026-08-08T00:42:44.619320+00:00'
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
A site definition whose interaction or entrance declaration carries anything
other than the typed vocabulary fails validation, and the reported error names
the offending field path and why it was refused. Each of the following is
rejected:

- a selector or style declaration smuggled in as a key or value (for example a
  state carrying a pseudo-class name, a raw style string, or a colour expressed
  as CSS text rather than a hex literal);
- a timing curve outside the closed set of named curves (a hand-written
  cubic-bezier is refused);
- a background image URL inside a hover or focus state whose scheme is outside
  the allowlist that guards every other image URL — a hole that opens only on
  pointer-over is still a hole;
- a state name the vocabulary does not define;
- a transition, entrance or stagger duration outside the permitted range, and a
  focus-ring width that is zero or negative.

A site definition using only the typed vocabulary within range validates and
renders. No value from the definition reaches the published page as raw style,
markup or script through either axis.

## Verification
Validate a set of hostile site definitions, each carrying exactly one of the
refusals above, and assert every one fails with an error naming its field path.
Validate the well-formed equivalent and assert it passes and renders. Inspect
the published output of the well-formed page and assert no instance-supplied
string appears as raw style, markup or script.