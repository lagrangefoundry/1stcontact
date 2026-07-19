---
uid: acceptance_criterion-802f0534
id: AC-675
type: acceptance_criterion
title: services-grid cardBorder=none removes the card hairline but an accented card
  keeps its accent left bar
created_by: xgd
created_at: '2026-07-19T03:34:46.719171+00:00'
updated_at: '2026-07-19T03:34:46.719171+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-46e3b3c7
  kind: behavior
  regression_only: false
---

## Criterion
When a services-grid is authored with `cardBorder: none`, rendered cards have no 1px hairline border. A card that also carries an accent still renders its accent left bar (a thicker left-edge border in the accent colour). With `cardBorder` unset or `default`, cards render the standard 1px hairline border.

## Verification
Render a grid with `cardBorder: none` containing both a plain card and an accented card. Confirm the plain card shows no border, the accented card shows only its accent left bar (and no hairline on the other edges), and that switching back to the default renders the 1px hairline on all cards.
