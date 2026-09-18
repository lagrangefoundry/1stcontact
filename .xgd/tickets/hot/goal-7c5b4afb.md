---
uid: goal-7c5b4afb
id: GOAL-50
type: goal
title: 1c Beta Ready
created_by: xgd
created_at: '2026-09-18T19:34:07.801448+00:00'
updated_at: '2026-09-18T19:34:07.801448+00:00'
completed_at: null
last_field_updated: created_at
status: underway
fields:
  provenance: planned
  children:
  - goal-ea2db3b7
  - goal-f6704841
  - goal-4fbdf71e
  workstream: false
---

Bring 1st Contact to the point where beta testers can use it and give feedback.

This replaces [[GOAL-1]] (1stcontact app) as the organising root. GOAL-1 was a description of the product, not a finishable objective -- it could never be closed, so it could never say whether anything was progressing. Beta Ready can be closed.

Three parts, from the operator breakdown of 2026-09-18:

1. **Live and updatable** -- site and app published on Cloudflare, test and deploy flows understood, sign-in/sign-up tested. Straightforward, and satisfying to finish.
2. **Core web dev experience tested and effective** -- where most of the time goes. Build out Lagrange Foundry, the teaser site, xgd, and example sites from scratch; every friction found becomes an [[EPIC-19]] child.
3. **Supporting functionality sufficient and tested** -- DNS migration, basic test, monitoring, logging, deployment. Not blocking the start of beta; not far behind it either.

No target_date yet. The three sub-goals are marked as workstreams, which is the daily resolution the operator actually works at.