---
uid: acceptance_criterion-746d2fa3
id: AC-2505
type: acceptance_criterion
title: 'Each submission records a provenance event: channel, site, page, instance,
  submit label, answers, consent wording and answer, read from the served definition'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:19.154985+00:00'
updated_at: '2026-11-09T19:56:12.323827+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Every accepted submission appends one form-submission event to the contact's history. Its detail records:
- the channel it was submitted from (see the channel AC)
- the site key
- the page carrying the form
- the form instance id
- the submit button's label
- every other field the visitor submitted, by name. The address itself is not repeated here, and the honeypot, Turnstile token and instance-handle fields are never stored.
- for every checkbox the form declares, ticked or not: the field name, the wording shown beside it, and the answer (true when submitted, false when absent)
- the asset key, when the form promises one

The page, submit label, consent wording and asset come from the definition of that form instance that the submitter was served. For a submission to the published site that is the live published revision. For a submission from the draft preview it is the draft. Values the request supplies for them are ignored. A submission whose instance cannot be resolved in that definition is still captured, recording the site, the instance id as sent and the submitted answers.

## Verification
Publish a form with a textarea, a checkbox and an asset. Submit it once with the box ticked and once unticked, including a body field that attempts to supply consent wording. Read the contact's events and assert each listed key and value: wording taken from the published definition, `answer` true then false, no reserved fields, and the address absent from the answers. Then change the consent wording in the draft only, submit through the draft preview, and assert that the recorded wording is the draft's while a published-site submission still records the published wording.
