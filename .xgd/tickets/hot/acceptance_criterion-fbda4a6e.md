---
uid: acceptance_criterion-fbda4a6e
id: AC-1092
type: acceptance_criterion
title: The surface offers exactly one way to change what is on a page, and every operation
  it offers is one it declares
created_by: xgd
created_at: '2026-08-10T09:20:22.488550+00:00'
updated_at: '2026-08-10T09:29:35.764158+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

Changing what is on a page is reached through a single operation. The narrower
copy-field read/write pair is not offered alongside it — it is subsumed, so it does not
appear among the surface's declared operations, among the operations a session can
invoke, or in the manual a session is given; invoking it by name is answered as an
unknown operation.

The declared operations and the implemented operations correspond exactly, in both
directions: nothing implemented is undeclared, and nothing declared is unimplemented. The
capability group that changing a page belongs to is one the surface declares, and it is
named in the grant the builder's assistant receives.

## Verification

Compare the set of declared operation names with the set of implemented ones for exact
equality. Assert the retired pair appears in neither, nor in a session's tool list or
manual, and that calling it by name returns an unknown/not-enabled answer. Assert every
group named in the assistant's grant is a group the surface declares, and that the group
covering page changes is among them.