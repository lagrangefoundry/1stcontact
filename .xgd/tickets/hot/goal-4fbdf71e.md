---
uid: goal-4fbdf71e
id: GOAL-49
type: goal
title: Supporting functionality sufficient and tested
created_by: xgd
created_at: '2026-09-18T19:33:57.174315+00:00'
updated_at: '2026-09-18T19:33:57.174315+00:00'
completed_at: null
last_field_updated: created_at
status: underway
fields:
  provenance: planned
  workstream: true
  children:
  - epic-c5175c8f
  - epic-45f2e9a6
  - epic-312f9446
  - epic-c6e64078
  - epic-0aefcf91
---

Item 5 of the beta-ready list: the DNS migration flow completed and tested, plus basic test, monitoring, logging and deployment.

Noted by the operator as not strictly needed to *start* beta, but not to be delayed much beyond it either. A beta tester who points a real domain at us and loses their mail is a beta that ends early.

Epics attached:
- [[EPIC-5]] DNS management: nameservers, records, and AI tools (done)
- [[EPIC-7]] DNS checks and monitoring (draft)
- [[EPIC-15]] Basic flow monitoring: synthetic traffic that proves the flows (underway, high priority)
- [[EPIC-18]] Logging (draft, body still empty)
- [[EPIC-11]] Contact activity log: every server-side event, session rollup on the timeline (done)