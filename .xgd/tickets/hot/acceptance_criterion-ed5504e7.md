---
uid: acceptance_criterion-ed5504e7
id: AC-2503
type: acceptance_criterion
title: A no-JavaScript form POST is captured identically and receives an HTML confirmation
  page
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:15.155718+00:00'
updated_at: '2026-11-09T00:54:12.614378+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A published form submitted without JavaScript is an ordinary `<form method="post">` with no `enctype`, so it arrives as `application/x-www-form-urlencoded`. Such a submission is captured exactly as a JSON submission is: the same contact and the same provenance event. It receives `200` with a generic HTML confirmation page instead of JSON: a "Thank you" heading, "Your message has been received.", a `noindex` robots meta tag, `content-type: text/html; charset=utf-8`, `cache-control: no-store` and `x-robots-tag: noindex`.

The page is identical for every submission and does not use the form's own success message. Refusals of a native form submission are also HTML, not JSON.

## Verification
Render the published form and assert it posts with no `enctype`. POST a URL-encoded body with the form's field names to the endpoint and assert the contact row and event exist (with the same provenance detail as a JSON submission of the same answers), and that the response is the HTML confirmation with the listed headers. Then post an over-long field the same way and assert the refusal is `400` and `text/html`.

## Reconciliation note
An earlier wording also promised `multipart/form-data` capture. The endpoint admits that content type as a form shape but parses every form body as URL-encoded, so a multipart body yields no fields and is refused (`400`, no Turnstile token). REQ-223 asks only for "an ordinary form POST", which the published form sends URL-encoded, so multipart capture is not claimed here.