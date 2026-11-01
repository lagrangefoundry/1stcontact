---
uid: acceptance_criterion-b145de56
id: AC-2196
type: acceptance_criterion
title: A record change for an id that is unknown, or that belongs to another business,
  is the same 404
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:10.565772+00:00'
updated_at: '2026-11-01T19:33:10.565772+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
If the person id in a record change names nobody in the business the caller is scoped to, the response is **404**, and nothing changes. The response is the same whether the id never existed or belongs to a person in another business, so the write cannot be used to find out which ids exist elsewhere.

## Verification
Against real D1, as an owner of business A: submit a change for a random id and for the id of a real person in business B. Assert both are 404 with identical response bodies, and that the business-B person's row is unchanged.
