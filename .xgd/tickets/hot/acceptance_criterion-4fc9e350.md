---
uid: acceptance_criterion-4fc9e350
id: AC-2250
type: acceptance_criterion
title: The detail pane lists every non-primary address read-only under Other addresses,
  and the section is absent for a person with one address
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T16:30:35.184339+00:00'
updated_at: '2026-11-04T19:42:49.757760+00:00'
completed_at: null
last_field_updated: status
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