---
uid: acceptance_criterion-33074e91
id: AC-987
type: acceptance_criterion
title: A malformed region address is refused outright and never resolved to a neighbouring
  region
created_by: xgd
created_at: '2026-08-07T02:02:36.080857+00:00'
updated_at: '2026-08-07T02:12:05.362510+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

An address that is not a well-formed region address is refused with a fault
naming it, rather than being coerced, truncated or partially parsed into an
address that resolves. An address that is well-formed but names no region in the
page is refused as not found, with a hint that addresses are specific to a
rendering and should be re-read from the current one.

## Verification

Submit reads and writes against malformed addresses (empty, non-numeric, mixed)
and against a well-formed address beyond the page's actual regions. Assert every
one is refused, that no write occurs, and that no request resolves to a different
region than the one addressed.