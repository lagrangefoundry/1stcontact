---
uid: acceptance_criterion-16093733
id: AC-1327
type: acceptance_criterion
title: The draft preview, pages and assets alike, is served from whichever store rendered
  it
created_by: xgd
created_at: '2026-08-20T05:10:41.587411+00:00'
updated_at: '2026-08-20T16:24:39.999786+00:00'
completed_at: null
last_field_updated: body
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
- The preview re-asks the store on each request; its memoised render is invalidated by the
  store's own stamp rather than held, so what is served follows the definition the store
  currently holds.

The operator-visible freshness outcome that follows from this — that a definition changed
outside the builder is what the next request shows, with no restart — is **not** this
capability's claim to prove. It is CAP-85's, delivered by REQ-119 (`request-64864801`,
2026-07-31, "Request-time draft and edit renders inside control-app") and already carried by
AC-1033 (`acceptance_criterion-ae33f0ab`). This capability owns only the store-shaped half:
that the preview asks the store again, and trusts the store's stamp to decide whether its
cached render still describes what the store holds. STORY-118's Technical Context states the
division in terms — "CAP-85's builder origin owns request confinement and freshness, not the
store's shape".

## Verification

Point the preview at a store with no filesystem behind it, request a draft page, and assert
HTML comes back. Request a draft asset and assert the response carries the asset's exact bytes
and the expected content type. Request an asset name the store does not hold and assert nothing
resolves. Change the definition the store holds and assert the store answers with a different
stamp and the next request re-renders rather than serving the cached entry — asserting the
cache-invalidation path, not the end-to-end freshness outcome AC-1033 proves.
