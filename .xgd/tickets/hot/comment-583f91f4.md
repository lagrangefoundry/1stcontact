---
uid: comment-583f91f4
id: COMMENT-2386
type: comment
title: Comment on request REQ-210
created_by: xgd
created_at: '2026-09-09T23:55:58.708665+00:00'
updated_at: '2026-09-10T00:17:52.379901+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9aed0600
  kind: chat_transcript
---

<!-- xgd-turn id="ee79dc45-eaa2-4b73-a5f6-3b51f8b674a4-user" -->

<!-- xgd-chat role="user" ts="2026-09-09T23:55:47.304459+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ee79dc45-eaa2-4b73-a5f6-3b51f8b674a4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T00:17:52.135090+00:00" -->
#### Claude
Ticket read. Let me look at a couple more seams before I commit to a design.

Design is settled. Setting up the workspace.

Now writing the anchor-nearness arithmetic.

Now the framework bridges so the browser gets the one implementation.

Now the overlay controller — the largest piece.

Now the chat seam and the app wiring.

Now bind the controller to each frame load and retire it when the channel changes.

Now merging back to `xgd-working` under the lock.

Done — REQ-210 is at `free_coded`, merged into `xgd-working` as `b248d265`, version `0.2.142`.

## What shipped

**A "Mark Points" toggle in edit mode.** With it on, a click places a labelled X and puts `[Point A]` in the composer instead of opening the segment's editor. The label carries `+` (refer again) and `×` (delete); the X drags; the label fades when the pointer leaves it or the next point lands — never on a timer. On send, the pill expands into every frame at once and the marks grey out until the next render.

**Three pieces, split the way the edit loop already is:**

| File | Job |
|---|---|
| `packages/framework/src/l1/marked-points.ts` | What a pixel resolves to — label namespace, pill grammar, the transform inversion, the expansion. Beside `edit-client.ts` because it reads the same stamp. |
| `packages/site-schema/src/anchors.ts` (+`nearestAnchors`) | Which named lines are near the point — REQ-209's arithmetic asked from the other end. |
| `apps/control-app/src/builder/points.js` | The overlay: toggle, marks, drag, controls, send. |

## Decisions worth flagging

- **`near:` is measured in the browser by evaluating REQ-209's own `measureScript`**, served as a framework bridge. It can't be done server-side in the deployed product — `measure_drawing` needs a browser the Worker doesn't have. It runs in the builder's document, not the preview's: an `<img>`-referenced SVG is an isolated document, so measuring against the page would measure a drawing the visitor never sees. If measurement fails, `near:` is omitted rather than guessed.
- **The inversion is genuinely two stages** — `object-fit` picks the painted box, then the drawing's own `preserveAspectRatio` maps its viewBox into that. Collapsing them looks harmless until `object-fit: fill` on a mismatched ratio, which a UAT pins.
- **Deleting a point removes its pills from the draft.** Letters are reused immediately, so a dangling `[Point A]` would silently bind to a different point later.
- **The bubble keeps the pill; the turn carries the expansion.** Expansion happens in a new `expandPrompt` seam on the chat panel, so a reloaded transcript replays what the assistant was actually told.
- **A pill is a markdown literal, not an atomic chip.** That's what makes cut/paste and re-typing free; it also means backspace takes one character, and `+` is the recovery. The shared composer is upstream and exposes no caret API, so pills append rather than insert at the caret.

## Verification

18 UATs in `tests/test_UAT_FC_REQ-210_marked_points.test.ts`, driven against the bytes `1c render --edit` actually wrote (jsdom supplies element boxes, which is the one thing a browser would have). Adjacent scope — `req117-copy-editing`, the four builder-workspace/toolbar/pane suites, REQ-209's measure suite, the L1 and tool surfaces — 63 passing.

Three failures exist in the wider builder scope and **pre-date this work** (confirmed by stashing my changes and re-running): `bug32-webui-scope-rebrand` AC960 names `ledger-core.ts` and two unrelated test files, `reconciliation-builder-workspace-origin` AC977 names `/api/material/changes`, and `req115-builder-shell` fails on `wrangler d1 migrations apply` (environment).

The ticket body now carries an "Implementation" section recording each of the decisions above, so nothing a UAT asserts is unmotivated when this reconciles.

<!-- xgd-chat-end -->