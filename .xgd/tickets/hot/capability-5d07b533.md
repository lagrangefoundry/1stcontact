---
uid: capability-5d07b533
id: CAP-102
type: capability
title: Platform Build, Deploy & Live-Origin Verification
created_by: xgd
created_at: '2026-08-20T05:28:19.444381+00:00'
updated_at: '2026-08-20T15:29:28.644770+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: Platform Build, Deploy & Live-Origin Verification
  uat_coverage: pass
---

Building the platform's own Workers, deploying them, and proving afterwards that what deployed actually serves.

One path for the operator and for any future automation: a build that refuses before it emits a broken artifact, a deploy whose rehearsal is the same code path as the real thing and whose migration and secret seams belong to the tickets that need them, and a post-deploy check that makes HTTP assertions against a live origin and fails naming the assertion that did not hold.

Distinct from CAP-82 (Site Delivery), which ships a *site's* rendered snapshot to shared storage and serves it to a visitor. This capability covers the platform's own Workers and their deployment configuration — the layer CAP-82's serving runs on.