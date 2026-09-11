---
uid: acceptance_criterion-68c3c100
id: AC-1649
type: acceptance_criterion
title: An absent knowledge base is loud in the application build's report and a packed
  one is counted
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:56:41.415487+00:00'
updated_at: '2026-09-11T02:56:41.415487+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c4f329d3
  kind: behavior
  regression_only: false
---

## Criterion

The application build's report gives the knowledge base a line of its own, and it is the one line in that report allowed to shout.

- **Nothing packed**: the line is marked as a warning, says in plain words that the assistant will ship with no system knowledge, and names the command that repairs it.
- **Something packed**: the line is ordinary — how many documents were packed and how large the artefact is — and carries no warning marker at all, so the warning keeps meaning something when it does appear.

Degrading gracefully and saying nothing are different things. The runtime is meant to survive a knowledge base that was never built; the operator is not meant to find that out from a client. An assistant shipped with no knowledge tools looks exactly like one that has them until it answers a question badly, weeks later, and this line is where that gets said at the moment somebody could still fix it.

## Verification

Produce the report for both states. Assert the absent state's line carries the warning and names the repair command by name; assert the built state's line reports the document count and carries no warning marker.
