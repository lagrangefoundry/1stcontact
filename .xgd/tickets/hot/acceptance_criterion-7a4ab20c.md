---
uid: acceptance_criterion-7a4ab20c
id: AC-2352
type: acceptance_criterion
title: The builder admits a caller on a valid session or a valid Access token, and
  a dead session falls through to Access
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:16.469878+00:00'
updated_at: '2026-11-07T08:23:16.469878+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
Both of the following get a builder request admitted as the same verified email, and both lead to the same outcomes downstream (scope, terms gate, portal):
- a valid session cookie, with no Access token
- a valid Cloudflare Access token, with no session cookie

A session cookie that resolves to nobody (expired, ended, withdrawn, or never issued), sent together with a valid Access token, is admitted on the Access token rather than refused. A request with neither a live session nor a valid Access token is refused, as before.

## Verification
Call a builder route with each combination: session only, Access only, dead session plus Access, and neither. Assert admitted as the expected email in the first three cases and refused in the last.
