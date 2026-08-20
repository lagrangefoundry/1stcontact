---
uid: acceptance_criterion-54bad87d
id: AC-1300
type: acceptance_criterion
title: A build with nothing opted in is refused naming the opt-in mechanism, and reaches
  no model
created_by: xgd
created_at: '2026-08-20T04:16:56.986889+00:00'
updated_at: '2026-08-20T04:37:25.102044+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

A build against a store in which no document has opted in is **refused**, and the refusal names the cause: that membership is opt-in, which flag to set, and on which kind of document. It does not report "no documents", which would send an operator looking in the wrong place entirely.

The refusal happens before any embedding is attempted, so no index, no passage index and no map are produced, and no model is reached.

## Verification

Run a build against a document store in which nothing carries the opt-in flag; assert the command fails, that the failure message names the opt-in field and the document type rather than reporting an empty store, and that neither index directory nor the map exists afterwards.