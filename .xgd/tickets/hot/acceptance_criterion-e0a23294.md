---
uid: acceptance_criterion-e0a23294
id: AC-439
type: acceptance_criterion
title: Header renders logo and one nav link per entry with a responsive collapse below
  md
created_by: xgd
created_at: '2026-07-08T19:20:34.553683+00:00'
updated_at: '2026-07-08T19:20:34.553683+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Rendering the header (top-nav) with a logo and a list of navigation entries produces HTML that includes the logo and a navigable link for each provided entry (one anchor per entry pointing at that entry's target). The rendered markup also includes a hamburger toggle control that is hidden at desktop width and shown when the viewport is below the `md` breakpoint, so the navigation collapses responsively.

## Verification
Render the header with a logo and two or more nav entries. Assert the output contains the logo and one link per entry with the correct targets, and that it contains the hamburger toggle markup governed by a below-`md` breakpoint rule.
