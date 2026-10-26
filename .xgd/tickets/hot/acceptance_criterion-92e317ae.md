---
uid: acceptance_criterion-92e317ae
id: AC-2011
type: acceptance_criterion
title: Adding, drawing and removing an asset write bytes and never the site definition,
  and each is journalled
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:11:09.073016+00:00'
updated_at: '2026-10-26T01:11:09.073016+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c46abfa6
  kind: behavior
  regression_only: false
---

## Criterion

Adding a file, drawing an image and removing an asset each change the stored
bytes and leave the site's stored definition byte-identical, and each records
exactly one entry in the draft's change journal naming the asset. The guards act
on the store:

- adding a name the store already holds is refused as a conflict, nothing is
  written, and the refusal names choosing a different stored name as the remedy;
- drawing under a name the store already holds is refused as a conflict unless
  replacement is explicitly asked for, in which case the bytes are replaced;
- removing a name the store does not hold is refused as not found; removing an
  asset a component field still references is refused with a referential-
  integrity error naming the referencing page, component and field unless
  forced, in which case it is removed and the left-over reference count is
  reported.

## Verification

Snapshot a site's stored definition. Add a file, draw an image and remove an
asset in turn; after each assert the stored bytes changed as intended, the
definition is byte-identical to the snapshot, and the journal grew by one entry
for that asset. Assert a second add under the same name and a second draw
without replacement are both refused as conflicts with the store unchanged, and
that a draw with replacement succeeds. Assert removing an asset a component
references is refused unless forced.
