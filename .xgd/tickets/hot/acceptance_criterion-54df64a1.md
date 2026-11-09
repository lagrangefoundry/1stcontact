---
uid: acceptance_criterion-54df64a1
id: AC-2525
type: acceptance_criterion
title: Renditions are content-addressed on source bytes and width; republishing an
  unchanged picture performs no transform
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:20:47.518444+00:00'
updated_at: '2026-11-09T06:30:49.461733+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

A rendition is named for the source picture's bytes and the width it was
rendered at (`<sha>-<width><ext>`), so identical bytes at the same width always
have the same name, and different bytes or a different width always a different
one. Because a recipe change re-promotes new bytes, a recipe change yields new
names by construction.

Renditions already built are kept in a cache scoped to the publishing business
and held outside anything a published URL can reach. A publish looks there
before transforming. Republishing a site whose pictures have not changed — and
publishing a second revision that keeps the same pictures — performs no
transform and still writes every rendition into the new revision. One business's
cache never answers for another's.

## Verification

Publish a site with one wide picture through a counting fake renderer, then edit
something other than the picture and publish again. Assert the second publish
performs zero transforms, and that the second revision holds the same rendition
names and bytes as the first. Replace the picture's bytes and publish again;
assert new names and new transforms. Assert the cache keys sit under the
business's own prefix, outside the published output.