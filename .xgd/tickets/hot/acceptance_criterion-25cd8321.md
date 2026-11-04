---
uid: acceptance_criterion-25cd8321
id: AC-2243
type: acceptance_criterion
title: A site's revision id and its change-journal counter remain integer ordinals
created_by: xgd
created_at: '2026-11-04T16:01:06.662714+00:00'
updated_at: '2026-11-04T16:01:06.662714+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

The opaque-key rule applies to identity, not to order. A site's **revision id** is an integer that increases with each publish (live is the highest), and a site's **change-journal position** is an integer counter. Neither is replaced by an opaque id, because their ordering is their meaning. Both are scoped by the site's key.

## Verification

Publish a site twice and assert revision ids are consecutive integers with live the highest. Apply two changes and assert their journal positions are increasing integers. Inspect the baseline schema and assert both columns are integer-typed.