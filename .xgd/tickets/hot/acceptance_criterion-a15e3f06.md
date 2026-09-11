---
uid: acceptance_criterion-a15e3f06
id: AC-1754
type: acceptance_criterion
title: Where several grants cover now, the one preserving access longest is the effective
  one
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:16.617290+00:00'
updated_at: '2026-09-11T06:29:16.617290+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Where an account holds several grants, admission selects the one that preserves
access longest among those active and covering the moment: an open-ended grant is
preferred to a bounded one, and among bounded grants the one ending latest wins.
Grants that have lapsed are ignored rather than selected, so an account whose
trial ended while its longer grant ran is not locked out by its own history.

## Verification

Give one account three grants — one already ended, one ending shortly, one
open-ended — and attempt admission. Assert it succeeds and the reported grant is
the open-ended one. Then remove the open-ended grant and assert the grant ending
latest among those still covering now is reported.
