---
uid: acceptance_criterion-c68052eb
id: AC-2091
type: acceptance_criterion
title: A transcript read failure other than 'no conversation yet' is reported as a
  failure, not as an empty conversation
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T02:37:54.516849+00:00'
updated_at: '2026-11-01T09:51:05.066563+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
When opening a conversation, the one situation that answers with no turns is a
site whose conversation does not exist yet. Any other failure to read the
conversation — a store that cannot be read, a stored conversation that cannot be
loaded — is reported as a failure of the open, and is never presented as a
conversation with no turns. Whether a conversation exists is decided by the
store's own record of which conversations it holds, not by the wording of the
error.

## Verification
Open a site with no stored conversation: the answer succeeds with no turns. Store
a conversation for a site, then make reading it fail while the store's listing
still names it: opening that site fails with the read error rather than answering
with an empty list of turns.