---
uid: bug-00de1faf
id: BUG-79
type: bug
title: 'Builder: View/Edit flips in place instead of reloading the pane'
created_by: martin-github@westhead.me
created_at: '2026-09-11T01:55:00.746671+00:00'
updated_at: '2026-09-11T02:20:21.484860+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d003a9da
  severity: medium
  commits:
  - working_sha: e6499d30402df06c616bb368f66ca5e9f2f396d8
    reconcile_sha: null
    main_sha: null
  - working_sha: ca7053f3e91098e73a92047025249d719cc27d03
    reconcile_sha: null
    main_sha: null
  version: 0.2.160
  story_points: 3
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

- The panel creates a frame for every document mode when the mode is
  registered, and keeps it. Switching mode shows one and hides the others.
- Hidden means `visibility`, not `display`. A `display: none` iframe is out of
  layout and does not keep its scroll offset; a `visibility: hidden` one is
  laid out, unpainted, untouchable, and holds exactly where it was.
- A frame navigates only when what it shows is genuinely out of date: it has
  never been pointed anywhere, the site changed, an explicit `refresh()` (a
  business switch), or a write. Never for a mode switch.
- **The idle channel is primed** once the visible one has loaded: the channel
  the operator has not opened yet is fetched behind the page they are looking
  at, so the FIRST flip is in place as well as every one after it. Priming is
  for a frame pointing at a different URL only — never for one that is merely
  stale, because a stale frame is the same page with newer content and
  re-rendering that for nobody is a cost nobody asked for.
- The carried state still syncs the two channels — captured from the outgoing
  document, applied to the incoming one — but it now lands on a document that
  is already laid out, which is what makes the offset land exactly rather than
  approximately.

Technical consequences of the above, stated so they are not discovered later:

- **The panel announces its document on show, not only on load.** A frame that
  is already loaded fires no `load` event when it is revealed, and the builder
  binds the edit bridge, Marked Points and the carry on that announcement. So
  `document` is emitted when a loaded frame is shown as well as when one loads,
  and the builder subscribes to the PANEL's event rather than to one frame's —
  a listener bound to a single frame would go deaf the moment the operator
  flipped to the other.
- **`panel.reloadDocument()` replaces the three `frame.contentWindow.location
  .reload()` call sites** (palette write, assistant write, segment save). With
  more than one live document, "reload the preview" has to mean *reload the one
  on screen and mark the others out of date* — a hidden frame must not serve a
  stale render the next time it is shown, and must not pay for a render nobody
  is looking at either. The reload itself is still the document's own
  `location.reload()`, which reloads where the frame IS rather than where it
  was sent.
- **`panel.frame` is the frame on screen.** It stays a property so its readers
  do not change; it is a getter that resolves to whichever frame is showing.
- **`.builder-panel__frame` now means "the frame the pane is showing".** Every
  frame carries `.builder-panel__pane`, which is where the geometry lives, and
  the shown one additionally carries `.builder-panel__frame` — the address the
  rest of the codebase already used for the visible frame, so the browser
  suites, the viewport-fill measurement and the edit-loop drivers keep meaning
  what they meant.

## Test plan

New: `tests/test_UAT_FC_BUG-79_flip_in_place.test.ts`, against the real
composition (`mountBuilder`, the real panel and toolbar) as the other builder
suites are:

- a mode switch navigates neither channel — the same document object and the
  same `src` are still there after switching away and back
- the idle channel is primed after the visible one loads, so the first flip
  shows rather than fetches
- the frame left behind stays connected and laid out (hidden by class, never by
  `hidden`/`display: none`), which is what keeps its scroll
- the revealed document is announced, so the carried state and the edit loop
  bind to it
- a write reloads the displayed document and marks the others out of date, so
  the next flip to one of them fetches rather than serving the pre-write page
- a change of site invalidates every channel

Adjusted, because they asserted the single-frame model rather than the property
they are about:

- `req115-builder-composition.test.ts` — the pane is still never rebuilt and
  the source still changes; the frame identity claim becomes a per-channel one,
  and a mount mode hides the frames by class rather than by `hidden`
- `reconciliation-builder-workspace-chrome.test.ts` (AC-968) — same: pane
  identity and `getSrc()` carry the criterion; every frame stays attached
- `reconciliation-palette-popup-surface.test.ts` (AC-1249) — the displayed
  frame is named by `.builder-panel__frame` instead of being the only iframe
- `test_UAT_FC_REQ-215_panel_control.test.ts` — its frame helper selects the
  shown frame