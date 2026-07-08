---
uid: acceptance_criterion-03291b23
id: AC-430
type: acceptance_criterion
title: Duplicate structural identifiers are rejected
created_by: xgd
created_at: '2026-07-08T19:13:36.463712+00:00'
updated_at: '2026-07-08T19:13:36.463712+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6fc151b1
  kind: behavior
  regression_only: false
---

## Criterion
Structural uniqueness is enforced. A site in which two module instances share the same id within a single page is rejected, and a site in which two pages share the same slug is rejected. In each case the verdict reports failure with an error whose path locates the duplicate occurrence, and the message identifies it as a duplicate.

## Verification
Submit (a) a page containing two modules with the same id and (b) a site containing two pages with the same slug. Assert each result reports failure with an error path locating the duplicate.
