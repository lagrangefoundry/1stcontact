---
uid: acceptance_criterion-16093733
id: AC-1327
type: acceptance_criterion
title: The draft preview, pages and assets alike, is served from whichever store rendered
  it
created_by: xgd
created_at: '2026-08-20T05:10:41.587411+00:00'
updated_at: '2026-08-20T16:32:22.841230+00:00'
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

Nothing about the preview's *freshness* is this capability's claim to prove — neither the
operator-visible outcome (a definition changed outside the builder is what the next request
shows, with no restart) nor the mechanism beneath it (a render memoised per `(slug, channel)`,
invalidated by the store's stamp checked before the cache is read, and a store re-asked on
each request). All of it is CAP-85's, delivered by REQ-119 (`request-64864801`, 2026-07-31,
"Request-time draft and edit renders inside control-app") and already carried by AC-1033
(`acceptance_criterion-ae33f0ab`), which holds `uat_coverage: pass`. The cache, its
stamp-based invalidation rule and the per-request re-ask are all present verbatim in
`2b902ead0^:tools/generate/src/cli/preview.ts` — the commit immediately before the port
landed — so the port neither introduced nor changed them; it moved the interface they read
through from `DraftStore` to `SiteStore`. STORY-118's Technical Context states the division in
terms: "CAP-85's builder origin owns request confinement and freshness, not the store's
shape". The port's one genuine contribution on this axis is that `loadDraft` now *answers*
with a stamp, and AC-1321 already owns exactly that.

## Verification

Point the preview at a store with no filesystem behind it, request a draft page, and assert
HTML comes back. Request a draft asset and assert the response carries the asset's exact bytes
and the expected content type. Request an asset name the store does not hold and assert nothing
resolves.
