---
uid: comment-d3b99dae
id: COMMENT-7945
type: comment
title: Comment on bundle BUNDLE-38
created_by: xgd
created_at: '2026-11-07T21:49:35.745417+00:00'
updated_at: '2026-11-07T21:49:35.745417+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: bundle-7988e925
  kind: note
---

Erratum (aligned_to_tip, REQ-904): the sentence "There is no separate migration, because the database has been wiped rather than migrated and a baseline that has never been applied is not re-based by editing it." conflicted with AC-2208. The reference state (`reconcile-src-BUNDLE-38`) does otherwise: `db/migrations/0001_baseline.sql:419-449`, `apps/control-app/src/identity.ts:1228-1260`. The matrix now follows it. AC-2208 asks that a pipeline-stage migration backfill existing contacts by their invite stamp; the REQ-190 rebaseline folded every prior migration into 0001_baseline.sql with pipeline_stage as a baseline column, and the bundle states the database was wiped rather than migrated, so no intent in scope requires a backfill and the reference has none to test.