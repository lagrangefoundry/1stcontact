---
uid: acceptance_criterion-54bad87d
id: AC-1300
type: acceptance_criterion
title: A build with nothing carrying the membership kind is refused naming the kind
  and the field, and reaches no model
created_by: xgd
created_at: '2026-08-20T04:16:56.986889+00:00'
updated_at: '2026-09-04T02:15:27.995241+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A build against a store in which no document carries the membership kind is **refused**, and the refusal names the cause: that membership is a *kind rather than a flag*, which marker to set, on which field, and on which type of document. It does not report "no documents", which would send an operator looking in the wrong place entirely.

The refusal happens before any embedding is attempted, so no index, no passage index and no map are produced, and no model is reached.

## Verification

Run a build against a document store in which nothing carries the membership kind; assert the command fails, that the failure message names the marker field, the value it must hold and the document type — rather than reporting an empty store — and that neither index directory nor the map exists afterwards.
