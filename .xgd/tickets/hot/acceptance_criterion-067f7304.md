---
uid: acceptance_criterion-067f7304
id: AC-2219
type: acceptance_criterion
title: 'Pressing Delete account deletes nothing and records nothing: the account still
  exists afterwards'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:16:13.464244+00:00'
updated_at: '2026-11-04T18:54:44.960597+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-83ff6262
  kind: behavior
  regression_only: false
---

## Criterion
Pressing the Delete account control (and Close) sends no write request to any endpoint. Afterwards the caller's user record, their addresses, their account record, their memberships, their entitlements and every business they operate still exist unchanged, and no erasure request record has been created. The caller can still load /account and the builder.

## Verification
Drive the portal in a browser or DOM harness against a real control-app with a seeded account. Record outgoing requests while pressing Delete account and Close, and check only GETs are made. Then query the store and check that nothing changed: the user row (found through `user_emails`, then read by key), its `user_emails` rows, its `accounts` row, its memberships, entitlements and businesses are all unchanged, no table gained a row, and /account still returns 200 for that caller.
