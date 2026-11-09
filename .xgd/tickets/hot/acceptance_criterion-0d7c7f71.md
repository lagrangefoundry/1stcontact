---
uid: acceptance_criterion-0d7c7f71
id: AC-2299
type: acceptance_criterion
title: Verified events other than delivered, bounced and complained (opens, clicks,
  sent) are acknowledged with 200 and change nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:32.146871+00:00'
updated_at: '2026-11-09T00:57:20.535042+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
The delivery webhook acts on exactly three event types: `email.delivered`, `email.bounced` and `email.complained`. A correctly signed, current event of any other type (for example `email.opened`, `email.clicked` or `email.sent`) gets HTTP 200 "Ignored." and no record is changed. In particular, a record already `bounced` or `complained` stays that way, and nothing records opens or clicks.

## Verification
Seed one record in `bounced` state and one in `complained` state. For each, post signed `email.sent`, `email.opened` and `email.clicked` events naming its provider id. Assert each gets 200 "Ignored." and the record's status and fields are unchanged. Post a signed `email.complained` for a `sent` record and assert it is not answered "Ignored." and the record changes.
