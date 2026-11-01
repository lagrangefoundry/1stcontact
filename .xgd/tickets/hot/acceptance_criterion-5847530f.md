---
uid: acceptance_criterion-5847530f
id: AC-2185
type: acceptance_criterion
title: Every grant names its business, including where the person does not run it;
  a grant on a vanished business still shows by id
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:46.769748+00:00'
updated_at: '2026-11-01T19:00:46.769748+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
Every grant in a person's detail reports the name of the business it is for. This includes a grant on a business the person holds no membership on, and the table shows that name in the grant's Business cell. A grant whose business record no longer exists is still listed rather than omitted, and its Business cell shows the business's identifier in place of a name.

## Verification
Seed a grant naming business Y for a person who doesn't run Y. Read the detail and assert the grant carries Y's name, and the rendered row's Business cell shows that name. Seed a grant whose business row is then removed. Assert the grant is still present in the detail with a null name, and that the rendered Business cell shows the business id.
