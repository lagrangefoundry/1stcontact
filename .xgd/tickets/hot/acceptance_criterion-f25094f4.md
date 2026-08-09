---
uid: acceptance_criterion-f25094f4
id: AC-877
type: acceptance_criterion
title: A contact form whose endpoint the enhancement cannot send to keeps its native
  submit
created_by: xgd
created_at: '2026-08-06T03:51:30.674284+00:00'
updated_at: '2026-08-09T05:41:23.870138+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A contact form whose configured endpoint carries a permitted but non-fetchable
scheme — `mailto:` or `tel:`, both of which the module's own safety check accepts
as legitimate endpoints — submits through the user agent's native `method="post"`
form navigation when JavaScript is running, exactly as it does with JavaScript
disabled. No submission is attempted on the visitor's behalf, no error message is
shown, and nothing on the page is swapped.

The decision is taken from the endpoint's scheme **before** the submit is
suppressed, so the vetted no-JS baseline is still available at the moment the
enhancement declines it. The rule is an allowlist rather than a `mailto:`/`tel:`
denylist: any other scheme (`ftp:`, `sms:`, `file:`, …) falls back the same way,
and an endpoint that cannot be read at all falls back the same way without
throwing. A schemeless value is a relative URL, which the enhancement can send,
so it is enhanced rather than treated as unparseable.

## Verification
Render a contact-form configured with a `mailto:` endpoint and with a `tel:`
endpoint, submit each in a JS-enabled page, and assert the submit event's default
action is not suppressed (the user agent performs the native post), no request is
issued by the page, and no error banner appears. Repeat for an endpoint carrying
an unrelated permitted scheme and for a value that cannot be read, asserting the
same fallback and no thrown error. Assert a schemeless (relative) value is still
enhanced.