---
uid: goal-ea2db3b7
id: GOAL-47
type: goal
title: 'Live and updatable: site, app, and the flows that ship them'
created_by: xgd
created_at: '2026-09-18T19:33:32.143109+00:00'
updated_at: '2026-09-18T19:33:32.143109+00:00'
completed_at: null
last_field_updated: created_at
status: underway
fields:
  provenance: planned
  workstream: true
  children:
  - epic-96d8aca6
  - epic-d6d7ea63
  - epic-0728e1c5
---

Items 1-3 of the beta-ready list:

1. 1st Contact site and app published on Cloudflare
2. Test and deployment flows fully understood
3. Sign-in / sign-up flow tested

The common thread is operability, not features: what exists today is reachable by a stranger, and the operator can change it and ship the change with confidence. None of this is hard; all of it is in the way of letting anyone else near the product.

Epics attached:
- [[EPIC-16]] Staging environment and automated deploy (draft) -- the deployment flow itself
- [[EPIC-10]] Forms: capture, acceptances, onboarding (underway) -- the sign-up path and the acceptances it records
- [[EPIC-4]] Settings tab: business, site and subdomain management (done) -- the app surface a tester lands on