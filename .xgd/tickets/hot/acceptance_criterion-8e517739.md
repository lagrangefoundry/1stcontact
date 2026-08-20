---
uid: acceptance_criterion-8e517739
id: AC-1263
type: acceptance_criterion
title: The change log is not a revision, is never published, and does not perturb
  the draft's byte-identity
created_by: xgd
created_at: '2026-08-20T02:27:30.946912+00:00'
updated_at: '2026-08-20T02:46:15.038570+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

Recording a change creates no revision: no revision id is minted, the publish history gains no entry, and nothing in the change log participates in publish or checkout.

The change log is also not part of the draft's version-controlled content and is never captured by a published snapshot — a publish taken after a run of edits produces exactly the artefact it would have produced with no change history present, byte for byte.

## Verification

Make several edits, then assert the site's revision list and publish history are unchanged by them.

Publish the site and assert the resulting snapshot contains no change-history artefact, and that its contents are byte-identical to a snapshot published from the same draft content when no change history exists.

Assert the change history is excluded from version control, so an edit leaves no tracked working-tree modification beyond the draft content it changed.