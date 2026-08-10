---
uid: acceptance_criterion-b982a7e0
id: AC-1059
type: acceptance_criterion
title: A refused operation comes back to the assistant within the same turn as a named
  refusal it can correct, with the site untouched
created_by: xgd
created_at: '2026-08-10T08:36:07.515013+00:00'
updated_at: '2026-08-10T08:36:07.515013+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
When an operation the assistant attempts is refused, the refusal is handed back
into the same turn rather than ending it: it carries a named failure class and a
statement of what to do instead, so the assistant can correct itself and continue
without the operator intervening. The site's draft is byte-identical to before the
attempt — a refused operation writes nothing.

## Verification
Drive a turn in which the assistant addresses something that does not exist, then
speaks. Observe: the refusal reaching the assistant names the failure class and
states a correction, the same turn continues with that refusal in the assistant's
own view of the exchange, and the site's draft is unchanged.
