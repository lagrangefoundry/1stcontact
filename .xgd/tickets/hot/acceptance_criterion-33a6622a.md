---
uid: acceptance_criterion-33a6622a
id: AC-894
type: acceptance_criterion
title: Every deploy renders first, so previously rendered output on disk can never
  be shipped
created_by: xgd
created_at: '2026-08-06T18:39:26.493395+00:00'
updated_at: '2026-08-07T22:18:06.826313+00:00'
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

There is no way to ship stale bytes: a deploy always re-renders from the current
site definition before hashing and uploading, and never treats existing local
rendered output as an input. If the local rendered output on disk disagrees with
the current site definition, the *uploaded* bytes reflect the current definition,
and the uploaded rendered output and uploaded definition agree with each other.

## Verification

Deploy a site, then change the site definition and overwrite the local rendered
output with deliberately stale content. Deploy again. Assert that the uploaded
entry page contains the new content and does not contain the stale content, that
the uploaded definition half carries the same new content, and that the local
rendered output on disk was itself refreshed by the deploy's own render.