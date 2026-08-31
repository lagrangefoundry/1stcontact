---
uid: acceptance_criterion-1fd2d4da
id: AC-924
type: acceptance_criterion
title: Every key a deploy writes is scoped to the store tree the definition came from
created_by: xgd
created_at: '2026-08-06T20:15:29.091038+00:00'
updated_at: '2026-08-16T07:23:26.488311+00:00'
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

Every object a deploy writes to shared storage is addressed under the store tree
the site definition was loaded from — the site's snapshot objects, the site's
deploy index, and the snapshot prefix the result and the report name. Deploying a
site from the throwaway scratch tree therefore writes nothing whatsoever under
the real-sites tree, even when a real site and a scratch site share the same
slug: no snapshot object, no index write, no read of the other tree's index.

## Verification

Create two sites with the same slug, one in each store tree, and deploy the
scratch one. Assert that after the deploy no object at all exists under the
real-sites tree, that every key the deploy reports having written is under the
scratch tree, that the snapshot prefix the result reports names that tree, and
that reading back the entry page under the scratch prefix yields the scratch
site's real rendered markup.