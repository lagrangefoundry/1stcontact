---
uid: acceptance_criterion-992a4631
id: AC-1772
type: acceptance_criterion
title: Binding the cloud reference store to an unknown or inactive tenant is refused
  at the same layer and with the same refusal site storage uses
created_by: martin-github@westhead.me
created_at: '2026-09-14T04:49:39.747347+00:00'
updated_at: '2026-09-14T05:00:55.279180+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0cb7f25b
  kind: behavior
  regression_only: false
---

## Criterion
The cloud-backed reference store is bound to a tenant before any bundle exists,
and the tenant is checked at that moment rather than at the first read — a
deferred check would surface as an empty bundle instead of a refusal:

- binding to a tenant that is not registered is refused, with a message stating no
  such tenant, and with the **same refusal type** site storage raises for the same
  condition, so a caller catching "unknown tenant" need not know which store
  turned it away
- binding to a registered but not-active tenant is refused with a message stating
  the tenant is not active, and the refusal distinguishes *inactive* from
  *unknown*: unknown is a state a caller owning the configuration may resolve by
  registering, inactive is a decision no caller may undo by retrying
- binding to a registered, active tenant succeeds and yields a usable store

The operator's local store has no tenant and does not pretend to one: it serves a
single operator against a tree on their own disk, where there is no registry to
check against and a barrier that always said yes would be a barrier in name only.

## Verification
Against a real tenant registry: bind to an unregistered id and assert the refusal
type and message; register a tenant as suspended, bind, and assert the refusal
message and that its stated reason is "inactive"; bind to an active tenant and
assert a usable store is returned.