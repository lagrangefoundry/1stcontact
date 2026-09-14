---
uid: acceptance_criterion-cb34e0ec
id: AC-1815
type: acceptance_criterion
title: A Library surface painted before the markdown engines settle repaints once
  they do, including into an already-open expanded window, and a record whose bytes
  are gone says so
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:08:02.437470+00:00'
updated_at: '2026-09-14T07:08:02.437470+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The engines that render markdown arrive after the pane does. Until they have, rendering shows
escaped source — the right answer when they are absent, the wrong one when they are merely late,
which is what the first visit to the workspace looks like. So every Library surface that renders
markdown repaints itself once those engines have settled:

- A detail opened before the engines have settled shows its reader window and its description as
  source, and both are shown rendered once the engines settle — without the client reopening the
  pane, reloading the workspace or touching anything.
- The repaint also reaches an **expanded** window that is already open, so a client reading a
  long document during a cold start sees it upgrade in place rather than having to close and
  reopen it.
- Engines that never arrive settle the wait too: the pane stays readable as escaped source
  rather than waiting forever or showing nothing.
- The description's read cell keeps its own identity across every repaint, so click-to-edit
  keeps working after one: the pane does not trade its editability for its rendering. A
  description with nothing in it keeps its placeholder rather than becoming a rendered blank.
- A record whose bytes never arrive says the file is no longer in storage, in the same words the
  missing-picture case uses, rather than leaving an empty window.

## Verification

Hold the rendering engines unsettled, open a material detail, and observe both the reader window
and the description showing source. Expand the reader while still held. Then settle the engines
and observe both the pane's window and the already-open expanded window showing rendered
markdown, with no further interaction. Settle the engines as failed instead and observe the pane
still readable as escaped source. After a repaint, click the description and observe the editor
still opening over the source. Open a material with an empty description and observe the
placeholder rather than a rendered blank. Point a reader at bytes that cannot be read and observe
the "no longer in storage" statement rather than an empty window.
