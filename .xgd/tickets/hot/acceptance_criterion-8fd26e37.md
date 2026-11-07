---
uid: acceptance_criterion-8fd26e37
id: AC-2343
type: acceptance_criterion
title: An active known person who requests a sign-in link at their address receives
  one emailed link and sees the acknowledgement
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-07T08:23:10.119708+00:00'
updated_at: '2026-11-07T08:23:10.119708+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e0ca0a36
  kind: behavior
  regression_only: false
---

## Criterion
The sign-in page loads with no Cloudflare Access token at all, and it shows a form asking for an email address. A person who is active in the business the request host resolves to submits one of their addresses (by form, or as JSON). After that:
- the response is the sign-in acknowledgement: a "Check your email" page for a form submission, or the fixed acknowledgement JSON body for a JSON submission. Both return status 200.
- exactly one message goes to that address. It is rendered from the business's `signin` template, and its call-to-action is a sign-in link on the same origin whose path is `/sign-in/<token>`. The token is in the path, not in a query string.
- the message is recorded in that contact's message history, alongside any invite they were sent.

## Verification
Through the Worker against real D1, with mail captured: GET /sign-in with no Access header (expect 200 and the form), POST a known active address, then assert the response, a single captured message whose link matches `/sign-in/<token>`, and a recorded message on the contact.
