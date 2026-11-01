---
uid: acceptance_criterion-3352463f
id: AC-2199
type: acceptance_criterion
title: Withdrawing a grant from a contact's detail marks it revoked and keeps the
  row, and it no longer confers access
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:15.273725+00:00'
updated_at: '2026-11-01T20:02:32.270850+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
In a contact's detail, every grant row whose status is not `revoked` shows a **Withdraw** button, and a revoked grant shows none. Withdrawing a grant sets its status to `revoked` and records when it was revoked, and the grant row is kept. The detail is then re-read, and the grant appears with status `revoked` and no Withdraw button. A revoked grant no longer gives access to the business it names. Withdrawing an id that names no grant is refused with **400** "No such grant.".

## Verification
Against real D1: open a grant, withdraw it, and assert the row still exists with status `revoked` and a non-null revoked-at time. Assert the business is no longer selectable for the account on its strength alone. In the panel: assert Withdraw appears only on non-revoked grant rows, that clicking it sends a revoke for that grant id, and that the detail is re-fetched afterwards. Withdraw a random id and assert 400.