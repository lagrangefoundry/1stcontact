---
uid: acceptance_criterion-a9a7dbf2
id: AC-2281
type: acceptance_criterion
title: A message body is delivered to the provider as HTML alongside a plain-text
  part derived from it; only one body is authored
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:20.037311+00:00'
updated_at: '2026-11-08T04:11:30.137425+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
A message body is delivered to the mail provider as HTML, so a rendered template's call-to-action button renders as a button in the recipient's mail client instead of showing as raw markup. Alongside it the provider receives a plain-text part derived from that same body. Only one body is authored: no template has a text field, and the text part is never written separately.

## Verification
With a credential configured and a recording provider double, render the seeded `invite` template with a `cta_url` value and send the result. Assert the request the provider received carries:
- the rendered body, unchanged, in the provider's HTML field, containing an anchor whose href is the supplied URL;
- a non-empty plain-text field containing no HTML tags.

Note: this supersedes the earlier single-part assertion ("no plain-text body field"). That assertion captured REQ-197's "the body is HTML, and it is one part". REQ-205 explicitly replaces the HTML-only send with HTML plus a derived text part, while keeping REQ-197's single authored body. The derivation rules are covered by the text-part AC.
