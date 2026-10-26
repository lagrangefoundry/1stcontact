---
uid: acceptance_criterion-e9d20f95
id: AC-2014
type: acceptance_criterion
title: Drawing an image is declared never to stand in for a file the client supplied
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-26T01:11:13.180314+00:00'
updated_at: '2026-10-26T01:11:13.180314+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion

The draw-an-image operation's declared description states that a drawing is
never a stand-in for a file the client supplied: if the client sent a logo,
photograph or mark and it cannot be found or used, the assistant says so and asks
for it to be dropped on the conversation, rather than composing something similar
and placing that on the page. It also says the drawing's description belongs on
the picture element that places it.

This is asserted on the declaration, not on model obedience — nothing
mechanically prevents a model ignoring it.

## Verification

Load the declared control surface and read the draw-an-image operation's
description. Assert it forbids standing a drawing in for a client-supplied file,
tells the assistant to say so and ask for the file instead, and directs the
description onto the placing picture element.
