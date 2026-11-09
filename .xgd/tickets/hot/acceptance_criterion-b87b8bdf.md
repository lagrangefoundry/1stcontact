---
uid: acceptance_criterion-b87b8bdf
id: AC-2500
type: acceptance_criterion
title: A JSON submission to the site's own /api/lead is acknowledged and lands one
  lead contact in the tenant the URL names
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:06.200615+00:00'
updated_at: '2026-11-09T00:30:06.200615+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
A JSON `POST` to `/site/<siteKey>/api/lead` on the published site's own origin, carrying an email address and a Turnstile token the verifier confirms, receives `200` with exactly the body `{"ok":true}`, `content-type: application/json; charset=utf-8` and `cache-control: no-store`. Afterwards that site's business has exactly one contact with that address (case-normalised), at pipeline stage `lead`.

A bare `POST /api/lead` writes into the deployment's apex site in the same way. On a deployment with no apex site, a bare `POST /api/lead` answers `405`, like any other path.

## Verification
Publish a site with a `contact-form` instance, POST to the keyed path as a non-browser caller (no CORS, no cookies) with a stub verifier that confirms the token, and assert the status, exact body, headers, and the single contact row at stage `lead` in that business. Repeat at the bare path against the apex site, and once more with no apex site configured (expect `405`).
