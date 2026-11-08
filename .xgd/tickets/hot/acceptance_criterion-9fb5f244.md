---
uid: acceptance_criterion-9fb5f244
id: AC-2279
type: acceptance_criterion
title: MAIL_FROM is the fallback sending address, configured as '1st Contact <no-reply@1stcontact.io>'
  (RFC 5322 display-name form) in default and production; a missing or blank fallback
  refuses with no default
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:15.344182+00:00'
updated_at: '2026-11-08T04:11:25.676064+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
The fallback sending address is deployment configuration, not a literal at a call site. The control app's deployment configuration declares it, both at the top level and under the production environment, as exactly `1st Contact <no-reply@1stcontact.io>`: a display name and an address in RFC 5322 form. It is used for any message whose template names no address of its own. A configured value is returned trimmed and otherwise unchanged, so the display-name form reaches the provider exactly as configured. Resolving the fallback for a deployment where it is absent or blank refuses with a not-configured error that names the missing setting; it never falls back to a default address.

## Verification
Parse the control app's deployment configuration and assert the fallback From setting equals `1st Contact <no-reply@1stcontact.io>` in both the default and production sections. Resolve it from an environment where the setting is absent and from one where it is whitespace-only; assert both raise a not-configured error that mentions the setting name. Assert a configured value padded with whitespace is returned trimmed. Send a message whose From is in display-name form through the credentialed sender with a recording provider double, and assert the provider's `from` field equals that string verbatim.

Note: REQ-205 replaces the bare `no-reply@1stcontact.io`, which was the only address for every message, with a named fallback.
