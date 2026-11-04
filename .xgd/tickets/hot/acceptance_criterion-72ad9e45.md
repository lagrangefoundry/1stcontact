---
uid: acceptance_criterion-72ad9e45
id: AC-2285
type: acceptance_criterion
title: Rendering refuses on a declared token missing from the body, a missing or empty
  value, or any leftover token, naming template, uid and token
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:26.152323+00:00'
updated_at: '2026-11-04T17:32:26.152323+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
Rendering refuses — producing no message — in each of three cases: (1) a token declared in `placeholders` does not appear in the body (appearing only in the subject does not count); (2) a declared token is given no value, a null value, an empty string or a whitespace-only string; (3) any token remains unsubstituted in the rendered subject or body, including a token used in the copy but never declared. Each refusal is a template-refused error whose message names the template key, the template ticket uid and the offending token as `{{token}}`, and states that nothing was sent.

## Verification
For each case build a template and render it: (1) declare `cta_url` with a body lacking it; (2) declare and use `cta_url` and supply missing / `""` / `"  "`; (3) use undeclared `{{name}}` in the body without a value, and separately in the subject. Assert each raises a template-refused error carrying the key, uid and token, with message text containing the key, the uid, `{{<token>}}` and "Nothing was sent".
