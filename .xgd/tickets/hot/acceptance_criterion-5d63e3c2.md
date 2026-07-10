---
uid: acceptance_criterion-5d63e3c2
id: AC-569
type: acceptance_criterion
title: Capture applies fonts-ready and reduced-motion timing preconditions for a deterministic
  projection
created_by: xgd
created_at: '2026-07-10T01:23:29.592023+00:00'
updated_at: '2026-07-10T01:23:29.592023+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
Before reading rendered signals, the capture applies two timing preconditions so the projection is deterministic and not contaminated by transient state: after the page reaches network idle it awaits `document.fonts.ready` (a FOUT guard, so the intended web fonts have loaded before styles are measured), and it emulates `prefers-reduced-motion: reduce` (so animations collapse to their end state and the projection reads identically frame-to-frame rather than catching a mid-animation frame).

## Verification
Capture a page that loads a custom web font and declares an entrance animation/transition. Assert the captured content runs record the intended painted font metrics and `fontLoaded: true` (rather than fallback metrics from a pre-load frame), and that repeated captures of the animated page yield an identical projection (the motion is frozen to a single deterministic state), demonstrating the reduced-motion emulation and the fonts-ready wait are in effect.
