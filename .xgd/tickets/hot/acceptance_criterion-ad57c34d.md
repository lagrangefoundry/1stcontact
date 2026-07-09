---
uid: acceptance_criterion-ad57c34d
id: AC-493
type: acceptance_criterion
title: A reduced-motion preference disables all motion and forces scroll-revealed
  content visible
created_by: xgd
created_at: '2026-07-09T20:52:32.126179+00:00'
updated_at: '2026-07-09T20:52:32.126179+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b13e15c5
  kind: behavior
  regression_only: false
---

## Criterion
The per-site stylesheet includes a reduced-motion block, active under the operating-system "reduce motion" preference, that disables every motion animation and transition and forces any scroll-revealed element to its visible end-state. No content is ever trapped in an unplayed (hidden) motion state for a reduced-motion user.

## Verification
Render a site containing load, scroll, hover, and stagger motions. Assert the per-site stylesheet contains a reduced-motion media block that neutralizes animation/transition for the motion elements and sets scroll-revealed elements visible. Confirm scroll content that starts hidden is made visible under this block.
