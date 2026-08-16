---
uid: acceptance_criterion-aecd6a53
id: AC-1057
type: acceptance_criterion
title: The conversation is stored with the workspace the site belongs to and replayed
  after the origin restarts
created_by: xgd
created_at: '2026-08-10T08:35:57.540058+00:00'
updated_at: '2026-08-16T05:46:10.144024+00:00'
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
A conversation's turns are persisted with the workspace the site belongs to — not
in a machine-wide location shared across checkouts — and are replayed on the next
open, including after the origin has restarted and lost everything it held in
memory. What the assistant remembers of the conversation is what the operator is
shown.

## Verification
Speak a turn, discard all in-memory state as a restart would, then re-open the
site's conversation: it reports ready and replays both turns with their original
text and attribution. Removing the workspace's conversation storage and re-opening
yields an empty conversation, demonstrating that is where it lived.