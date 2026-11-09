---
uid: acceptance_criterion-92418831
id: AC-2512
type: acceptance_criterion
title: An address with a bounced or complained message is never sent an asset
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T00:30:33.353084+00:00'
updated_at: '2026-11-09T00:30:33.353084+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f2e5032c
  kind: behavior
  regression_only: false
---

## Criterion
An address whose contact has any message recorded as `bounced` or `complained` is never sent an asset by a public form, including an asset it has never received. The submission is still captured (contact and provenance event), and the visitor receives the frozen acknowledgement.

## Verification
Record a complaint against a contact through the real signed email-delivery webhook, then submit that address to a form offering a new asset. Assert that no new message record exists, that the submission event was recorded, and that the response is the acknowledgement. Repeat with a `bounced` status.
