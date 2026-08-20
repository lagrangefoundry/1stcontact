---
uid: acceptance_criterion-1eaa93b8
id: AC-716
type: acceptance_criterion
title: L1 leaf axes carry the absolute literal as the base of the value model, validated
  by the envelope
created_by: xgd
created_at: '2026-07-22T20:28:07.019876+00:00'
updated_at: '2026-08-20T08:03:30.138443+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The absolute (literal) value is the **base** of the value model: it is carried
directly by the L1 leaf axes, with no named scale interposed, and it is guaranteed
well-formed by the envelope validator rather than by convention.

The length / geometry / radius half is where that base stands alone — those axes
are **literal-only**, and no named scale exists for them:

- A length / geometry / radius axis accepts a finite numeric px literal, which is
  emitted verbatim, so a captured site's concrete measurements land exactly as
  measured with no inference and nothing rounded to a step.
- The envelope validator rejects such a value when it is non-finite or out of
  range (font-size 1–400, geometry ±100k, length within envelope bounds). The
  bound is the validator's, not the emitter's — an out-of-range *document* is
  refused rather than silently clamped into shape.

Colour is the one axis whose base has since been widened to a second admissible
form. Which forms a colour axis accepts, and how a palette reference resolves, are
**not** this criterion's subject: AC-928 owns the accepted forms and AC-931 owns
the widening's effect on a literal-only document. What this criterion asserts of
colour is only that the hex literal remains the base form on the leaf axis itself.

## Verification

Author (or fold from a capture) an L1 document whose leaf axes set distinct
absolute length / geometry / radius literals; validate and render it, and confirm
each literal is carried through verbatim to the emitted CSS, with no scale name,
step or token appearing anywhere on the path. Confirm the envelope validator
rejects a non-finite and an out-of-range number on those axes. Detailed L1 axis and
envelope behaviour is owned by the L1 substrate story; the colour value model is
owned by AC-928 / AC-931.
