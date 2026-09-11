---
uid: acceptance_criterion-9afd9efa
id: AC-1666
type: acceptance_criterion
title: A grown conversation is indexed in character batches, and the batch point advances
created_by: martin-github@westhead.me
created_at: '2026-09-11T03:47:35.419443+00:00'
updated_at: '2026-09-11T04:01:57.567619+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ea7b4646
  kind: behavior
  regression_only: false
---

## Criterion

A conversation that has grown is indexed in batches measured in characters, and
the batch point advances so the same growth is never indexed twice.

For a conversation whose recorded length has grown by **less than** the batching
threshold since it was last indexed, the growth notification indexes nothing and
reports that it did not index, together with how much growth it saw.

For a conversation whose recorded length has grown by **at least** the threshold,
the notification reports that it indexed, and searching the client's knowledge
for wording that appears only in that conversation returns it.

A further notification reporting a length only slightly beyond the one just
indexed indexes nothing again — the batch point is durable and sits at the
length last indexed, not at zero.

The conversation record itself is unchanged by having been indexed: no counter,
cursor or bookkeeping field appears on it. Indexing bookkeeping is derived data
belonging to the knowledge base, not part of the conversation's own contract.

## Verification

Create a conversation record in a client's store with distinctive content.
Notify the knowledge base of a length one character below the threshold: assert
the result reports not-indexed and that no index pass ran. Notify again at a
length beyond the threshold: assert it reports indexed, then search for a phrase
unique to that conversation and assert the conversation is among the hits.
Notify a third time at a length only a few hundred characters beyond the second:
assert it reports not-indexed, and assert the recorded batch point equals the
length at the second notification. Finally re-read the conversation record and
assert its own fields are exactly those it was created with.