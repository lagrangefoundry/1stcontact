---
uid: acceptance_criterion-65d0dd94
id: AC-962
type: acceptance_criterion
title: A component that is not installed produces a message naming the component and
  the command that installs it
created_by: xgd
created_at: '2026-08-07T01:44:00.714270+00:00'
updated_at: '2026-08-07T01:58:20.219527+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

When the workspace is started on a machine where one of the shared UI components
has not been installed, the failure names the specific missing component and
states the literal command that installs it. It does not fail with a generic
module-resolution error, and it does not serve a workspace document whose
components 404 in the browser.

## Verification

Ask the workspace for a component name that is not installed and assert the
resulting error message contains both the component's name and the install
command to run. Assert the message is raised at the single resolution point, so
every consumer of a component gets the same diagnostic rather than a different
error per call site.