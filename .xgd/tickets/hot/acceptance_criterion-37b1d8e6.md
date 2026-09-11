---
uid: acceptance_criterion-37b1d8e6
id: AC-1638
type: acceptance_criterion
title: A regenerated reference whose source has not changed keeps its existing timestamp
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:35:48.987496+00:00'
updated_at: '2026-09-11T02:51:27.075515+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

Regenerating the reference when its source has not changed leaves the existing
document untouched: the document's modification time — which is the timestamp the
corpus presents to the index — is the same before and after the run, and the
index therefore re-embeds nothing.

A rewrite that changed nothing would bump every stamp, re-embed the entire
reference on every build at cost, and tell the ranker that every reference
document had just changed.

## Verification

Generate the references, record each document's modification time, then generate
again with the sources unchanged and compare: the times are identical. Change a
source so one reference's content differs, generate again, and observe that
document's time advances while the others' do not.