---
uid: comment-0b6cc667
id: COMMENT-8022
type: comment
title: Comment on acceptance_criterion AC-1477
created_by: xgd
created_at: '2026-11-08T18:41:08.414024+00:00'
updated_at: '2026-11-08T18:41:08.414024+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-cba32b2b
  kind: note
---

Amended during stabilization (reconcile BUNDLE-41): REQ-190 (5c012c3758) merged the migrations into one 0001_baseline.sql and removed the ALTER TABLE tenants ADD COLUMN config repair, so there is no longer a locally authored statement in the ticket-store step. The criterion now targets the baseline's ticket-store section. The UAT now drops the counters statement by name rather than by position, because the component has since published change-log statements after it.