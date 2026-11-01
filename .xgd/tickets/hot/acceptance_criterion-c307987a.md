---
uid: acceptance_criterion-c307987a
id: AC-2168
type: acceptance_criterion
title: No single predicate answers both 'is this person an owner here' and 'may this
  person enter a business they are not a member of'
created_by: xgd
created_at: '2026-11-01T17:59:10.330913+00:00'
updated_at: '2026-11-01T22:21:32.526511+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
The two capabilities that `platform_admin` used to bundle are separately observable, and neither implies the other:
- a person with `platform_operator` and no `owner` membership on the 1st Contact business can enter a hosted business they are not a member of, but is refused add-a-business (404) and is not reported as an owner anywhere
- a person with an `owner` membership on the 1st Contact business and no `platform_operator` can add a business, but naming a business they hold no membership on is refused (403, logged `not_a_member`)
- only a person holding both facts has both capabilities.

The ownership answer reads the caller's admission (membership roles) and never the `platform_operator` column. The bypass reads the column and never a role.

## Verification
Seed three people: operator-only, owner-only, and both. For each, submit add-a-business and request a customer business they are not a member of under its prefix. Assert the matrix: operator-only gets 404 and enters; owner-only gets 200 and 403; both gets 200 and enters.