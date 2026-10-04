---
uid: comment-0751884f
id: COMMENT-4912
type: comment
title: Comment on request REQ-388
created_by: xgd
created_at: '2026-10-04T21:31:30.898713+00:00'
updated_at: '2026-10-04T21:50:33.725129+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-0375d034
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "49092cf2-cc59-4343-ad94-deee875e37b2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5b58f0a9-ee09-4884-8fe8-de65638a4b3f-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T21:29:49.993857+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5b58f0a9-ee09-4884-8fe8-de65638a4b3f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T21:50:33.172058+00:00" -->
#### Claude
Reading the builder's preview toolbar and chat plumbing to scope the width control before cutting a branch.

Still mapping the server side — the `screenshot` tool, the per-turn digest, and how chat submissions reach the server.

Still exploring: now tracing how a chat submission travels from the builder to the server's per-turn digest.

Found the per-turn signal seam (`TurnSignal`); now finding where it's built from the `/api/ai/prompt` request.

Checking where the site's viewport ladder (`widths`) lives so the builder and digest can both read it.

Now looking at the comp viewer's desktop/phone toggle and how `app.js` wires the toolbar, so the new control reuses that styling.

Reading the existing REQ-376/REQ-378 UATs to match the test harness, then I'll draft the design into the ticket and start coding.

Tracing where a picture's `viewport` name is resolved (the `PictureDeps`/`resolvePicture` module) so a "client" width can be added there.

Enough context gathered. Recording the design on the ticket, then cutting the branch.

Branch is ready. Starting with the server side: the page listing carries the ladder.

Writing the `screenshot` side now: a `client` viewport resolved from the width reported with the turn.

Now editing `picture.ts`.

Now the per-turn signal and digest wording in `roles.ts` / `digest-core.ts`.

Tests aren't type-checked, and there's precedent for server TS importing a shared rule from builder JS — I'll use that for the width presets so the builder and digest share one definition.

Now threading the view through `host-core.ts` (turn signal + `screenshot`'s client width).

Now the `/api/ai/prompt` route.

Server side is wired. Type-checking it before moving to the builder UI.

Server typechecks clean. Now the builder: pane scaling in `panel.js`, then the control.

Adding `setViewport` to the display panel.

Now the controller that picks the width from the page's ladder and remembers the choice.

Now the toolbar action.

Wiring it into `app.js`, config, and the chat submission.

CSS next, with the comp viewer's toggle moved onto the shared segmented style.

Code is in place. Now looking at how REQ-285's UATs drive a real turn and read the delivered digest, to write the end-to-end UAT the same way.

Mirroring the route in the local Node builder and the CLI host wrapper, so the same builder JS works against both origins.

Typechecks clean. Finding an existing `screenshot`/`resolvePicture` test harness with a recording browser driver.

Found a node-side HostDeps harness (BUG-168); reading it to build the end-to-end UAT.

Writing the builder UAT file now.

Builder UATs pass (5/5, not skipped). Now the server-side UAT: digest line and `screenshot` at the client's width, through the real host.

Now the server UAT file.

Tool results live in nested `tool_result` blocks that `sentText` doesn't read; asserting on the serialized messages instead.

Both new suites pass (11 UATs). Running the adjacent regression scope.

Several are known pre-existing (AC1058, the workspace-origin set, REQ-341 per my notes). AC970 and REQ-157 look like mine — inspecting.

Both are exact-list pins of what this ticket deliberately extends (the View strip, the viewport enum). Updating them and recording the supersession on the ticket.

Confirming the other three failing files are pre-existing by running them on the untouched main checkout.

The worktree shows three extra workspace-origin failures (AC978/979/965) beyond the main-checkout baseline — checking whether they're location artifacts.

The 3 extras are the worktree missing the gitignored `dist-assets/` — a location artifact. Checking whether builder assets have an explicit file manifest that new modules must join.

No manifest; the builder directory is copied whole. Running the Worker-route suites that post `/api/ai/prompt` (copying the gitignored `dist-assets` in first).

Easy harness — adding a route-level UAT so the real Worker route carries the width into the digest, and refuses a malformed one.

Route UATs pass. Two more workers suites touch priming size and the digest:

All green. Checking my notes on this project's version-bump/free_coded gate before committing.

Committing on the branch (explicit paths only — the copied `generated/` and `dist-assets/` stay out).

Committed. Locking and merging into `xgd-working`.

Merged cleanly. Updating the ticket body to the as-built state, then the gated move to `free_coded`.

REQ-388 is built and merged into `xgd-working`, and the ticket is at `free_coded`. The new UATs pass: 13 across three files, including two against the real Worker route.

**What the client sees**
- The preview has a **Desktop · Tablet · Phone · Fit pane** control just before "Open in new tab", in both View and Edit.
- Desktop, Tablet and Phone use the page's own layout widths: whichever is nearest 1280, 768 and 375. A typical captured site therefore shows at 1280, 768 and 375.
- In a narrow pane the page is shrunk to fit rather than re-laid-out. In a wide pane it is centred.
- Fit pane is the old behaviour, and it stays the default until someone picks another option.
- The choice is remembered per user and stays the same when switching between View and Edit.
- The comp viewer's Desktop/Phone toggle now uses the same control style.

**What the consultant gets**
- Every chat message now sends the width the draft is being viewed at and which option is selected. A malformed width is rejected with an error before any turn starts.
- That turn's site summary states it, for example: *"Your client is viewing the draft at 812px (Fit pane) — between the 768px (tablet) and 1024px layouts."* A turn that sends no width says nothing about width; it doesn't repeat the last one.
- `screenshot` accepts `viewport: "client"` and takes the picture at the reported width. On a turn with no reported width it refuses and says to pick mobile, tablet or desktop.
- The consultant's standing instructions now say: when the client says how something looks, assume the width they're viewing, check there first, and say which width any change was made for.

**Decisions and gaps**
- One small file, `view-width.js`, defines the three widths and their names. Both the builder and the server use it, so "tablet" can't mean different widths in the control and in what the consultant is told.
- Two existing tests had exact lists that this ticket deliberately extends: the View toolbar list now includes the width control, and the screenshot viewport list now includes `client`. I updated both and noted it on the ticket.
- Group-chat rooms don't use the width yet. The builder sends it, but that server path ignores it. Only the normal one-to-one consultant chat uses it.

**Tests**
- Seven other test failures in the wider runs also fail on an untouched checkout, so they are not from this change.
- Three more failed only in the branch's working copy, because a build folder was missing there; they pass once it's present.
- The dev environment serves a fixed snapshot, so you'll only see the control there after `bin/deploy --env dev`.

**Ticket record**
- Commits: `03fb0f5a` (the feature) and `d6357679` (version bump to 0.2.493).
- Story points stay at 5.
- The branch is cleaned up. Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->