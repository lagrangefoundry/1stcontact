---
uid: acceptance_criterion-5c205ca2
id: AC-2192
type: acceptance_criterion
title: An owner can correct a contact's email and name in the business they are scoped
  to
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:04.351507+00:00'
updated_at: '2026-11-01T20:02:34.040861+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
When an owner of the business the caller is scoped to submits a record change for a person in that business, the change is written and the response is 200 with the updated person. The change can be a new email, a new display name, or both. When read back afterwards, the person's detail shows the new values. The email is stored casefolded (`Alice@Example.COM` is stored and returned as `alice@example.com`), so the person can still sign in with any casing of the address. A display name that is empty or only whitespace is stored as no name, and the list shows such a person as "No name yet". This works the same for the owner of any business: an owner of a customer business can correct that business's contacts, not only 1st Contact.

## Verification
In workerd against real D1 with migrations applied, provision a business and a person through shipped entry points. As the owner, submit the email and the name and assert 200 and the returned values. Re-read the person's detail and assert it persisted, with the email lowercased. Repeat as the owner of a second, customer business, editing one of its own contacts.