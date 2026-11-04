---
uid: acceptance_criterion-5c205ca2
id: AC-2192
type: acceptance_criterion
title: An owner can correct a contact's primary address and name parts in the business
  they are scoped to
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:04.351507+00:00'
updated_at: '2026-11-04T16:29:55.204109+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
When an owner of the business the caller is scoped to submits a record change for
a person in that business, the change is written and the response is 200 with the
updated person. The change can be a new primary address, one or more name parts,
or both. When read back afterwards, the person's detail shows the new values. The
address is stored casefolded (`Alice@Example.COM` is stored and returned as
`alice@example.com`), so the person can still sign in with any casing of it. A
displayed name that is empty or only whitespace, with no other part set, leaves
the person with no current name, and the list shows them as "No name yet". This
works the same for the owner of any business: an owner of a customer business can
correct that business's contacts, not only 1st Contact.

## Verification
In workerd against real D1 with migrations applied, provision a business and a
person through shipped entry points. As the owner, submit an address and a
displayed name and assert 200 and the returned values; submit a known-as part
alone and assert it is returned with the displayed name unchanged. Re-read the
person's detail and assert everything persisted, with the address lowercased.
Submit an empty displayed name and assert the person reads as having no name.
Repeat the address and name edit as the owner of a second, customer business,
editing one of its own contacts.
