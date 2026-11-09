---
uid: acceptance_criterion-742f0a22
id: AC-2562
type: acceptance_criterion
title: Every captured lead records its channel (draft for the preview, published otherwise),
  set by the server and never the request
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T19:56:40.552581+00:00'
updated_at: '2026-11-09T20:04:36.966554+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
Every form-submission event records the channel it was submitted from: `draft` for a submission through the builder's draft preview, and `published` for a submission to the published site. The value is always present, including for published submissions, so a preview test lead never reads as a public enquiry and a live lead is distinguishable from one recorded before the field existed. The channel is set by the server that received the request. A body field named `channel` cannot change it and is stored only as an ordinary answer. A preview lead is otherwise an ordinary contact in the same contact list, not a separate kind of record.

## Verification
Submit the same form once through `/preview/<slug>/draft/api/lead` and once through the published endpoint, each with a body field `channel=published` or `channel=draft` claiming the opposite. Read the events and assert the provenance channel is `draft` and `published` respectively, the claimed value appears only among the answers, and both contacts are ordinary `lead` contacts in the same tenant's contact list.