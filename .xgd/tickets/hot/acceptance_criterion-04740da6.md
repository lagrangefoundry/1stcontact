---
uid: acceptance_criterion-04740da6
id: AC-2247
type: acceptance_criterion
title: The person record carries no address; a person holds several casefolded addresses
  with at most one primary, and an address reaches exactly one person in a business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T16:30:30.199754+00:00'
updated_at: '2026-11-04T17:07:23.748238+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The person record carries no address column. A person's addresses are rows of
their own: a person may hold several, each stored casefolded, and at most one of
them is primary — the schema refuses a second primary for the same person, not
application code. Within one business an address belongs to exactly one person:
the schema refuses a second person in that business holding it. The same address
held in two different businesses is two unrelated people, and writing it into one
business is unaffected by the other. A person created by the invite is written
together with their first address, which is their primary, so no person exists
without the address that finds them. Every surface that shows one address for a
person shows the primary.

## Verification

In workerd against real D1 with the baseline applied: assert the people table has
no address column. Invite a person and assert they hold exactly one address, flagged
primary. Insert a second address for them and assert they now hold two; attempt to
flag the second as primary while the first still is, and assert the write is
refused. Attempt to give a second person in the same business the first person's
address and assert it is refused. Invite the same address from a second business
and assert it creates a distinct person there with a different key.