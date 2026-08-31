---
uid: acceptance_criterion-74ae12ec
id: AC-1378
type: acceptance_criterion
title: An incompletely configured gate refuses everything with a distinct status naming
  the missing setting
created_by: xgd
created_at: '2026-08-31T09:32:16.691185+00:00'
updated_at: '2026-08-31T09:41:08.110787+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

A gate whose configuration is incomplete refuses **every** request, including one
carrying an otherwise-valid identity, and it does so with a status distinct from
an authorisation failure, naming the missing setting or settings by name.

The distinction is the point: an unconfigured gate is fixed in the deployment
configuration, an unauthorised caller is fixed by signing in, and answering the
first with the second sends the operator hunting for a login problem that does
not exist.

Incomplete means either the identity gateway's team identifier or this
application's audience identifier is absent or empty. Neither has a default and
neither degrades to admitting traffic.

## Verification

Drive the request handler with a valid identity three times: with the team
identifier empty, with the audience identifier empty, and with both empty. In
each case observe a service-unavailable-class status rather than an
authorisation-failure status, a message naming the setting(s) that are missing,
and that nothing behind the gate was consulted.