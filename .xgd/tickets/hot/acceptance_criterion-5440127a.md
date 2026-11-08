---
uid: acceptance_criterion-5440127a
id: AC-2282
type: acceptance_criterion
title: The template ticket type requires a key from invite/signin/lapsed, a subject
  and a non-empty body; placeholders and a sending address (from) are optional; invalid
  writes are refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:21.648673+00:00'
updated_at: '2026-11-08T04:11:31.504661+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
A `template` ticket type is registered in the business ticket store with these fields:
- `template_key`: required; one of `invite`, `signin`, `lapsed`;
- `subject`: required string;
- `placeholders`: optional list;
- `from`: optional string, the address that template's messages are sent from;
- a required non-empty body.

Writing a template ticket is refused when `template_key` is missing or outside the closed set (e.g. `sign-in`), when `subject` is missing, or when the body is empty. A template with no `placeholders` is accepted, and so is a template with no `from`; that template means "send from the deployment's fallback address", which is what every template ticket written before the field existed already means.

## Verification
Against a business's ticket store, create template tickets:
- one valid with placeholders, one valid without placeholders, one valid with a `from`, and one valid without a `from` (all succeed);
- one each with no key, with key `sign-in`, with no subject, and with an empty body (each refused, nothing written).

Assert the type appears in the store's registered type schema with the fields above, `from` included and not required.
