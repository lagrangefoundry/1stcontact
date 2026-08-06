---
uid: acceptance_criterion-cff7798d
id: AC-899
type: acceptance_criterion
title: Prune deletes only stored snapshot objects the deploy index does not reference
created_by: xgd
created_at: '2026-08-06T18:39:49.163342+00:00'
updated_at: '2026-08-06T18:46:00.963269+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

With the prune option, a deploy removes exactly those stored snapshot objects
that no entry in the site's deploy index points at — the orphans left by a deploy
whose upload or index write was interrupted — and reports each deletion.
Everything the index references is untouched, as is the index itself. Objects
under the site that are not snapshot objects are left alone rather than swept up.
A second prune with nothing orphaned deletes nothing and says so.

## Verification

Deploy a site, then plant an orphan snapshot (objects written and recorded under
a snapshot location that no index entry names). Deploy again with prune. Assert
the reported deletions are exactly the orphan's objects, that reading those
objects afterwards yields nothing, that the referenced snapshot's entry page and
the deploy index are still readable, that the index's preview list is unchanged,
and that a further prune reports nothing to collect.