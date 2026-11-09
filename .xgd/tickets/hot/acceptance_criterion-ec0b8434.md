---
uid: acceptance_criterion-ec0b8434
id: AC-2561
type: acceptance_criterion
title: A preview submission resolves its form definition from the draft, so a form
  that exists only on the draft is accepted
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T19:56:38.962196+00:00'
updated_at: '2026-11-09T19:56:38.962196+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A submission from the draft preview resolves its form definition from the site's draft, not its live published revision. A form instance that exists only on the draft, on a site with no published revision or whose published revision does not contain it, is accepted: its declared address field is found and the contact is written, with the draft's page, submit label and consent wording in the provenance. A submission to the published site still resolves against the live published revision exactly as before.

## Verification
Create a site whose draft carries a `contact-form` instance that no published revision contains (or that has never been published). POST a submission to `/preview/<slug>/draft/api/lead` naming that instance. Assert that one `lead` contact is written and that its form-submission event carries the draft's page and submit label. Then POST the same instance to the published site's endpoint and assert that the page and submit label are not taken from the draft.
