---
uid: acceptance_criterion-348f78bb
id: AC-627
type: acceptance_criterion
title: Tables round-trip as a 2-D grid whose cells hold block content
created_by: xgd
created_at: '2026-07-13T21:00:57.489852+00:00'
updated_at: '2026-07-13T21:00:57.489852+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8b5ebbf7
  kind: behavior
  regression_only: false
---

## Criterion
A table is a 2-D grid of rows by cells; each cell is a container of child blocks (not merely inline runs). A table round-trips losslessly, preserving row/column arrangement and each cell's block content.

## Verification
Round-trip a table with multiple rows and columns and assert the grid dimensions and per-cell content are preserved; round-trip a table whose cell holds block content (e.g. a paragraph or list) and assert the cell blocks survive.
