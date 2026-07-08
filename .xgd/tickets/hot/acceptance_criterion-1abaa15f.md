---
uid: acceptance_criterion-1abaa15f
id: AC-432
type: acceptance_criterion
title: Navigation entry targets are accepted for each target kind
created_by: xgd
created_at: '2026-07-08T19:13:41.531777+00:00'
updated_at: '2026-07-08T19:13:41.531777+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
Navigation entry targets are accepted for each of the three recognized target kinds: a page reference (targeting a page), an in-page anchor reference (targeting a page and a module within it), and an external url reference (targeting an href). A site whose nav entries use these three kinds, with the fields required by each kind present, validates successfully.

## Verification
Submit a site whose navigation entries include one target of each kind (page, anchor, url) with the fields each kind requires. Assert the result reports success.
