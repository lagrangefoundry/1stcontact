---
uid: acceptance_criterion-48e04041
id: AC-895
type: acceptance_criterion
title: A draft deploy never mints a revision number and never enters publish history
created_by: xgd
created_at: '2026-08-06T18:39:30.972034+00:00'
updated_at: '2026-08-16T07:23:14.808846+00:00'
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

Deploying a draft produces a shareable snapshot that costs the site nothing in
its publish record. After any number of draft deploys: the site's publish history
is unchanged (no new revision), the deploy index lists no revisions and its live
pointer remains unset (for a site that has never published), and the returned
result reports no revision number. The mutable-draft / immutable-revision split
is preserved — a preview is addressed by content id only.

## Verification

Deploy a never-published site as a draft, twice, with a change in between.
Assert the site's revision listing is still empty, the deploy index's revision
list is empty and its live pointer is unset, and each deploy result carries no
revision number while still returning a working preview URL.