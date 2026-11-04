---
uid: acceptance_criterion-0d7c7f71
id: AC-2299
type: acceptance_criterion
title: Verified events other than delivered and bounced (opens, clicks, sent) are
  acknowledged with 200 and change nothing
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:03:32.146871+00:00'
updated_at: '2026-11-04T18:14:35.998719+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-219b4217
  kind: behavior
  regression_only: false
---

## Criterion
A correctly signed, current event whose type is anything other than `email.delivered` or `email.bounced` (for example `email.opened`, `email.clicked` or `email.sent`) gets HTTP 200 "Ignored." No record is changed. In particular, a record already `bounced` stays `bounced`, and nothing records opens or clicks.

## Verification
Seed a record in `bounced` state. Post signed `email.sent`, `email.opened` and `email.clicked` events naming its provider id. Assert each gets 200 "Ignored." and the record's status and fields are unchanged.