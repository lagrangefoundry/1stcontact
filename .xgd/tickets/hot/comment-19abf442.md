---
uid: comment-19abf442
id: COMMENT-8021
type: comment
title: Comment on acceptance_criterion AC-1476
created_by: xgd
created_at: '2026-11-08T18:40:51.592147+00:00'
updated_at: '2026-11-08T18:40:51.592147+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-a11b6ab8
  kind: note
---

Stabilization (reconcile BUNDLE-41): REQ-190 (5c012c3758) merged db/migrations 0001-0009 into one 0001_baseline.sql and dropped the ALTER TABLE tenants ADD COLUMN config repair. The ticket-store step is now a section of the baseline, after the tenants registry and the site store's tables. The UAT in tests/reconciliation-product-ticket-store-schema.test.ts now asserts that shape (one baseline file, tickets/counters created after sites, apply-from-empty, re-apply no-op, harness enumeration). The criterion body still names a separate step ordered after the site store's step and should be amended to the baseline wording.