---
uid: acceptance_criterion-8baa8d19
id: AC-1381
type: acceptance_criterion
title: Refusals are neither stored by an intermediary nor indexed by a crawler
created_by: xgd
created_at: '2026-08-31T09:32:25.753002+00:00'
updated_at: '2026-08-31T09:32:25.753002+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-182e8cb9
  kind: behavior
  regression_only: false
---

## Criterion

Every refusal the gate produces is marked as not storable by any intermediary
and not indexable by a crawler.

Both halves matter for different reasons: a stored refusal is as wrong as a
stored admission, because an intermediary that keeps one refusal will serve it
to the admitted identity next; and an indexed refusal advertises the existence
and address of the private surface it is protecting.

## Verification

Request the gated surface with no identity and observe the refusal carries a
directive forbidding storage by any cache and a directive instructing crawlers
not to index it.
