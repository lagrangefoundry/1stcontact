---
uid: acceptance_criterion-285b8c08
id: AC-972
type: acceptance_criterion
title: Publishing from the workspace produces a new revision of the displayed site
  through the platform's existing publish path, and the published result is served
created_by: xgd
created_at: '2026-08-07T01:44:45.365275+00:00'
updated_at: '2026-08-07T21:19:43.776902+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Invoking publish from the workspace publishes the site currently displayed —
not a default or previously selected one — producing a new entry in that site's
revision history with the same semantics as publishing from the command line,
and the published channel is rendered and subsequently served by the workspace
origin. No publish semantics exist only in the workspace.

## Verification

Select a site in the workspace, invoke publish, and assert: a new revision is
appended to that site's history, the revision is locked in the same form as a
command-line publish produces, the published channel's rendered output exists,
and requesting the published channel over the origin returns it. Select a
different site first and assert the revision is created for that site.