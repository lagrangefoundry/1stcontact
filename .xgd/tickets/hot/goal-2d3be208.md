---
uid: goal-2d3be208
id: GOAL-11
type: goal
title: Subscriptions
created_by: xgd
created_at: '2026-08-06T00:35:21.882736+00:00'
updated_at: '2026-08-06T00:35:33.666359+00:00'
completed_at: null
last_field_updated: status
status: aspiration
fields:
  provenance: planned
---

Recurring billing for the ~$50/month AI Website Caretaker plan -- the revenue mechanic behind the DOC-4 positioning against the $150-400 agency band.

Stripe-backed per DOC-5. Covers plan lifecycle: signup, active/past-due/cancelled state, and the entitlement signal the control app reads to decide what a subscriber can do.

Scope boundary: owns subscription state. The user portal renders it; it does not own it.

State rationale: aspiration. Named in the DOC-4 MVP scope, not yet planned, no code.