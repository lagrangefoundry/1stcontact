---
uid: acceptance_criterion-ecdc5f9e
id: AC-2335
type: acceptance_criterion
title: A session-dependent response is private, no-store, varies on cookie, carries
  no etag and never touches the shared cache; a page without the chrome is unchanged
  and stays shared-cacheable
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T06:56:55.229422+00:00'
updated_at: '2026-11-07T06:56:55.229422+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d34eccd8
  kind: behavior
  regression_only: false
---

## Criterion

A response for a page carrying the account chrome depends on the visitor's session,
so it is never treated as a shared resource: it carries `cache-control: private,
no-store` and `vary: cookie`, carries no entity tag (the entity served is not the
entity stored), and is never stored in the shared edge cache. This holds whichever
state it names, including signed out.

A request that carries a session for the request's host is never answered from the
shared edge cache, for any path — what is stored there is the anonymous rendering.

A header-only request for an HTML path reports the length of the body that would
actually be served, not the stored object's length.

A page without the account chrome is unaffected by any of this: with or without a
session it is served byte-identical to its published bytes, keeps its entity tag,
carries the short public freshness policy, and remains storable in and answerable
from the shared edge cache. Non-HTML assets likewise keep their entity tag and
shared cacheability.

## Verification

Request a chrome-bearing page and assert `private, no-store`, `vary: cookie`, no
`etag`, and that nothing was stored in the shared cache. Prime the shared cache with
an anonymous response for a path, then request the same path carrying a session and
assert the response did not come from the cache. Issue a header-only request for a
chrome-bearing page and assert its declared length equals the length of the body a
fetch of the same URL returns. Request a page without the chrome with and without a
session and assert identical bytes, the stored entity tag, the public short
lifetime, and that the anonymous response was stored in the shared cache.
