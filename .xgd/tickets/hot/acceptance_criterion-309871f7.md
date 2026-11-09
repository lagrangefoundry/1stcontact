---
uid: acceptance_criterion-309871f7
id: AC-2524
type: acceptance_criterion
title: Ladder widths are the conventional rungs strictly below the source width; nothing
  is upscaled and a picture no wider than 320px gets no renditions
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:20:45.332291+00:00'
updated_at: '2026-11-09T06:30:49.966432+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

A picture's ladder is every conventional width — 320, 640, 960, 1280, 1600 and
1920 — that is *strictly below* the picture's own measured width, plus the
original at its own width as the top rung. No rendition is ever wider than the
original: a 600px picture gets a 320 rendition and itself; a 5000px photograph
gets all six and itself.

A picture no wider than the smallest rung (320px or narrower, a picture of
exactly 320px included) gets no resized renditions at all and is served as it
is.

## Verification

Publish pictures measured at 300, 320, 600 and 5000 pixels wide. Assert the 300
and 320 pictures produce no renditions; the 600 picture produces exactly a 320
rendition; the 5000 picture produces exactly the six conventional widths; and no
rendition's width exceeds its source's.