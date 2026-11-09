---
uid: acceptance_criterion-ac55e362
id: AC-2516
type: acceptance_criterion
title: Served pages with a form carry the Turnstile sitekey on every mount and the
  script once
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:41.200402+00:00'
updated_at: '2026-11-09T00:30:41.200402+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
When a deployment has a Turnstile sitekey configured, every page it serves that carries a form arrives with:
- every Turnstile mount on the page stamped with `data-sitekey` and Cloudflare's `cf-turnstile` class
- Cloudflare's Turnstile script included exactly once, before `</body>`

A page with no form is served byte-for-byte unchanged. With no sitekey configured, every page is served exactly as published (the endpoint refuses instead).

## Verification
Through the published-site server, GET a page with two forms and a page with none, with a sitekey configured. Assert two stamped mounts, one script tag before `</body>`, and the form-less page unchanged. Repeat with the sitekey empty and assert the form page is byte-identical to the published bytes.
