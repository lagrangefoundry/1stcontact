---
uid: acceptance_criterion-fdcec177
id: AC-897
type: acceptance_criterion
title: Deploying the published channel for a site with no revisions is refused by
  name, and writes nothing
created_by: xgd
created_at: '2026-08-06T18:39:40.370555+00:00'
updated_at: '2026-08-16T07:23:17.103759+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A published-channel deploy for a site whose publish history is empty fails with
an error that states the site has no revisions to deploy and directs the operator
to the publish command by name, explaining that publish mints the revision and
deploy ships it. The refusal happens before any work: no objects are written to
shared storage and no deploy index is created.

## Verification

On a freshly created, never-published site, run the deploy command with the
published channel. Assert the command fails, that its message names the publish
command, and that shared storage is completely empty afterwards.