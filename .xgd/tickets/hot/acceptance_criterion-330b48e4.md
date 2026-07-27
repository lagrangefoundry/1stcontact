---
uid: acceptance_criterion-330b48e4
id: AC-705
type: acceptance_criterion
title: Sample-fidelity probe matches reproduced boxes to the oracle at every captured
  width within tolerance
created_by: xgd
created_at: '2026-07-22T20:07:08.347043+00:00'
updated_at: '2026-07-27T20:38:21.197614+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Given a reproduced site definition and its retained capture oracle, the sample-fidelity
probe reports pass = true with an empty residual list and an empty unmatched list
exactly when, at every captured width, each oracle text sample's box (x, y, width) is
within the per-axis tolerance (default 2px) of the box of the reproduced text run it is
paired with.

**Pairing rule (per captured width).** Oracle samples and reproduced text runs are
keyed by normalized text and paired by **occurrence index in document order**: the
k-th oracle sample carrying a given text pairs with the k-th reproduced run carrying
that text. Consequences, all observable in the report:

- A page carrying the same label/CTA N times yields N independent comparisons — each
  occurrence is compared against its own box, never against a sibling's, so repeated
  text produces no phantom deltas at the sampled widths.
- When a key's reproduced runs are exhausted before its oracle occurrences, each
  surplus oracle occurrence is reported as exactly one unmatched entry (text, width) —
  a genuine coverage gap — instead of being re-paired against an already-consumed box;
  the key's other occurrences still pair cleanly.
- Drift affecting only one occurrence of a repeated key is reported as exactly one
  residual naming that occurrence's width and per-axis deltas; it is not absorbed by a
  nearest-box or last-writer match.
- Pairing is order-defined on both sides, so the verdict is reproducible run to run.

Report shape:
- Any paired run whose box exceeds tolerance on any axis is reported as a residual
  carrying the run text, the width, and the per-axis deltas (dx, dy, dw).
- Any oracle sample with no reproduced run left to pair with is reported as an
  unmatched entry (text, width).
- If either the residual list or the unmatched list is non-empty, pass = false.
- The report also exposes the largest observed per-axis delta.

This rule governs the L1 reproduction gate. The `1c values-diff` fidelity pipeline
pairs duplicate text by its own (positional) rule and is unaffected by this criterion.

## Verification
Fold a fixture multi-width capture into a reproduced document and run the probe against
the same capture as oracle: assert pass = true, empty residuals, empty unmatched, and
max delta within tolerance, and that all captured widths were checked. Perturb one
reproduced box beyond tolerance and assert it surfaces as a residual with the correct
deltas and pass = false; drop a run and assert it surfaces as unmatched.

Repeated text: fold a capture whose every ladder width carries the same label three
times at distinct y positions and assert the probe gates clean (pass = true, empty
residuals and unmatched, max delta within tolerance). Add a fourth oracle occurrence of
that label at one width and assert exactly one unmatched entry (that text, that width)
with no residuals and the three genuine occurrences still clean. Shift only the middle
occurrence of that label at the widest width by 30px and assert exactly one residual,
naming that text and width, with dy = 30.
