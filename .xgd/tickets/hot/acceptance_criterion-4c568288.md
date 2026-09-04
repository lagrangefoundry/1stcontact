---
uid: acceptance_criterion-4c568288
id: AC-1598
type: acceptance_criterion
title: 'A grant''s period is evaluated on every login: a passed end refuses, a future
  end admits, a start not yet reached refuses'
created_by: xgd
created_at: '2026-09-04T05:52:33.997769+00:00'
updated_at: '2026-09-04T06:00:22.512306+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

A grant's period is evaluated on every login, from both ends:

- a grant whose end has already passed does **not** admit — access promised as bounded
  actually stops;
- a grant whose end is still in the future admits;
- a grant with no end admits;
- a grant whose start has not yet been reached does **not** admit, so access written ahead
  of time does not begin early.

The evaluation is against the moment of the login, not against a value captured when the
grant was written.

## Verification

For an invited person, drive each case by setting the grant's period around a controlled
"now": end in the past, end in the future, no end, and start in the future. Assert refusal
for the first and last, and admission for the middle two. Assert the same grant flips from
admitting to refusing purely by advancing the moment the login is evaluated at, with no
other change.