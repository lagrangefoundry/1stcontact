---
uid: acceptance_criterion-871fba3a
id: AC-1063
type: acceptance_criterion
title: The pane shows what that site's conversation already contains on first open
  and after the workspace is reloaded, including a turn still in progress, which it
  continues to receive
created_by: xgd
created_at: '2026-08-10T08:46:30.897019+00:00'
updated_at: '2026-11-01T03:06:05.186777+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7f437d57
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The messages shown in the pane are the turns that site's conversation already holds, in
the order they were spoken and with each turn attributed to whoever said it. This is
true when the workspace is first opened and again after it is reloaded, so what the
assistant remembers is what the operator can see. A site with nothing said yet shows an
empty conversation with an invitation to type, not another site's messages and not a
blank pane.

That includes a turn still in progress when the pane opens. A reload during an
assistant reply does not lose the operator's message or the part of the reply already
written: both are shown. The pane then keeps receiving the rest of that reply rather
than leaving it frozen part-way (how it continues is stated on the rejoin criterion).

Replay does not begin until the markdown engines the pane renders with have settled.
Each turn is painted once and cannot afterwards be redrawn, so a conversation handed to
the pane while the renderer is still arriving would stay as its own markdown source —
`**bold**`, `## heading`, `- item` — for the life of the page, which is what made the
conversation look right only after a reload and wrong on a first, uncached one. The wait
runs alongside the opening of the conversation rather than after it, so it costs no more
than the slower of the two. It applies equally to the note the pane writes when the
conversation cannot be opened at all, because that note is markdown too.

An engine that genuinely cannot load settles the wait exactly as a loaded one does: the
transcript is then shown as readable escaped text in a plainer panel. Replay is never
withheld indefinitely and never waits forever on a renderer that is not coming.

## Verification

Open the workspace for a site whose conversation already holds turns; compare the
messages rendered in the pane against the turns the conversation reports, including
their order and their speakers. Reload the workspace and confirm the same turns are
shown again. Repeat for a site with no history and confirm an empty conversation with
its invitation to type.

Open the pane on a conversation reported as having a turn in progress, whose transcript
ends with the operator's message and part of a reply. Confirm the operator's message is
shown, the partial reply text is visible, and further text for that turn then appears
in the pane.

For the ordering: hold the markdown engines' readiness open while the conversation's
turns are already available, and confirm the pane has painted no message at all. Release
the readiness and confirm the turns then appear as rendered markdown — emphasis and list
items as real elements, with no markdown markers left in the visible text. Repeat with a
conversation that cannot be opened and confirm the pane's own failure note is likewise
withheld until readiness settles and then reads as prose rather than as its markers.
Finally, run the same open with the engines unreachable and confirm readiness still
settles and the pane still shows the conversation, as escaped text.
