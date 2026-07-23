---
uid: request-7a6766b0
id: REQ-92
type: request
title: Rebuild foldToL1 to populate the full L1 language (image/box/container + all
  axes), signalling residuals
created_by: xgd
created_at: '2026-07-23T02:02:03.084523+00:00'
updated_at: '2026-07-23T04:59:49.872761+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 9e92a3397e2108dba60d5955a46e577ddd7da12f
    reconcile_sha: null
    main_sha: null
  version: 0.0.177
  story_points: 3
---

Scope under [[request-7ff1bacd]] (REQ-88). The folder is the **narrowest link**;
rebuild it **once** against the completed language (do not build it twice). See
[[DOC-27]], [[DOC-21]] (growth loop).

## Dependencies (do these first)
- [[bug-5b7153d2]] (B1) — trustworthy fidelity/idempotency measurement.
- The language-form ticket (font/asset resource table).
- The language-power ticket (pixel-mover axes).
- [[bug-d18ad577]] (B3) — analytic row/flow layout, before the folder emits rows.
- [[bug-b9eb2e3a]] (B2) — signal-not-drop, baked into this rebuild.

## Behavior (request)
Today `foldToL1` (tools/generate/src/l1/fold.ts) emits only text leaves with ~9
axes, discarding images, fields, surfaces, containers and ~30 captured axes —
including several the language already supports. Rebuild it to fold the **full**
value set into the full language:
- **image** leaves (RawImage; fields' objectFit/intrinsicAspect, extract.ts:137).
- **box** surfaces (surfaceFill/gradient/border/shadow/scrim) where a band/panel
  paints.
- **container** structure where recovered (with B3's corrected flow model).
- carry every flat axis the language now supports.
- emit **residuals** (B2) for anything still unexpressed.

## Approach (avoid corners)
Increment 1: emit `image` leaves (already language-supported) to validate the
folder architecture end-to-end. Then extend to the new axis families as they land.
Co-designed against gigabytealchemy/joyful captures.

## Acceptance
Idempotency (B1 suite) holds on the richer folds at all sampled widths; images,
surfaces, fields reproduce; residual list is empty for captured pixel-movers the
language now covers; l1-gate reflects real fidelity. Tests named
`test_UAT_FC_<this-ticket>_*`.

-