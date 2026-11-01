---
uid: acceptance_criterion-88e1a60a
id: AC-2089
type: acceptance_criterion
title: A turn whose client disconnects still runs to completion and is archived, because
  the host holds the request open for it
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T02:37:51.605379+00:00'
updated_at: '2026-11-01T09:51:06.469415+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
On the deployed edge runtime, when the caller of a turn goes away mid-stream (the
page is reloaded or the connection drops), the turn's ending — its completion
record and the sync into the durable conversation — is not abandoned with the
connection. The host asks the runtime to keep the request alive until that ending
has finished, and what it asks the runtime to wait for is sufficient on its own for
the turn to be in the stored conversation. A turn that stopped because its caller
left ends as aborted, not complete. On a transport that has no such facility (the
operator's machine) the turn behaves exactly as before.

## Verification
Start a turn through the deployed prompt route and cancel the response stream
after the first streamed chunk. Assert the host handed the runtime at least one
promise to wait on (zero before this behaviour existed). Await only the promises
handed to the runtime, then read the stored conversation: the operator's message
and the assistant's partial reply are present. Rejoin from a cursor taken before
the turn began: the completion reports the turn's status as aborted. An assertion
on the stored conversation alone is not sufficient evidence, because nothing tears
the runtime down under test and an unregistered ending would finish anyway.