---
uid: acceptance_criterion-917809a8
id: AC-2133
type: acceptance_criterion
title: An unaccepted admitted person's non-navigation requests (assets, scripts, API)
  are refused 403 plain text
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:39:50.689063+00:00'
updated_at: '2026-11-01T10:39:50.689063+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0cd18650
  kind: behavior
  regression_only: false
---

## Criterion
For an admitted person who has not accepted the current terms, every request that is not a page navigation is refused with status 403, content type `text/plain`, and a body explaining that the terms of service have not been accepted and directing the person to `/terms`. This covers builder assets, module scripts, images, API routes, and non-GET/HEAD methods. No builder asset or API data is served. A request counts as a page navigation only if it is GET/HEAD and either carries `Sec-Fetch-Dest: document` or has an `Accept` header naming `text/html`. A wildcard-only `Accept` (e.g. `*/*`) and requests with neither signal are treated as non-navigations and refused.

## Verification
As an admitted, unaccepted person, request a builder asset, a module script (`Sec-Fetch-Dest: script`), an image, an API route (e.g. `/api/businesses`), and a GET with only `Accept: */*`. Assert each returns 403 text/plain with the explanation mentioning `/terms`, and that the recognisable assets-binding body never appears. Then show that the same GET with `Accept: text/html` (no Sec-Fetch-Dest) receives the terms page.
