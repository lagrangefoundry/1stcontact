---
uid: comment-0808e3d9
id: COMMENT-1759
type: comment
title: Comment on acceptance_criterion AC-897
created_by: xgd
created_at: '2026-08-31T11:34:56.082041+00:00'
updated_at: '2026-08-31T11:34:56.082041+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: acceptance_criterion-fdcec177
  kind: change
---

Removed by reconciliation of BUNDLE-20 (REQ-149), 2026-08-31.

The operator half of delivery is no longer a content-addressed snapshot deploy run from the operator's machine: publishing now mints a revision, renders it and writes it to shared storage from wherever the store is, and the deploy command that this criterion described has been deleted rather than ported. The behaviour asserted below is not implemented by any code in the repository.

The refusal existed because deploy shipped what publish had minted, so a site with no revisions had nothing to ship. Publish and ship are now one act, so the situation this criterion described cannot arise: a site with no revisions is published, not refused.
