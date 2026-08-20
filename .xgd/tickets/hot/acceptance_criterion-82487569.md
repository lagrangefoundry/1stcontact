---
uid: acceptance_criterion-82487569
id: AC-1241
type: acceptance_criterion
title: The toolbar's colour control opens the palette surface for the displayed site,
  in both viewing and editing channels
created_by: xgd
created_at: '2026-08-20T01:58:38.846426+00:00'
updated_at: '2026-08-20T01:58:38.846426+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

The builder's toolbar offers a colour-management control in **both** the viewing and the editing
channel, and activating it opens the palette surface for the site currently displayed in the
workspace. When no site is displayed, activating it opens nothing and reports nothing.

The control is one of the workspace's ordinary registered actions: it appears because the displayed
channel lists it, not because the toolbar special-cases it.

## Verification

With a site displayed in the viewing channel, activate the colour control and observe the palette
surface open bound to that site's slug; switch to the editing channel and observe the control still
offered, and opening again bound to the same site. Switch the workspace to a different site and
observe the surface open for the newly displayed one.

With the workspace displaying no site, activate the control and observe that no surface is opened
and no error is surfaced.
