---
uid: acceptance_criterion-18429ea9
id: AC-571
type: acceptance_criterion
title: New-axis structural deltas (z-order, treatment, media, transform/motion) and
  own-render preconditions (viewport, overflow, font-load) with multi-state cell pairing
created_by: xgd
created_at: '2026-07-10T01:47:21.154881+00:00'
updated_at: '2026-07-10T01:47:21.154881+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
Beyond the value-level fields, the diff compares the enriched rendered projection and emits new delta kinds, each at its fixed tier: **z-order** (HIGH) when a paired element's effective paint order differs; **treatment** (MEDIUM, presence-based) when a filter/halo, text-shadow/glow or mask/clip edge is present on one side and absent on the other; **media** (HIGH) when a photo child's object-fit differs or its rendered aspect ratio drifts more than ~10% (circle-vs-ellipse); **transform** (HIGH) when rotation differs by more than ~2° or uniform scale by more than ~0.05, plus **motion** (MEDIUM, presence) when declared animation/transition differs. Three own-render preconditions are also checked: a CRITICAL **viewport-mismatch** when the two sides were shot at different widths (the diff below it cannot be trusted), a HIGH **horizontal-overflow** delta for any element whose right edge exceeds the viewport width, and a HIGH **font-load** delta for any element that fell back from its intended face. A multi-state diff pairs reference↔repro cell-for-cell on `{engine, viewport-width, interaction-state}`, diffs each cell in isolation, and surfaces any reference cell the repro never projected as an explicit missing-cell coverage gap rather than counting it clean.

## Verification
Project two manifests differing in exactly one enriched axis at a time (z-order, object-fit/aspect, rotation/scale, motion) and assert a delta of the matching kind and tier is emitted; shoot the two sides at different viewport widths and assert a CRITICAL viewport delta leads; give a manifest an element wider than its viewport and assert a horizontal-overflow delta; run a multi-state diff where the repro omits one `{engine,width,state}` cell present in the reference and assert that cell is reported missing.
