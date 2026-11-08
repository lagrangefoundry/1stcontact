---
uid: acceptance_criterion-078e755f
id: AC-2364
type: acceptance_criterion
title: Every host actually sends the model the system prompt, landscape, purpose,
  how-to-search and the turn's reminder, whether the system prompt is one string or
  cache-split blocks
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:33:23.545180+00:00'
updated_at: '2026-11-08T02:33:23.545180+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

On the Node CLI host and on both Worker paths (a conversation with client
knowledge open and one without), what the model is actually sent for a turn
contains the consultant system prompt, then the knowledge landscape, then the
role purpose, then how to search, plus that turn's site-change reminder. This
holds whether the system prompt reaches the model as a single string or as
cache-split text blocks; the blocks are consecutive slices of that same string,
so the order is the order in the joined text.

A host whose knowledge base has not been built still primes coherently: the
model is sent the consultant system prompt followed by the tool manual, and
neither a landscape nor a how-to-search section. It is not refused and does not
fail to start.

A role that fails to carry any of these (for example because a framework change
silently drops a configuration key) fails this criterion. A host that merely
builds and boots does not satisfy it.

## Verification

Through each host, open a conversation and take a turn against the model double.
Read the system prompt the model was sent (joining any text blocks into one
string) and the turn's context:

- the consultant system prompt, the landscape, the purpose and the mechanism are
  all present, in that order;
- the turn carries the site-change reminder naming the site;
- with no knowledge base built, the system prompt and the manual are present and
  no landscape or how-to-search section is;
- the assertions pass whichever shape (string or blocks) the turn produced.
