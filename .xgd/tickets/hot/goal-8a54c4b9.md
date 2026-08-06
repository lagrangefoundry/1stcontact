---
uid: goal-8a54c4b9
id: GOAL-18
type: goal
title: Email capture backend
created_by: xgd
created_at: '2026-08-06T00:53:35.644366+00:00'
updated_at: '2026-08-06T00:53:35.644366+00:00'
completed_at: null
last_field_updated: created_at
status: aspiration
fields:
  provenance: planned
---

The server side of lead capture: a form on a built site posts, the submission
lands somewhere durable, and the site owner is notified.

The *front* end exists — the `contact-form` behavior module with its honeypot
and Turnstile surface, already placed on the XGD site's PROOF section. What is
missing is everything behind the endpoint.

Architecture is written (DOC-4 Monitoring/CRM, DOC-5): public form endpoints live
on the `public-site` Worker, submissions become lead records, spam is handled by
Turnstile + honeypot + rate limiting, and public forms never require login.

Blocks XGD website Phase 1 "Email capture deployed".
