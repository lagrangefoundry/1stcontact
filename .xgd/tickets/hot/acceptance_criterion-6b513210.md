---
uid: acceptance_criterion-6b513210
id: AC-2093
type: acceptance_criterion
title: Writes made by a rejoined turn reload the page beside the conversation just
  as a turn started in the pane does
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T03:06:13.037849+00:00'
updated_at: '2026-11-01T03:06:13.037849+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
---

## Criterion

A turn the pane rejoined after a reload writes to the site just like a turn the operator
sent from the pane, and the page beside the conversation follows those writes the same
way. Each time the rejoined turn reports that the site moved, the displayed page is
fetched again as the write is reported. A reloaded workspace is therefore never the one
place where the assistant's edits happen without the preview catching up.

As with a turn sent from the pane, the report is not shown in the conversation: it adds
no message and no activity entry. If the re-fetch fails, the rest of the rejoined reply
still arrives.

## Verification

Open the pane on a live conversation whose rejoin stream reports a write between pieces
of reply text. Confirm the displayed page is fetched again once for that report, that the
reply text before and after it lands in the same assistant message, and that nothing for
the report appears in the message list or activity area. Make the re-fetch throw and
confirm the remainder of the reply still arrives.
