---
uid: acceptance_criterion-16093733
id: AC-1327
type: acceptance_criterion
title: The draft preview, pages and assets alike, is served from whichever store rendered
  it
created_by: xgd
created_at: '2026-08-20T05:10:41.587411+00:00'
updated_at: '2026-08-20T05:24:45.692800+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3f4a5f2b
  kind: behavior
  regression_only: false
---

## Criterion

The builder's preview of a draft is served from whichever store rendered it.

- A preview request for a draft page renders from the store the builder was given, with no
  filesystem tree required.
- A preview request for a draft asset resolves to that asset's bytes together with a content
  type derived from its name.
- A request naming an asset the store does not hold resolves to nothing, rather than to an
  error or to an empty file.
- A change made to the draft outside the builder is picked up on the next request, without the
  server being restarted.

## Verification

Point the preview at a store with no filesystem behind it, request a draft page, and assert
HTML comes back. Request a draft asset and assert the response carries the asset's exact bytes
and the expected content type. Request an asset name the store does not hold and assert nothing
resolves. Mutate the draft through the editing surface and assert the next preview request
reflects it without a restart.