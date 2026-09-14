---
uid: acceptance_criterion-ba0d9e63
id: AC-1812
type: acceptance_criterion
title: An expand control opens the same document at modal size in the workspace's
  own dialog, and browsing to another row takes the expanded window with it
created_by: martin-github@westhead.me
created_at: '2026-09-14T07:07:14.345019+00:00'
updated_at: '2026-09-14T07:07:14.345019+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

A document long enough to be worth reading is worth reading at more than pane width, so the
reader carries an expand control in its top corner:

- Pressing it opens **the same content, at modal size**, in the workspace's own dialog — the
  same dialog every other builder modal uses, so Escape, a click on the backdrop and the close
  button all shut it without this pane defining any of them. The dialog is named for the file it
  is showing.
- The expanded window and the pane's window are the same material: content that arrives, or is
  re-rendered, after the dialog is already open reaches both.
- The expanded window belongs to the material it was opened from. Browsing to another row takes
  it with it — the client is never left with one document's expanded window hanging over the row
  that replaced it.
- Closing the expanded window leaves the pane's own reader where it was, and the control reopens
  it.

## Verification

Select a document the reader can show, press the expand control, and observe the same content
presented at modal size in the workspace's dialog with the file's name on it. Press Escape and
observe it close; press the control again and observe it reopen with the same content. With the
dialog open, select a different row in the list and observe the expanded window gone rather than
left standing over the new selection.
