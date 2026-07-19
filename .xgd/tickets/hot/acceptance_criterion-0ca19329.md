---
uid: acceptance_criterion-0ca19329
id: AC-650
type: acceptance_criterion
title: Partitions nodes into changed vs steady and flags presence flips
created_by: xgd
created_at: '2026-07-19T02:51:01.023090+00:00'
updated_at: '2026-07-19T02:59:24.459692+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-2c7069fe
  kind: behavior
  regression_only: false
---

## Criterion
A node whose tracked properties (font size, font weight, colour, rounded box geometry, or arrangement) differ across the sizes in which it is present is reported as a changed node and listed individually. A node whose tracked properties are identical across every size is counted among the steady nodes rather than listed. A node present in at least one size column but absent from at least one other is flagged as a presence flip. Sub-pixel geometry differences do not mark a node as changed.

## Verification
Run against a fixture containing (a) a node whose font size differs between sizes, (b) a node identical across all sizes, and (c) a node absent from one size. Assert (a) appears in the changed list, (b) is included in the steady count and not listed as changed, and (c) is flagged as a presence flip.