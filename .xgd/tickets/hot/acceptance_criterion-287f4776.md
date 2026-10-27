---
uid: acceptance_criterion-287f4776
id: AC-2032
type: acceptance_criterion
title: Large pictures are reduced to a 1024px longest edge by averaging, and the text
  says so
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:19.099326+00:00'
updated_at: '2026-10-27T19:42:19.099326+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A picture whose longest edge exceeds 1024px reaches the model reduced so its longest edge is exactly 1024px with aspect ratio preserved, and its text block states the reduced size and '(reduced from W×H)' with the original size. A picture already within 1024px is passed through unchanged with no 'reduced from' note. Reduction averages source pixels: a 1-pixel high-contrast pattern reduces to the intermediate tone rather than to either extreme.

## Verification
Screenshot a 2048×512 picture and assert a 1024×256 image and the 'reduced from 2048×512' note; screenshot a 400×300 picture and assert identical bytes and no note. Reduce a 1-pixel black/white stripe image by 2× and assert the resulting pixels are mid-grey.
