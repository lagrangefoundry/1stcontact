---
uid: acceptance_criterion-0510d1dc
id: AC-2560
type: acceptance_criterion
title: A draft-preview submission lands one lead contact in the tenant the slug names,
  through the same handler as the published endpoint
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T19:56:37.648703+00:00'
updated_at: '2026-11-09T20:04:37.415796+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
On the control app (the builder, behind Cloudflare Access), a submission to `POST /preview/<slug>/draft/api/lead` is handled by the same lead endpoint the published site uses, not a second implementation. It accepts the same two submit shapes (JSON and native form POST), applies the same body and field limits and honeypot, and answers the same frozen acknowledgement, HTML confirmation page and refusals. A valid submission lands exactly one contact at the `lead` stage in the tenant that owns the site the slug names, idempotent on the address like any other lead. A slug the operator's store does not resolve answers `404` and writes nothing.

## Verification
Drive the control app's own router against a real D1 and R2. With a draft-only site whose form declares an email field, POST a JSON submission and a native form POST to `/preview/<slug>/draft/api/lead`. Assert that the responses are byte-identical to the published endpoint's acknowledgement (JSON) and confirmation page (HTML). Assert that the tenant has exactly one `lead` contact for that address after both. POST to `/preview/<unknown-slug>/draft/api/lead` and assert `404` with no contact written. Send an over-limit body and assert the same refusal status the published endpoint gives.