---
uid: acceptance_criterion-1d90d433
id: AC-926
type: acceptance_criterion
title: Each store tree keeps its own deploy index, referencing only its own snapshots
created_by: xgd
created_at: '2026-08-06T20:15:51.667155+00:00'
updated_at: '2026-08-16T07:23:28.809256+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The deploy index is per store tree, not per slug. Deploying a site from one tree
leaves the other tree's index byte-identical — same previews, same revisions,
same live pointer — and each index lists only the snapshots shipped from its own
tree. In particular, a published deploy from the scratch tree cannot overwrite a
real site's published bytes, cannot move the real site's live pointer, and cannot
append an entry to the real site's index, even when both sites share a slug and
both are at the same revision number.

## Verification

Publish and deploy revision 1 of a real site with distinguishable content, record
its index bytes, then publish and deploy revision 1 of a same-slug scratch site
on the published channel. Assert the real site's index bytes are unchanged, its
live pointer and revision entry are unchanged, and the stored bytes under its
revision location still carry the real site's content and not the scratch site's.
Assert each tree's index lists exactly the snapshot ids deployed from that tree.