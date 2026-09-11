---
uid: acceptance_criterion-54bad87d
id: AC-1300
type: acceptance_criterion
title: A build with nothing carrying the membership kind is refused naming the kind,
  and reaches no model
created_by: xgd
created_at: '2026-08-20T04:16:56.986889+00:00'
updated_at: '2026-09-10T08:04:30.783334+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A build against a store in which no document carries the membership kind is **refused**, and the refusal names the cause: that membership is a kind and not a flag, which kind to set, on which field, and on which type of document. It does not report "no documents", which would send an operator looking in the wrong place entirely; and it names the *kind*, not the retired boolean, so the message points at the rule actually in force.

Where documents exist but carry another kind, the refusal says how many do — the one place in this pipeline where a count stands in for a list, because there the list is the whole store and the operator's problem is the marker rather than any particular document.

The refusal happens before any embedding is attempted, so no index, no passage index and no map are produced, and no model is reached.

## Verification

Run a build against a document store in which nothing carries the membership kind; assert the command fails, that the failure message names the kind field, the member kind value and the document type rather than reporting an empty store, that it does not name the retired boolean, and that neither index directory nor the map exists afterwards.
