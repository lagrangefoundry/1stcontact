---
uid: goal-7ccc9c18
id: GOAL-1
type: goal
title: 1stcontact app
created_by: xgd
created_at: '2026-08-06T00:05:21.612213+00:00'
updated_at: '2026-08-24T22:40:43.487227+00:00'
completed_at: null
last_field_updated: children
status: in_progress
fields:
  provenance: planned
  children:
  - goal-d976334c
  - goal-90dcda92
  - goal-026f16b5
  - goal-f3141c51
  - goal-08c4289b
  - goal-80d0e882
  - goal-f7ce1efe
  - goal-ee20e74e
  - goal-d8df6a0f
---

The AI Website Caretaker platform (DOC-4). An AI-powered platform for creating and operating small-business web presences, targeting ~$50/month against the $150-400 agency band. Product positioning: not hosting, not a website builder, not an agency -- an AI Website Caretaker. Customer promise: stop worrying about your website.

MVP scope per DOC-4: modular JAMStack website framework, chat-based website builder, CRM Lite, invoicing and payments, user portal and subscription support, plus a monitoring MVP focused on business outcomes rather than technical metrics.

Architecture per DOC-5: Cloudflare-first (Workers, D1, R2, KV, Durable Objects, Queues), JAMStack public sites, git-like revisions instead of required GitHub repos, magic-link auth, Stripe for payments, AI modifies structured configuration rather than arbitrary site code.

Note on composition: the website framework is a separate project with its own goal map. This project USES those components; the dependency will be wired as a cross-project reference once those goals exist.

State rationale: in_progress by roll-up rule 3 -- the web builder child has started.