---
uid: acceptance_criterion-8e517739
id: AC-1263
type: acceptance_criterion
title: The change log is not a revision, is never published, and does not perturb
  the draft's byte-identity
created_by: xgd
created_at: '2026-08-20T02:27:30.946912+00:00'
updated_at: '2026-09-10T08:52:00.818716+00:00'
completed_at: null
last_field_updated: body
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

Publish the site and assert the resulting snapshot contains no change-history artefact.

Then assert the same property the other way round, through what publish itself compares: delete the change history and publish again. An unchanged publish is a no-op, so a change history that were part of the site definition would show up as a change and mint a second revision. Assert instead that the second publish reports nothing published, names the same revision id, carries an empty added/modified/removed diff, and leaves the revision directory holding exactly the files it already held.

Assert the change history is excluded from version control, so an edit leaves no tracked working-tree modification beyond the draft content it changed.
