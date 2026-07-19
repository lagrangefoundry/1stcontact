---
uid: acceptance_criterion-0e963745
id: AC-671
type: acceptance_criterion
title: navCollapse dial selects the header nav collapse breakpoint
created_by: xgd
created_at: '2026-07-19T03:21:13.374013+00:00'
updated_at: '2026-07-19T03:21:13.374013+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
The header exposes a `navCollapse` dial accepting sm / md / lg / xl / none, defaulting to md. Below the selected breakpoint width the header navigation is hidden and a hamburger toggle is shown; at/above it the full nav is shown and the toggle hidden. `none` never collapses (nav always shown). The default `md` collapses below 768px.

## Verification
Render the header at widths straddling the chosen breakpoint (e.g. navCollapse=lg: at 900px the nav is hidden and the toggle visible; at 1100px the nav is visible and the toggle hidden). Confirm `none` keeps the nav visible at the narrowest width, and that omitting the dial collapses below 768px.
