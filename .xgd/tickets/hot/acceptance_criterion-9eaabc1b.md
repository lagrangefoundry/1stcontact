---
uid: acceptance_criterion-9eaabc1b
id: AC-2508
type: acceptance_criterion
title: Rate limiting is keyed on site and source IP; exceeding it is indistinguishable
  and writes nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:25.339151+00:00'
updated_at: '2026-11-09T00:54:14.886499+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Submissions are rate-limited on a key built only from the site (as resolved from the URL) and the caller's edge-reported source IP. No body value contributes to the key. A submission the limiter refuses receives the frozen acknowledgement and writes nothing, sends nothing, and does not contact the Turnstile verifier.

## Verification
Use a rate-limiter double that records the keys it is asked about. Assert that the key is `<siteKey>:<source IP>`, and that it is unchanged when body fields vary. With the double refusing, assert the acknowledgement bytes, no contact, event or message, and zero verifier calls.