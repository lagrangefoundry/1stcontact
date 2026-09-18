---
uid: goal-ec95bb0a
id: GOAL-51
type: goal
title: 1stcontact ready for launch / extended beta
created_by: xgd
created_at: '2026-09-18T19:34:23.470722+00:00'
updated_at: '2026-09-18T19:34:23.470722+00:00'
completed_at: null
last_field_updated: created_at
status: aspiration
fields:
  provenance: planned
  depends_on:
  - goal-7c5b4afb
  children:
  - epic-bed5a03b
  workstream: false
---

Mostly about fully rounding out and testing the non-functional features -- the things a closed beta tolerates and a public launch does not.

The functional surface is largely the beta surface. What changes is the standard it is held to: security, resilience, observability, the behaviour under a user who did not get a briefing first.

Epics attached:
- [[EPIC-17]] Security Analysis (ongoing) -- a standing threat model, revisited at the design time of each epic rather than as a one-off audit

Depends on [[1c Beta Ready]]. That edge is an inference from the ordering in the operator breakdown of 2026-09-18, not something stated outright -- easy to cut if it is wrong.