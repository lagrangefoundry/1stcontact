---
uid: acceptance_criterion-e1437d00
id: AC-2065
type: acceptance_criterion
title: The static-preview capture fixture stays exported and serves a rendered site's
  bytes over a real loopback origin
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-30T18:55:48.228179+00:00'
updated_at: '2026-10-30T18:55:48.228179+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

The static-preview capture fixture stays available after `1c serve` was removed:
the command went, not the function under it.

The fixture remains exported from the CLI package. Given a rendered site, it binds
an ephemeral loopback origin and serves that site's rendered bytes over real HTTP
until closed, so the screenshot, aligned-crops and module-conformance loops still
have an origin to point a headless browser at. It is test and capture
infrastructure for a single run, never a hosting path.

## Verification
Render a site, start the exported capture fixture over it, issue a real HTTP
request to the bound loopback origin and confirm a 200 response whose body is the
rendered page's bytes; then close it. This must be a runtime check over HTTP, not a
type-level one — keeping the export while deleting the implementation must fail it.
