---
uid: goal-b93b3adc
id: GOAL-53
type: goal
title: 1c complete feature set
created_by: xgd
created_at: '2026-09-18T19:34:41.073556+00:00'
updated_at: '2026-09-18T19:34:41.073556+00:00'
completed_at: null
last_field_updated: created_at
status: aspiration
fields:
  provenance: planned
  depends_on:
  - goal-6be2c058
  children:
  - epic-5d26d63e
  workstream: false
---

Items 6-10 of the beyond-beta list -- what fills out the intended product specification:

6. Registrar functionality: domain purchase and relinquish
7. Invoice and individual payments
8. Scheduling
9. Automated support
10. Automated CI/CD

Epics attached:
- [[EPIC-6]] Registrar management: purchase, transfer, renewal (draft) -- covers 6

Coverage gaps, stated rather than invented: item 7 is inside [[EPIC-9]], which is attached one goal earlier under the xgd launch set. Items 8 and 9 have no epic and no goal anywhere in the map. Item 10 partly overlaps [[EPIC-16]], which is attached to the beta-ready deployment work -- the staging-and-auto-deploy half is beta scope, the wider CI/CD ambition is here.