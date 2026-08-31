---
uid: acceptance_criterion-76d3ad8f
id: AC-977
type: acceptance_criterion
title: Every response the workspace returns is served as non-cacheable through every
  front door, including the workspace document itself
created_by: xgd
created_at: '2026-08-07T01:45:07.830525+00:00'
updated_at: '2026-08-31T10:11:35.793500+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Every response the workspace returns — the workspace document, the browser
source, the component modules, the client code served for the editing gesture,
every rendered channel page and asset, every build artifact, and the answers to
the operations the workspace carries — carries a directive forbidding cache
storage. Refusals count as responses: a stale error is an error the operator
cannot clear. There is no exempt response: the workspace rewrites its own bytes
underneath the browser, and a single cacheable response is enough to leave an
operator looking at a stale page that appears to be working.

The directive belongs to the **route table**, applied once as a response leaves
it, and therefore to every front door the route table has rather than to any one
of them. That is the substance of this criterion rather than an implementation
note: while it was stated by the deployed host instead, the local front door —
which reaches the same routes directly — served the workspace document with no
directive at all. A per-host restatement is exactly as forgettable as a per-route
one, and the failure it produces is invisible.

## Verification

Request a route from every class the workspace serves — the workspace document,
the browser source, a served component or build artifact, a rendered page in each
draft-side channel, and each operation the workspace answers (the store listing,
the asset listing, an address read) — and assert every response carries a
no-store cache directive. Assert on the header alone, not on a success status,
and include refusals (a request missing a required parameter, an unknown channel,
a route that does not exist) so the responses a 200-only probe skips past are
covered. Include the workspace document explicitly, since it is composed rather
than read and does not travel the same path as the rest.

Assert it through **both** front doors, not only the deployed one. A host that
calls the route table directly must inherit the directive without restating it;
proving it on one host only is what let the hole exist.
