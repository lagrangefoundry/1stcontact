---
uid: goal-498c81ca
id: GOAL-19
type: goal
title: Debugging
created_by: xgd
created_at: '2026-08-06T00:53:39.461163+00:00'
updated_at: '2026-08-06T00:53:39.461163+00:00'
completed_at: null
last_field_updated: created_at
status: concept
fields:
  provenance: planned
---

Making failures in a built site legible — to us while building, and eventually
to the site owner.

Scope is not yet settled. Candidates: surfacing validator rejections in the
editor rather than as raw errors, diagnosing a render that produces the wrong
thing, tracing a structured edit from click to diff to re-render, and the
capture/values-diff instrumentation already used for reproduction work.

Needs a scope pass before it can move off `concept`.
