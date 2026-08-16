---
uid: acceptance_criterion-8b83dcaa
id: AC-1101
type: acceptance_criterion
title: A component's configuration is merged on reconfigure, and removing an instance
  leaves its mount seam in place
created_by: xgd
created_at: '2026-08-10T09:34:18.296089+00:00'
updated_at: '2026-08-16T01:57:12.210590+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Reconfiguring a named component on a page merges the settings given into its existing configuration — only what is named changes — and the merged result is re-checked against the kind's contract before it is stored. Removing a named component takes only that instance off the page; the seam it was mounted at remains, empty, so another component can be mounted there. Naming a component that is not on the page fails with a not-found error for either operation.

## Verification
Add a component with two configured settings, reconfigure one, and read the page back: the changed setting has the new value and the other is unchanged. Remove the component and read the page back: the instance is gone and the element that was its mount seam is still present in the page's element map. Reconfigure and remove a name that does not exist: both fail with not-found.