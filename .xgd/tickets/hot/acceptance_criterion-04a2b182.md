---
uid: acceptance_criterion-04a2b182
id: AC-1528
type: acceptance_criterion
title: The landscape rebuild a new document triggers runs behind the recording, never
  inside it
created_by: xgd
created_at: '2026-09-04T03:36:29.556252+00:00'
updated_at: '2026-09-04T03:36:29.556252+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0fb17a68
  kind: behavior
  regression_only: false
---

## Criterion

The landscape rebuild that a new document triggers happens *behind* the recording, never inside it.
When a document is recorded:

- the recording completes and reports back while the rebuild is still in progress — observably so,
  even when producing the landscape requires a slow description step that has been reached but has
  not yet returned;
- the landscape published for that client at that moment is still the one that was published before
  (or still none, if none had been built), so the recording did not wait for it;
- the rebuild is handed to the host's deferred-work channel rather than run in the caller's own
  chain, and the caller is nonetheless given a handle to that rebuild so a caller that genuinely
  wants to wait (a background consumer, a test) can;
- once the deferred rebuild finishes, the landscape published for the client is the newly built one.

A rebuild that fails does not fail the recording: the document stays recorded and searchable, the
previously published landscape is left in place, and the next document recorded tries again.

## Verification

Record a document with the description step held on a barrier. Observe that the recording has
already reported back, that the document is searchable, that the description step has been entered
but not completed, and that the published landscape is unchanged. Release the barrier, wait on the
rebuild handle the recording returned, and observe the published landscape is now the newly built
one. Separately, make the rebuild fail and observe the recording still succeeds with the previously
published landscape intact.
