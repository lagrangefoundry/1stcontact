---
uid: acceptance_criterion-27726053
id: AC-2128
type: acceptance_criterion
title: A session resumed after the caller's membership expired is refused, not answered
  from a warm chat host
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:39.846146+00:00'
updated_at: '2026-11-01T10:36:58.602232+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
When a caller has an open chat session in business A and their membership on A then expires, the next prompt in that session is refused (the caller is no longer admitted for A). No assistant reply is produced from a chat host that was cached for A before the expiry, and nothing new is appended to A's transcript.

## Verification
Open a session and complete a turn under `/b/<A>/` so that the chat host is warm. Expire the membership, send another prompt in the same session, and assert a refusal status with no streamed reply and an unchanged transcript.