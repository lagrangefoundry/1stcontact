---
uid: bug-00de1faf
id: BUG-79
type: bug
title: 'Builder: View/Edit flips in place instead of reloading the pane'
created_by: martin-github@westhead.me
created_at: '2026-09-11T01:55:00.746671+00:00'
updated_at: '2026-09-11T02:05:07.408069+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d003a9da
  severity: medium
---

## Symptom

Switching between View and Edit on the site tab loses where the operator was:
the pane goes blank for a beat, the page re-renders from the top, and the
scroll position is gone. Moving back and forth — which is the whole point of
having a toggle — costs a re-render and a re-scroll every time.

## Root cause

The display panel has ONE iframe and a mode is a `src` on it. A channel switch
therefore *navigates* that frame: the document the operator was looking at is
destroyed and a new one is built from the origin.

[[REQ-215]] carries the page state (which page, how far down it, which panels
are open) across that navigation and re-applies it on `load`. That is the right
thing to carry and it is not enough: a restore applied to a document that has
only just arrived is not the same as never having lost it. The pane still
flashes, the render still restarts, and the offset is re-applied against a
layout that is not necessarily final at `load` — so the operator sees the page
at the top and, at best, jump.

The fix is not a better restore. It is not to navigate.

## Fix

**One frame per document mode, kept alive; a switch swaps which one is
visible.**

- The panel creates a frame for a mode the first time that mode is shown, and
  keeps it. Switching mode shows one and hides the others.
- Hidden means `visibility`, not `display`. A `display: none` iframe is out of
  layout and does not keep its scroll offset; a `visibility: hidden` one is
  laid out, unpainted, and holds exactly where it was.
- A frame navigates only when what it shows is genuinely out of date: its first
  activation, a change of site, an explicit `refresh()` (a business switch), or
  a write. Never for a mode switch.
- The carried state still syncs the two channels — captured from the outgoing
  document, applied to the incoming one — but it now lands on a document that
  is already laid out, which is what makes the offset land exactly rather than
  approximately.

Technical consequences of the above, stated so they are not discovered later:

- **The panel announces its document on show, not only on load.** A frame that
  is already loaded fires no `load` event when it is revealed, and the builder
  binds the edit bridge, Marked Points and the carry on that announcement. So
  `document` is emitted when a loaded frame is shown as well as when one loads.
- **`panel.reloadDocument()` replaces the three `frame.contentWindow.location
  .reload()` call sites** (palette write, assistant write, segment save). With
  more than one live document, "reload the preview" has to mean *reload the one
  on screen and mark the others out of date* — a hidden frame must not serve a
  stale render the next time it is shown, and must not pay for a render nobody
  is looking at either.
- **`panel.frame` is the active frame.** It stays a property so its readers do
  not change; it resolves to whichever frame is currently showing.

## Test plan

`tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`, against the real composition
(`mountBuilder`, the real panel and toolbar) as the other builder suites are:

- a mode switch does not navigate — the document object the operator was
  looking at is the same one after switching away and back
- the outgoing frame stays laid out while hidden (`visibility`, not `hidden`/
  `display: none`), so its scroll survives
- the incoming document is announced on show, and the carried scroll offset is
  applied to it
- a write reloads the displayed document and marks the others stale, so the
  next flip to one of them re-renders rather than showing the pre-write page
- a site change invalidates every frame