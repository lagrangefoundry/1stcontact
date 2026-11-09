---
uid: acceptance_criterion-746d2fa3
id: AC-2505
type: acceptance_criterion
title: 'Each submission records a provenance event: site, page, instance, submit label,
  answers, consent wording and answer'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:19.154985+00:00'
updated_at: '2026-11-09T00:30:19.154985+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Every accepted submission appends one form-submission event to the contact's history. Its detail records:
- the site key
- the page carrying the form
- the form instance id
- the submit button's label
- every other field the visitor submitted, by name. The address itself is not repeated here, and the honeypot, Turnstile token and instance-handle fields are never stored.
- for every checkbox the form declares, ticked or not: the field name, the wording shown beside it, and the answer (true when submitted, false when absent)
- the asset key, when the form promises one

The page, submit label, consent wording and asset come from the site's live published definition of that form instance. Values the request supplies for them are ignored. A submission whose instance cannot be resolved in the published definition is still captured, recording the site, the instance id as sent and the submitted answers.

## Verification
Publish a form with a textarea, a checkbox and an asset. Submit it once with the box ticked and once unticked, including a body field that attempts to supply consent wording. Read the contact's events and assert each listed key and value: wording taken from the published definition, `answer` true then false, no reserved fields, and the address absent from the answers.
