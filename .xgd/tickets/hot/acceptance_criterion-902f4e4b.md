---
uid: acceptance_criterion-902f4e4b
id: AC-1379
type: acceptance_criterion
title: Unobtainable signing keys deny rather than admit
created_by: xgd
created_at: '2026-08-31T09:32:18.472372+00:00'
updated_at: '2026-08-31T09:41:07.984581+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

When the identity gateway's published signing keys cannot be obtained, the gate
refuses rather than admits, and says that the keys could not be fetched.

This is the case where "we could not check" is most tempting to treat as "carry
on". There is no code path on which an unreachable, erroring or empty key
publication becomes an admission — the whole vulnerability dressed as
resilience.

## Verification

Drive the request handler with a valid identity while the gateway's key
publication answers with an error status, and separately while it publishes no
keys at all. In each case observe an authorisation-failure refusal whose message
says the signing keys could not be fetched, and that nothing behind the gate was
consulted.