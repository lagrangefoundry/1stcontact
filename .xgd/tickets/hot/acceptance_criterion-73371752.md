---
uid: acceptance_criterion-73371752
id: AC-1080
type: acceptance_criterion
title: 'What a consumer is told about the surface is a projection of it: every offered
  operation, the error meanings, and the declared absences'
created_by: xgd
created_at: '2026-08-10T09:06:38.849239+00:00'
updated_at: '2026-08-10T09:06:38.849239+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

The consumer-facing description of the surface is generated from the declaration
and the grant, not maintained beside them. It names every operation actually
offered, publishes the error codes with their caller-facing meanings rather than
bare codes, and states the declared absences by name — including that HTML, CSS
and JavaScript cannot be written — so a capability that is deliberately impossible
comes back as an answer rather than as a rejected attempt.

## Verification

Build the assistant's surface and read its manual. Assert every operation it
offers is named there; that the manual marks a section for what is not available
and names each declared absence, including the one covering HTML, CSS and
JavaScript; and that at least one error code appears together with its published
guidance rather than alone.
