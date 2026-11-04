---
uid: acceptance_criterion-a9a7dbf2
id: AC-2281
type: acceptance_criterion
title: A message body is delivered to the mail provider as HTML so a template's button
  renders
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:20.037311+00:00'
updated_at: '2026-11-04T19:42:35.487866+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
A message body is delivered to the mail provider as HTML, so that a rendered template's call-to-action button renders as a button in the recipient's mail client rather than appearing as raw markup. Message bodies are a single HTML part: no separate plain-text alternative is submitted.

## Verification
With a credential configured and a recording provider double, render the seeded `invite` template with a `cta_url` value and send the result. Assert that the request the provider received carries the rendered body in the provider's HTML body field, containing an anchor whose href is the supplied URL, and that it carries no plain-text body field.

Note: captures REQ-197's intent ("the body is HTML, and it is one part"). The adapter was brought into line under granted override report-132efb58 (commit 1e6ff1897c), which changed it to submit `html: message.body`. See the resolved entry in the story's Reconciliation Decisions.
