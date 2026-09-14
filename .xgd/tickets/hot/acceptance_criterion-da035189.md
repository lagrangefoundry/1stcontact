---
uid: acceptance_criterion-da035189
id: AC-1782
type: acceptance_criterion
title: The pixel-comparing verbs produce the same verdicts, ranked regions and band
  statistics as before the image layer changed
created_by: martin-github@westhead.me
created_at: '2026-09-14T05:05:47.612250+00:00'
updated_at: '2026-09-14T05:05:47.612250+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-046cfc56
  kind: behavior
  regression_only: false
---

## Criterion
Given the same pair of images, `1c diff` reports the same mean difference, the same
horizontal band profile, the same percentage of pixels over threshold, the same
image dimensions, and the same regions with the same bounding boxes and the same
ranking, as it reported before the image layer moved in-repo. `1c aligned-crops`
likewise produces the same drift-aligned crop pairs from the same bundle.

This is the load-bearing promise of the change: these numbers are what `1c gate`
reconciles against the value diff and the L1 gate to choose between
`capture-incomplete`, `reproduction-wrong` and `unexplained-disagreement`, so a
shift of one would make every fidelity result recorded to date incomparable with
every result after — silently, because the new numbers would look just as
plausible.

## Verification
The pre-existing diff and aligned-crops acceptance tests — written against the
previous image layer and unchanged by this work — continue to pass unmodified on
the same inputs and with the same expected values. Together with the byte-identical
decode, that is the whole claim: same pixels in, same arithmetic, same verdicts
out.
