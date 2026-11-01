---
uid: acceptance_criterion-0fbe6d15
id: AC-2154
type: acceptance_criterion
title: An account's first business is provisioned after the invite, and the account
  is then admitted with exactly that one business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T11:57:20.505394+00:00'
updated_at: '2026-11-01T21:35:44.015594+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-387c9dfe
  kind: behavior
  regression_only: false
---

## Criterion
An account's first business is provisioned as a separate step from the invite. Inviting a person into the 1st Contact business writes the person and no business: until a business is provisioned, admission for that email is refused with `no_membership`. Provisioning a business for that account (account person + name) creates the business under the submitted name, with the same shape as a business added by the operator. Afterwards, admission for that email lists exactly that one business.

## Verification
Invite an email into the 1st Contact business and assert admission is refused with reason `no_membership`. Provision a business named "Salon" for the invited person. Assert the result carries a business id, the business record for that id is named "Salon", and admission for that email now lists exactly that business id.