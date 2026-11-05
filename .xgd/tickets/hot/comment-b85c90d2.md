---
uid: comment-b85c90d2
id: COMMENT-5589
type: comment
title: Comment on bug BUG-262
created_by: xgd
created_at: '2026-10-24T03:11:04.532809+00:00'
updated_at: '2026-10-24T03:33:37.733147+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-196a09ef
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7683be1f-d439-4b0f-9c60-e1ad4939039a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="494fd222-e52f-4ff6-86bd-973280a4f98d-user" -->

<!-- xgd-chat role="user" ts="2026-10-24T03:09:25.351155+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="494fd222-e52f-4ff6-86bd-973280a4f98d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T03:33:36.525120+00:00" -->
#### Claude
Reading how the turn's notice (the part that names what the client finished) gets to a turn, and whether a talker gets one too. That decides how part 2 tells the talker what was finished.

Checking what the framework's `cueTalker` does with a talker's reply, so I know whether the running worker learns what the talker said. That decides whether part 2 can safely use up the plan notice.

Parts 2 and 3 are planned. Now reading `cadence-core.ts`, where `slow-tools.json` is used, to see where part 1's speak-first refusal fits.

Looking for a single place where every consultant tool call passes through, so the speak-first refusal can go there once instead of on each tool surface.

Checking how the shared chat widget handles a reply that ends empty. If it already removes empty bubbles, part 4 only needs the stored transcript fixed on this side.

Now editing plan-core: the new field, the stamp in `clientAnswer`, the view, and the notice line.

Next is session-delta: separate the plan notice from the cursor write, record "told" on its own field, and add the asks finish.

Now the talker's version of the finished cue, as a template next to `finished-cue` (added by splicing the text in, because of the file's mixed escapes):

Now host-core. First the transcript: one shared host-cue check, and dropping empty assistant turns.

Now the gate in `cadence-core`: held at the start of a cue round, released by the first visible text, and a refused call gets no status note.

Now wiring the gate into the consultant backend factory and `toolSet`:

The default parameter is unsafe if the framework passes the factory an argument. Switching it to a block body:

Now the talker desk: a waiting host cue opens a cued talker instead of a client-message talker, it is kept out of reload adoption, and a stale one is dropped when a new worker round starts.

Now the router: `/api/ai/interpose` accepts `cue: 'finished'`.

Server side done. Now the panel: the transport call, `chat.cue` routing, and `app.js` following the new finish.

Now `app.js`: the new `asks_finished_at` fires the cue the same way a focus finish does.

Code for all four parts is in. Typechecking next.

Both typechecks pass. Now the UATs. Checking how the REQ-424 suite sets up asks and focus tasks so I can reuse its setup.

Writing the UAT file now, through the real router with a scripted model. It covers the gate, the busy finish going to the talker, the asks finish, and the empty-reply transcript.

`screenshot` is not enabled here either. That also makes the client-turn test pass for the wrong reason. Checking what the BUG-229 suite sets up to get `screenshot` granted.

The browser is an external boundary, so the shared fake (`fakeBrowser`) is fair to use. Adding it and the `IMAGES` binding so `screenshot` is actually granted:

All 5 pass. Adding a check that the screenshot really ran (no "not enabled"), so neither slow-tool test can pass vacuously:

Passing. Now the regression scope: the suites that touch the cue, talker, transcript, priming and panel code I changed.

The long path list matched nothing (the known vitest filter quirk). Passing short ticket ids as filters instead:

The only failure is the REQ-416 priming UAT, which is already red on clean `xgd-working` (a recorded baseline). Now the node-side suites: panel, priming, plan and cadence.

All 38 node files pass. The gate sits in the backend factory and `toolSet`, which every consultant turn uses, so I'm running the full workers suite as well.

12 failures in 1729. Checking each against clean `xgd-working` by running the same files in the main checkout:

The same 12 fail on clean `xgd-working`, so all of them predate this change. Checking lint and formatting next.

No lint or formatter is configured here. Reading my notes on the `free_coded` gate before committing:

Ticket body updated. Committing the code on the branch:

Now taking the merge lock and merging the latest `xgd-working` into the branch:

The merge was clean, but other sessions changed `app.js`, `plan-core.ts` and `priming.json`, so I'm re-running the typecheck and the BUG-262 and neighbouring suites on the merged tree.

Everything passes on the merged tree. Bumping the version at the tip:

Merging the branch back into `xgd-working` with `xgd-merge` (sparse-safe):

Fast-forwarded onto `xgd-working`. Moving the ticket to `free_coded`:

BUG-262 is fixed and merged into `xgd-working`. The ticket is at `free_coded` (commits `1c518962e0` and `70085badfb`, version 0.2.608, 8 points). Promoting it to `ready_to_reconcile` is your call.

**What the client now gets after finishing a section:**

1. **The consultant speaks before slow work on a cue turn.** On a turn the host starts by itself (a `finished` cue, a continuation and the other hidden cues), a tool in `slow-tools.json` is refused until the consultant has written something the client can see. The refusal tells it to acknowledge what the client did and say what it's about to do and roughly how long it takes. A refused call shows no "The consultant is …" status line. Turns the client starts are unaffected. `Delegate` isn't gated, since its required note is already shown to the client.
2. **A finish while the consultant is working is answered within seconds.** The panel sends it straight to the talker instead of waiting for the work to end. The talker is told what the client did and replies as the consultant's next message. It still fires once only: a second signal gets a 409.
   - I didn't use `queueTalkerCue` as the ticket suggested. That queue only exists inside the process running the work, which a request from the panel can't reach. It goes through the shared inbox that typed mid-turn messages already use.
   - Telling the talker doesn't use up the plan notice, so the worker's next turn still hears everything the client did.
3. **Answering the last open question counts as a finish.** It fires the `finished` cue (routed as in part 2), and the notice names the questions answered. Answering one while others stay open fires nothing.
4. **No empty bubbles.** A reply with no text no longer shows as an empty message on reload. Live, the chat widget already removes one at the end of the turn.

**Tests:** the five new UATs in `tests/test_UAT_FC_BUG-262_client_finishes_and_hears_back.workers.test.ts` pass, as do the related suites, before and after merging in the latest `xgd-working`. The full workers suite has 12 failures in 1729 tests; the same 12 fail on clean `xgd-working`, so this change didn't cause them.

**Two gaps to know about:**
- If the work ends in the roughly 2 seconds before the talker picks up the finish, the client gets no immediate acknowledgement. The consultant's next turn is still told what they finished.
- The chat pane isn't tested live. The empty-message test checks the reload transcript, and the live case relies on the chat widget's existing behaviour.

One more thing: in this test setup, `capture_site` and `screenshot` are refused as "not enabled" unless a fake browser is provided. My first draft of the "not gated" test passed against that refusal without the tool ever running. The final tests use a fake browser and check the tool really ran.

<!-- xgd-chat-end -->