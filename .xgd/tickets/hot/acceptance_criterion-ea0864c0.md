---
uid: acceptance_criterion-ea0864c0
id: AC-1507
type: acceptance_criterion
title: An unchanged reference keeps its last-changed time, so the index does not re-embed
  it every build
created_by: xgd
created_at: '2026-09-04T02:27:00.946501+00:00'
updated_at: '2026-09-04T02:41:25.146149+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

A generated reference whose content has not changed since the last build is left exactly as it was — its last-changed time does not move. Only a reference whose content actually differs is rewritten.

The knowledge index re-embeds a document when its last-changed time moves, so a build that rewrote every reference identically would re-embed the entire reference set on every build, at cost, while telling the ranker that every fact in it had just changed.

## Verification

Build the references, record each document's last-changed time, then build again with every source unchanged. Assert no last-changed time has moved. Then change one source and build a third time; assert only that source's reference has a new last-changed time and the others are still untouched.