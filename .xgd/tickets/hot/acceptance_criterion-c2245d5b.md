---
uid: acceptance_criterion-c2245d5b
id: AC-574
type: acceptance_criterion
title: 'Anti-self-grading calibration oracle: one seeded defect per fidelity axis
  must fire before a clean verdict is trusted, naming any blind axis'
created_by: xgd
created_at: '2026-07-10T01:47:32.789968+00:00'
updated_at: '2026-07-10T01:47:32.789968+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
Because a severity verdict authored and read by the same party that built the reproduction is self-certification, the gate provides an independent calibration oracle that must be run before a clean ("0 deltas") verdict is trusted. The oracle holds a faithful baseline and a fixed table of known defects — one per fidelity axis the gate claims to cover (missing element, casing, position, colour, z-order, media/ellipse, missing child, lost treatment, mis-rotation, lost motion, font-fallback, overflow, viewport) — each paired with the delta kind the gate must emit. Seeding each defect into a faithful render and running the diff reports, per defect, whether the gate fired. A guard reports the discriminator as calibrated only when every seeded defect fired, and returns the per-defect results so a caller can name any blind axis (a defect that did not fire) rather than silently absorb it into a passing score.

## Verification
Run the calibration oracle against a faithful baseline and assert every seeded defect fires and the discriminator reports calibrated; disable the comparison for one axis and assert the corresponding defect is reported as not fired and the discriminator reports not-calibrated, naming that axis.
