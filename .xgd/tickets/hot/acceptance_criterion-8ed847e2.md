---
uid: acceptance_criterion-8ed847e2
id: AC-425
type: acceptance_criterion
title: Valid site definition validates and returns the site value
created_by: xgd
created_at: '2026-07-08T19:13:06.567608+00:00'
updated_at: '2026-07-08T19:13:06.567608+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
A structurally valid site definition validates successfully. This holds across the range from a minimal site (a single page containing a single module instance) up to a full site that exercises every theme-token slot, a navigation config, multiple pages and module instances, and assets. The verdict reports success, and the success result carries the validated site definition as its value (matching the submitted structure).

## Verification
Submit both a minimal and a full site definition to the validator. Assert the result reports success and that the returned value reproduces the submitted site (all pages, modules, theme tokens, nav, and assets present).
