---
uid: acceptance_criterion-a7abfe2c
id: AC-2284
type: acceptance_criterion
title: Rendering substitutes every token in subject and body and returns the template
  key and ticket uid
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:24.606267+00:00'
updated_at: '2026-11-04T17:32:24.606267+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
Rendering a template with a value for each token it uses returns: the subject and body with every `{{token}}` occurrence (inner whitespace allowed, e.g. `{{ cta_url }}`) replaced by its value, the template key, and the template ticket's uid. Tokens are substituted in the subject as well as the body. A `placeholders` entry is accepted written either as `name` or as `{{name}}`. A template that declares no tokens and contains none renders unchanged.

## Verification
Render a template whose body contains `{{cta_url}}` twice and `{{ name }}` once and whose subject contains `{{name}}`, declaring `cta_url` and `{{name}}`. Assert all occurrences in both subject and body are replaced, no `{{` remains, and the result carries the key and the ticket uid. Render a token-free template with no declarations and assert subject/body are returned verbatim.
