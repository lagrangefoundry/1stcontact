---
uid: story-44d0a572
id: STORY-174
type: story
title: 'Marked Points: point at the edit preview and send the pointing as text'
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T12:45:21.261082+00:00'
updated_at: '2026-11-10T00:54:04.345466+00:00'
completed_at: null
last_field_updated: body
status: updated
fields:
  intent_uid: bundle-0d00566a
  capability_uid: capability-12fee326
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-374f88d6
---

## Story
**As an** operator iterating on a site with the assistant, **I want** to point at places on the edit preview and have each point travel in my message as an exact spatial description, **so that** I can say "move it here" without trying to put a continuous distance into words, and the assistant gets numbers it can act on.

## Description
Marked Points is a second edit-mode gesture on the builder's edit preview (REQ-210, DOC-52 §4), with BUG-72's fixes to how the marks look and behave on screen. A pointing gesture produces a **message, not a change to the site**: no write path, no diff, no re-render (DOC-28 §7.3 is not touched).

In scope:
- A **Mark Points** toggle that exists only in Edit mode. While it is on, a click on the preview places a point instead of opening the segment's editor. Turning it off, or leaving Edit mode, gives the click back to the editor.
- The mark: a high-contrast cross centred on a disc, with a lettered label ("Point A", "Point B", ...). Letters are reused once a point is deleted. The label carries `+` (refer to this point again) and `×` (delete it). Hovering a mark inside a drawing shows the point's full formatted expansion as a tooltip, worked out again after a drag.
- When the label fades: only when the pointer leaves the mark's reach or the next point lands. Never on a timer. Hovering brings it back.
- Dragging a mark moves its point. The point's description is worked out again from where the drag ends.
- A pill (`[Point A]`) is added to the message composer for each point. On send, every point the draft refers to is expanded into the turn the assistant receives. It carries SVG user space (for a point inside a drawing), node-relative coordinates, document coordinates with the viewport width, the named anchor lines nearby (`near:`, with distances, never snapped), and the render it was taken against. The chat bubble keeps the short pill form.
- Points' lifetime is one turn: pills clear on send, and the marks turn grey and inert until the next render replaces them.

Out of scope:
- An atomic pill chip in the composer (one backspace removes it whole). This needs an atom-node seam in the shared `webui-chat` component and was split out by BUG-72 §3. `+` is the recovery here.
- Drag-to-communicate deltas, a grid overlay, freehand annotation, and placing points with the keyboard (REQ-210 "What this does not do").
- `near:` for points on L1 nodes. Page anchors are deliberately unscheduled. Such points carry the width-ambiguity note instead.

