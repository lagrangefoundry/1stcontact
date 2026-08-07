---
uid: acceptance_criterion-76d3ad8f
id: AC-977
type: acceptance_criterion
title: Every response the workspace origin returns is served as non-cacheable, including
  the workspace document itself
created_by: xgd
created_at: '2026-08-07T01:45:07.830525+00:00'
updated_at: '2026-08-07T21:19:48.514630+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Every response from the workspace origin — the workspace document, the browser
source, the component modules, the client code served for the editing gesture,
every rendered channel page and asset, and the answers to the operations the
origin carries — carries a directive forbidding cache storage. Refusals count as
responses: a stale error is an error the operator cannot clear. There is no
exempt response: the origin rewrites its own bytes underneath the browser, and a
single cacheable response is enough to leave an operator looking at a stale page
that appears to be working.

## Verification

Request a route from every class the origin serves — the workspace document, the
browser source, a served component, the served client code, a rendered page in
each channel, and each operation the origin answers (the store listing, the
asset listing, an address read) — and assert every response carries a no-store
cache directive. Assert on the header alone, not on a success status, and
include refusals (a request missing a required parameter, an unknown channel, a
route that does not exist) so the responses a 200-only probe skips past are
covered. Include the workspace document explicitly, since it is hand-written and
does not travel the same file-sending path as the rest.