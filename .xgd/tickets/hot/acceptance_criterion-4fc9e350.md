---
uid: acceptance_criterion-4fc9e350
id: AC-2250
type: acceptance_criterion
title: The detail pane lists every non-primary address read-only under Other addresses,
  and the section is absent for a person with one address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T16:30:35.184339+00:00'
updated_at: '2026-11-04T21:12:20.647922+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion

A contact's detail lists every address the person holds other than the primary
one, under an **Other addresses** heading, as plain text with no editing
affordance, button or other control. The primary address is not repeated there; it
is the Email field of Who they are. For a person holding only one address the
Other addresses section is absent altogether.

## Verification

Mount the Contacts panel against a transport whose detail returns a person with
three addresses, primary first. Assert an Other addresses section lists exactly the
two non-primary addresses in order, and that it contains no input, button or
editing affordance. Open a person holding one address and assert no Other
addresses section is rendered.

Server half: through the shipped router, `GET /api/people/detail?id=` for a person holding three addresses (secondaries seeded out of order) answers 200 with `emails` listing all three, the primary first and flagged as the only primary. For a person holding one address it lists exactly that one. (UAT: `test_UAT_AC2250_person_detail_route_lists_every_address_primary_first`, real D1, real router.)