## Technical Context
- **Builds on CAP-87.** It is a sibling of the click-to-edit gesture on the same editable render, and reuses the edit bridge's hit chain (module, slot, path). The overlay listens in the capture phase and stops its own clicks, so the edit bridge is not modified. Turning the mode off leaves the bridge exactly as it was.
- **Published renders are unaffected.** The overlay's styles and marks are injected into the preview document by the builder. The renderer never emits them, so the published and standalone edit renders carry none of it (DOC-28 §7.1).
- **One implementation, served.** The point-resolution module, the anchor vocabulary (`nearestAnchors`, beside REQ-209's `anchorValue`) and the drawing-measurement script are served to the browser as framework bridges. They are not hand-copied, so `near:` uses the same definition of `cap-top` as `relate` and `solve`.
- **The pill's expansion is the whole channel.** `screenshot kind:'edit'` renders on the server, so marks never appear in any render the assistant sees. They also cannot pollute `compare` or the fidelity gates.
- **Implementation contract:** point capture assumes the preview iframe is not scaled. Any future fit-to-pane zoom must un-scale click coordinates.
- **Coordinates go through two stages.** First `object-fit` (the box the drawing is painted into), then the drawing's own `preserveAspectRatio`. The SVG is never inlined.
- UATs: `tests/reconciliation-marked-points.test.ts` (AC-2413..AC-2425 and AC-2594, on the edit render in jsdom; AC-2594's `test_UAT_AC2594_the_dimmed_hover_selects_a_stamped_segment_by_the_hot_class_alone_and_off_restores_the_render` drives the real `mountL1EditBridge` hover, asserts the injected overlay stylesheet names the hot class and not the region-stamp attribute, that its `!important` dimmed outline reaches the hot segment, that a click places a point and opens no editor, and that turning the mode off removes the overlay so the render's own stamp-and-class outline is what reaches the segment; it replaces BUG-83's free-coded hover test) and `tests/reconciliation-marked-points-served-modules.test.ts` (AC-2421: the served-module graph and parity, plus the un-injected measure path in a real browser, skipped visibly where none launches). Also `tests/test_UAT_FC_REQ-210_marked_points.test.ts`, `tests/test_UAT_FC_BUG-72_marked_point_chrome.test.ts`.

## Reconciliation Decisions
- **Atomic pill deferred** (decided at reconciliation, 2026-11-08): REQ-210 §"The pill behaves like a pill" asks for an atomic chip with undoable deletion. BUG-72 §3 then scoped that out explicitly: the shared composer has no atom-node seam, and the work was filed in `lagrange-framework`. The operator's own later decision governs, so no AC requires atomicity. The ACs cover what the operator kept: cut/paste keeps the pill, re-typing `Point A` resolves to it, and `+` restores it.
- **Pill goes at the end of the draft, not at the caret** (decided at reconciliation, 2026-11-08): REQ-210 doesn't say where the pill is inserted. The composer offers no caret API, and the implementation notes record end-of-draft as the accepted limit. Formalized in the placement AC.
- **Asymmetric fade reach: 200px right, 56px in every other direction** (decided at reconciliation, 2026-11-08): BUG-72 asks for "generous to the right, tight elsewhere" without giving numbers. The landed values are formalized so the label stays reachable from its controls and the REQ-210 fade-on-leave behaviour is kept.
- **26-point ceiling** (decided at reconciliation, 2026-11-08): intent doesn't cover running out of letters. Once A–Z are all in use, a click places nothing. Formalized in the placement AC.
- **Deleting a point removes its pills** (decided at reconciliation, 2026-11-08): intent doesn't say this. Because letters are reused, a leftover `[Point A]` would silently refer to a different point later. Formalized as an AC.
- **Only referenced points are sent; unknown references stay literal** (decided at reconciliation, 2026-11-08): intent doesn't say this. A point whose pill was removed is one the user chose not to mention. A bare `Point Q` with no live Q is left as prose. Formalized as an AC.
- **Width-ambiguity note** (decided at reconciliation, 2026-11-08): REQ-210 §"The width-ambiguity rule" says the assistant asks which width is meant when a point lands on an L1 node. The expansion carries that rule as an explicit note whenever any point in the turn is not inside a drawing. Formalized in the expansion AC.
- **The render reference is an ordinal** (decided at reconciliation, 2026-11-08): REQ-210 asks for "the render it was taken against". It is reported as the page plus a render counter that goes up with each new preview document, which is enough to tell when a reference is stale.
- **"Coordinates on hover" lives on the mark, not the pill** (decided at reconciliation, 2026-11-08): REQ-210 §"The pill behaves like a pill" asks for coordinates on hover so that a reused letter can always be told apart. The composer pill is literal text in the shared `webui-chat` composer, which has no atom-node seam and so cannot carry a hover. That is the same root cause as the atomic pill BUG-72 §3 split out to `lagrange-framework`. The purpose is met by other means. Deleting a point removes every pill that refers to it (AC-2417), and points clear on send (AC-2424), so a live pill never refers to a different point than the one it was made for. On screen, the mark carries the point's full formatted expansion as its hover tooltip, once its drawing is resolved and again after a drag. Formalized in AC-2418.

## Dependencies
-

## Story Points
3



## Reconciliation Decisions (BUNDLE-44)

- **The dimmed hover names the hot-segment marker and nothing else** (decided at
  reconciliation, 2026-11-09, BUNDLE-44 / BUG-83 cause 5). BUG-83 found the
  overlay's dimmed-hover rule restating the renderer's region-stamp attribute and
  judged it drift: "the overlay restating the renderer's markup contract in its
  own CSS is a real second reader of it: rename the attribute upstream and the
  dimmed-hover rule silently stops matching". Its fix: "the selector drops it and
  takes `!important` to keep winning over the renderer's own hot treatment, which
  it previously won by specificity." The code matches: the injected rule selects
  the renderer's hot-segment class under the mode's body flag, with `!important`
  on the outline. Formalized as AC-2594 (hover is dimmed, a click still places a
  point on the hovered segment, and the injected stylesheet carries no copy of the
  region stamp). The reconciliation plan's note "(no !important)" is not adopted:
  BUG-83 states the override is won with `!important`, and the code agrees. What
  the overlay must not carry is a copy of the renderer's stamp, not the
  `!important`. AC-1006's static guard (one address resolution, served from the
  renderer's own source) was left as it was, as BUG-83 records.