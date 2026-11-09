---
uid: acceptance_criterion-ed5504e7
id: AC-2503
type: acceptance_criterion
title: A no-JavaScript form POST is captured identically and receives an HTML confirmation
  page
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:15.155718+00:00'
updated_at: '2026-11-09T00:30:15.155718+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A form submitted without JavaScript (`application/x-www-form-urlencoded` or `multipart/form-data`) is captured exactly as a JSON submission is: the same contact and the same provenance event. It receives `200` with a generic HTML confirmation page instead of JSON: a "Thank you" heading, "Your message has been received.", a `noindex` robots meta tag, `content-type: text/html; charset=utf-8`, `cache-control: no-store` and `x-robots-tag: noindex`.

The page is identical for every submission and does not use the form's own success message. Refusals of a native form submission are also HTML, not JSON.

## Verification
POST a URL-encoded body with the form's field names to the endpoint and assert the contact row and event exist and that the response is the HTML confirmation with the listed headers. Then post an over-long field the same way and assert the refusal is `text/html`.
