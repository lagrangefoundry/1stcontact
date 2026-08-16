---
uid: acceptance_criterion-73371752
id: AC-1080
type: acceptance_criterion
title: 'What a consumer is told about the surface is a projection of it: every offered
  operation, the error meanings, the addressing rule, and the declared absences'
created_by: xgd
created_at: '2026-08-10T09:06:38.849239+00:00'
updated_at: '2026-08-16T03:06:23.267216+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

The consumer-facing description of the surface is generated from the declaration
and the grant, not maintained beside them. It names every operation actually
offered, publishes the error codes with their caller-facing meanings rather than
bare codes, carries the addressing rule — that an address is read from a page's
map and lasts only as long as that map, because any change regenerates it — from
the declaration rather than from a hand-written preamble, and states the declared
absences by name — including that HTML, CSS and JavaScript cannot be written — so
a capability that is deliberately impossible comes back as an answer rather than
as a rejected attempt.

## Verification

Build the assistant's surface and read its manual. Assert every operation it
offers is named there; that the manual states the addressing rule in the
re-read / regeneration wording the declaration's overview carries, so the rule
survives the projection rather than depending on prose kept beside it; that the
manual marks a section for what is not available and names each declared absence,
including the one covering HTML, CSS and JavaScript; and that at least one error
code appears together with its published guidance rather than alone.