---
uid: acceptance_criterion-5440127a
id: AC-2282
type: acceptance_criterion
title: The template ticket type requires a key from invite/signin/lapsed, a subject
  and a non-empty body; placeholders are optional; invalid writes are refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:21.648673+00:00'
updated_at: '2026-11-04T17:32:21.648673+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
A `template` ticket type is registered in the business ticket store with fields `template_key` (required; one of `invite`, `signin`, `lapsed`), `subject` (required string) and `placeholders` (optional list), and a required non-empty body. Writing a template ticket is refused when `template_key` is missing or outside the closed set (e.g. `sign-in`), when `subject` is missing, or when the body is empty; a template with no `placeholders` is accepted.

## Verification
Against a business's ticket store, create template tickets: one valid with placeholders, one valid without placeholders (both succeed), and one each with no key, key `sign-in`, no subject, and empty body (each refused, nothing written). Assert the type appears in the store's registered type schema with the fields above.
