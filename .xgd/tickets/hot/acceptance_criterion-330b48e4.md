---
uid: acceptance_criterion-330b48e4
id: AC-705
type: acceptance_criterion
title: Sample-fidelity probe matches reproduced leaf boxes to the oracle at every
  captured width within tolerance
created_by: xgd
created_at: '2026-07-22T20:07:08.347043+00:00'
updated_at: '2026-08-07T23:54:07.164983+00:00'
completed_at: null
last_field_updated: uat_coverage
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
exactly when, at every captured width, each oracle sample's box (x, y, width) is within
the per-axis tolerance (default 2px) of the box of the reproduced leaf it is paired
with.

**Which oracle samples are measured.** Each captured element is classified through the
same element classifier the fold uses, so an oracle sample exists exactly where the
fold emits a **measurable** leaf: text runs with non-empty text, images, and painted
surface boxes. Two kinds of captured element contribute no oracle sample and are
excluded from the fidelity measure entirely rather than counting as coverage gaps: an
empty run, which never becomes a leaf at all; and a form control, which since REQ-96
is no longer dropped but binds to its behavior module — it folds into that module's
mount seam rather than into a painted L1 leaf of its own, so the module owns its box
and the probe has nothing of its own to measure against.

**Pairing rule (per captured width).** Pairing is by **occurrence index in document
order** on both sides, within a key:

- **Text leaves** key on normalized text: the k-th oracle sample carrying a given text
  pairs with the k-th reproduced run carrying that text.
- **Image and box leaves** carry no text, so they key on leaf **kind**: the k-th
  image (respectively box) oracle sample pairs with the k-th reproduced leaf of that
  kind. A non-text residual or unmatched entry is labelled by its kind when the
  element has no text.

Consequences, all observable in the report:

- A page carrying the same label/CTA N times yields N independent comparisons — each
  occurrence is compared against its own box, never against a sibling's, so repeated
  text produces no phantom deltas at the sampled widths.
- When a key's reproduced leaves are exhausted before its oracle occurrences, each
  surplus oracle occurrence is reported as exactly one unmatched entry (text or kind
  label, width) — a genuine coverage gap — instead of being re-paired against an
  already-consumed box; the key's other occurrences still pair cleanly. This holds for
  non-text keys as it does for text.
- Drift affecting only one occurrence of a repeated key is reported as exactly one
  residual naming that occurrence's width and per-axis deltas; it is not absorbed by a
  nearest-box or last-writer match.
- Pairing is order-defined on both sides, so the verdict is reproducible run to run.

Report shape:
- Any paired leaf whose box exceeds tolerance on any axis is reported as a residual
  carrying the leaf's text (or kind label), the width, and the per-axis deltas
  (dx, dy, dw).
- Any oracle sample with no reproduced leaf left to pair with is reported as an
  unmatched entry (text or kind label, width).
- If either the residual list or the unmatched list is non-empty, pass = false.
- The report also exposes the largest observed per-axis delta, across text and non-text
  comparisons alike.

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

Non-text leaves and measured scope: fold a capture spanning every leaf kind the
classifier distinguishes — a text run, two images at well-separated y, a painted
surface panel, plus a form control and an empty run — and assert the reproduced tree
carries five leaves: one text, two images, one box, and the module mount seam the
control folded into, the empty run having produced none. Assert the probe gates clean on that capture: keying the
images by kind alone rather than by kind AND document-order occurrence would compare
the first image against the second's box and report a phantom delta, so a clean report
is the occurrence-pairing discriminator, and an empty unmatched list is the observable
proof that the control and the empty run were excluded from the measure rather than
counted as coverage gaps — the control's seam is present in the tree yet contributes
no sample, so it can neither be measured nor be missed. Perturb one image's oracle box
beyond tolerance at one width
and assert exactly one residual, labelled by kind, at that width with the correct
delta. Append a surplus oracle occurrence of a kind at one width — exhausting the
reproduced leaves of that kind — and assert exactly one unmatched entry labelled by
that kind at that width, with no residuals and the remaining occurrences still pairing
cleanly; assert this for the image kind and for the box kind alike.