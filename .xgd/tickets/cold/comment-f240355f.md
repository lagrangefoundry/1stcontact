---
uid: comment-f240355f
id: COMMENT-62
type: comment
title: Comment on request REQ-36
created_by: xgd
created_at: '2026-07-08T17:42:36.707987+00:00'
updated_at: '2026-07-08T17:42:36.707987+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: request-d05379d0
  kind: note
---

**CAP-1 (bare cards) landed** — commit 9e9fda0, v0.0.66. Grid-wide `cardSurface: bare` dial on services-grid; applied to Offerings + Process grids. Perceptual diff **mean 64.57 → 46.68** (−18); the offering/process white-box regions (former #1/#3/#4) cleared. UATs green (test_UAT_FC_REQ-36_bare_*, +46 module tests no regression). Hero is now the top region (#1, mean 100) → CAP-3 uppercase + CTA next; CAP-2 gold headings hits the pervasive grey-band headings.