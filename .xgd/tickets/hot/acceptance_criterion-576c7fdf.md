---
uid: acceptance_criterion-576c7fdf
id: AC-572
type: acceptance_criterion
title: Systemic sub-threshold aggregation escalates a pervasive LOW/MEDIUM kind into
  one capped-at-HIGH headline row
created_by: xgd
created_at: '2026-07-10T01:47:25.024389+00:00'
updated_at: '2026-07-10T01:47:25.024389+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
A LOW- or MEDIUM-tier delta kind that recurs across at least N elements (default N=5) produces one additional synthetic **systemic** headline row summarising the pervasive drift, alongside — not instead of — the per-element rows. The headline row's tier is escalated by how pervasively the kind repeats (one tier at the threshold, a further tier per additional 3×), but is capped at HIGH so a pervasive tonal drift can never masquerade as a CRITICAL structural break. This prevents a small per-element delta repeated across ~30 elements (e.g. a near-black-vs-slate body tone) from being individually below notice yet collectively obvious. Setting the threshold to 0 disables aggregation.

## Verification
Diff a case where the same LOW/MEDIUM kind (e.g. a colour drift) appears on well over the threshold number of elements; assert one escalated systemic headline row is emitted at a higher-but-capped-at-HIGH tier while the individual per-element rows remain present; assert no such row is emitted below the threshold.
