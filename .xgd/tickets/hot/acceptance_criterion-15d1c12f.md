---
uid: acceptance_criterion-15d1c12f
id: AC-1052
type: acceptance_criterion
title: Opening a conversation for a named site answers with its identifier, the turns
  already spoken, and whether a turn can be run
created_by: xgd
created_at: '2026-08-10T08:35:29.808231+00:00'
updated_at: '2026-08-16T05:22:24.401903+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Naming a site opens that site's conversation and is the only operation that turns
a site into a conversation. The answer carries: an identifier for the
conversation, the turns already spoken in order with each marked as the
operator's or the assistant's, and whether a turn can be run — with an
operator-readable reason when it cannot. A site with no conversation yet answers
with an empty list of turns, which is normal rather than an error.

## Verification
Open a conversation for a site that has never been used: the answer carries an
identifier, an empty turn list, and reports it is ready. Speak a turn, then open
the same site again: the answer carries the same identifier and both turns, in
order, attributed correctly.