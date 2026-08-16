---
uid: acceptance_criterion-b873d838
id: AC-901
type: acceptance_criterion
title: A deploy whose index changed underneath it fails loudly and leaves the index
  unclobbered
created_by: xgd
created_at: '2026-08-06T18:39:57.765801+00:00'
updated_at: '2026-08-16T07:23:25.386515+00:00'
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

The site's deploy index is read, modified and written as one operation guarded
against a lost update. If the stored index changed between the moment this deploy
read it and the moment it writes, the deploy fails with an error naming the site,
stating that another deploy is in flight and that nothing was written, and
directing the operator to re-run. The previously stored index is left exactly as
the other deploy left it — this deploy's version never overwrites it.

## Verification

Begin a deploy, mutate the stored deploy index out of band before the deploy's
index write, and let the deploy proceed. Assert the command fails, that the error
names the site and the re-run remedy, and that reading the stored index back
yields the out-of-band version rather than this deploy's.