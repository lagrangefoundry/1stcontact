---
uid: acceptance_criterion-078e755f
id: AC-2364
type: acceptance_criterion
title: Every host actually sends the model the system prompt, landscape, purpose and
  how-to-search in the system field, and the turn's reminder at the tail of the last
  user message
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T02:33:23.545180+00:00'
updated_at: '2026-11-10T00:54:16.392278+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

On the Node CLI host and on both Worker paths (a conversation with client
knowledge open and one without), what the model is actually sent for a turn
contains the consultant system prompt, then the knowledge landscape, then the
role purpose, then how to search, plus that turn's site-change reminder. The
priming order holds whether the system prompt reaches the model as a single
string or as cache-split text blocks; the blocks are consecutive slices of that
same string, so the order is the order in the joined text.

The turn's site-change reminder is carried at the tail of the last user message
of the request, appended after the user's own text, and not in the system
field. This holds whichever wire shape that message takes (plain string content
or content blocks). The system field therefore carries only the priming, so no
cache marker is placed on a block that is guaranteed to differ on the next turn.

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
string) and the last user message of the request (joining any text blocks):

- the consultant system prompt, the landscape, the purpose and the mechanism are
  all present in the system prompt, in that order;
- the site-change reminder naming the site is present in the last user message,
  after the user's own text, and is absent from the system prompt;
- the reminder is found in the last user message whether its content is a string
  or a list of content blocks;
- with no knowledge base built, the system prompt and the manual are present and
  no landscape or how-to-search section is;
- the assertions pass whichever shape (string or blocks) the turn produced.



## Evidence note (BUNDLE-44 fix, review report-0ddcefe6 G3)
BUG-83's free-coded reader tests are folded in as `test_UAT_AC2364_the_tail_is_read_in_both_wire_shapes_and_a_quiet_turn_reads_as_absent` (`tests/reconciliation-assistant-reminder-channel.test.ts`). It pins the reader the channel claim is asserted through: in both wire shapes (string content and cache-marked content blocks) the reminder is found at the tail of the last user message only and not in the system field; a quiet turn reads as absent; a request with no trailing user message reads as empty rather than throwing.
