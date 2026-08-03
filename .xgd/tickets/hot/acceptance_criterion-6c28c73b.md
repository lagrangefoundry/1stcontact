---
uid: acceptance_criterion-6c28c73b
id: AC-781
type: acceptance_criterion
title: Oracle text covered by a mounted behaviour slot is set aside and counted on
  the gate report, not graded and not dropped
created_by: xgd
created_at: '2026-08-03T02:48:57.003567+00:00'
updated_at: '2026-08-03T03:16:07.701112+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-24098299
  kind: behavior
  regression_only: false
---

## Criterion
Oracle text that a **mounted behaviour covers** is set aside into a reporting class of
its own — neither graded as a fidelity gap nor silently dropped.

- **Set aside.** An oracle sample with no reproduced leaf left to pair with, whose
  captured box centre falls inside the evaluated rect of a behaviour slot in the
  reproduced document at that width, is recorded as a `mounted` entry (its text and
  the width) instead of an `unmatched` entry. The text is rendered by the mounted
  behavior module, not by L1, so the L1 fidelity measure is not the right instrument
  for it — grading it would fail a *correct* reproduction (the reference's own submit
  chip, lifted into the form's slot, is the canonical case).
- **Still measured where it pairs.** Only unpairable oracle text is set aside; oracle
  text inside a slot rect that does pair with a reproduced leaf is compared and can
  still surface as a residual. An unpairable sample outside every slot rect is still
  reported as `unmatched`.
- **Counted, never dropped.** The probe report exposes the set-aside entries as their
  own list, and the gate's human-readable output states their count on the
  sample-fidelity line, labelled as covered by a mounted behaviour, alongside — not
  merged into — the residual and unmatched counts. A mounted region is therefore
  legible as an ungraded region of known size rather than an invisible hole.
- **Does not fail the gate.** The verdict remains residuals-empty and unmatched-empty;
  set-aside entries do not flip `pass`, so a reproduction that mounts the reference's
  controls into a slot can pass while reporting what it did not grade.

## Verification
Fold a capture whose control text is lifted into a behaviour slot and run the gate:
assert that text appears in the set-aside list with its width, appears in neither the
residual nor the unmatched list, and that the gate passes. Assert the human-readable
gate output states the set-aside count on the sample-fidelity line, distinct from the
residual and unmatched counts, and omits it when nothing was set aside. Assert an
unpairable oracle run positioned outside every slot rect is still reported as
unmatched, and that oracle text inside a slot rect that does pair with a reproduced
leaf is still graded (a perturbed box surfaces as a residual).