---
uid: comment-6acbc860
id: COMMENT-5520
type: comment
title: Comment on request REQ-413
created_by: xgd
created_at: '2026-10-19T22:17:16.982327+00:00'
updated_at: '2026-10-19T22:39:21.687324+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-36b44ba1
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f492aa73-55c9-4195-8a6c-8937612932fc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2c7b804e-2f4f-4df4-a065-1eba84ec29e2-user" -->

<!-- xgd-chat role="user" ts="2026-10-19T22:16:34.960685+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2c7b804e-2f4f-4df4-a065-1eba84ec29e2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-19T22:39:20.777225+00:00" -->
#### Claude
The ticket's requirements are already written and you asked me to implement it, so I'm treating the scope as confirmed. Next I'll move the ticket to `free_coding` and cut the branch.

Worktree is set up. I'll wait for the explorers to come back.

I'm reading how the plan surface ops are implemented, since the new "show the client" op probably belongs on a surface that isn't narrowed. Explorers are still running.

The three explorers are still mapping the code. Meanwhile I'm reading the chat and story-board code in the browser.

There's already a `#looks=<set>` chat link from REQ-391. That's the pattern to generalise.

Still mapping. I'm now reading how the questions panel draws and folds asks, which tells me how to expand and highlight one.

I'm reading how the plan surface's ops are wired in `plan-core.ts` and where its declaration validation runs. The surface explorer is still out.

Looking for where the consultant's existing `#looks=` link is produced, so the new links match it.

The surface explorer is still running, but I have enough to design. I'm checking the toolbox's param types (enum support) and the site store's page read before writing code.

Enum params are supported, and results arrive as JSON. Writing the server core now.

Next, the plan surface declaration. I'll check whether a JSON round-trip preserves the file's formatting before editing it that way.

Now splicing the declaration in as text, so the hand formatting is kept.

Declaration is in. Next, wiring into `plan-core.ts`.

Now the host side in `host-core.ts`: the per-message client state, and the port the op uses.

Now `ClientView` gets the optional `busy` report.

Next, the cadence wrapper: after a `show_client` call that switched, it yields the record line and then the live event.

Server side is wired. Typechecking.

Typecheck is clean. On to the browser. First, `looks.open` has to report a named look that's no longer on offer, instead of quietly falling back to the set's first look.

Now `chat.js`: the `show_client` signal, and the clicked link element passed to the host.

Now the plan panel's `showAsk`: unfold the question, scroll to it, and flash it.

Now `app.js`, which wires these together.

Next, CSS for the highlight and the "no longer there" note.

Next, the consultant's guidance in `priming.json`, spliced as text into both lists.

Code is in place. Now the UATs, starting with the jsdom builder suite. I'm reading the REQ-391 carousel suite's harness to reuse it.

Writing the jsdom UAT suite now. It mounts the real builder, and a stream carries what the host sends for a switch.

In jsdom the pane has no width, so `report()` answers null. I'll stub the panel's viewport in that one test; a real builder always has a width.

Five fail because no links render: the markdown sanitizer isn't installed in jsdom, so the text is escaped. Checking how other suites install it.

I'll install the same stand-in engines the REQ-220 suite uses, with markdown links turned into anchors.

All 7 browser UATs pass. Now the server suite against the real Worker. I'm reading REQ-364's workers suite for the `set_ask` call shape, SSE reading, and group-chat setup.

The browser half passes, 7 of 7. I'm now writing the Worker suite, which runs the real host with a scripted model. First I'm checking how a reopened conversation's transcript is read.

All 6 pass on the first run, so I'll check they can fail. First mutation: break the cadence recording, and separately the host guard.

The mutation itself was malformed (I dropped the ternary's else-branch). Retrying with a cleaner one.

The mutation made the four switch tests fail, as expected, and the code is restored. Now the same check on the browser suite: drop the arrival-time guard and the "no longer there" note.

Both browser mutations were caught, and the code is restored. Now the regression scope: the neighbouring suites for looks, the panel, story, cadence, plan surface, client view, chat and priming.

Those two fail the same way on clean xgd-working, so they were already failing. Next batch.

The REQ-391 comp-viewer case fails on clean xgd-working too. The REQ-408 board-style case passes there but fails in my worktree, so I'm looking at it.

That one is mine. The test takes everything from the story-board marker to the end of `builder.css`, and my appended rules use `var(--…)`. I'll move my CSS up beside the chat step styles.

Fixed: 8 of 8. Now the neighbouring Worker suites.

All 16 Worker suites pass, 58 tests. I'm checking a few more suites that touch `readClientView`, the plan's ops list, or `onLinkClick`.

All green. Last check before committing: a typecheck of the control app.

Typechecks are clean. Before committing I'm reading my notes on this repo's version bump and `free_coded` gate.

Next I'm updating the ticket body before committing. I'm keeping the existing text and adding what landed, so every UAT is motivated by language in the ticket.

Ticket updated. Now committing on the branch, staging explicit paths only.

Committed. Now lock, merge into xgd-working, and rematerialize the overlay.

Merged, and the overlay needs nothing. Now moving to `free_coded`. I'm omitting `--version` so the gate bumps it inside its own lock.

Status is `free_coded` with both commits and version 0.2.544. Now tearing down the branch.

Done. I'll save two non-obvious findings to memory for future sessions.

REQ-413 is implemented and merged into xgd-working, and the ticket is at `free_coded` (2 commits, version 0.2.544). I didn't need to ask you anything first: the ticket's requirements were complete, and the existing code already had most of the pieces to build on. All 13 new UATs pass.

**The consultant's side**
- **One operation, `show_client`,** sits on the plan surface next to `choose_look`, which keeps it available to the consultant in every deployment.
- **Targets:** a page of the draft, Story, a look, a comparison site, or a question on the panel. The consultant chooses `switch` or `link`.
- **Missing targets are refused up front:** a removed page, a set-aside look, a site not on the comp board, or a withdrawn question.
- **Guidance:** a new "showing" section in the consultant's instructions, and the op's description, cover when to switch and when to link.

**Link:** the op returns a line like `[Open the Coastal look](#show=looks&set=…&look=…)` for the consultant to paste, the same pattern as pictures in the chat. Clicking it changes the view in place and never opens a tab. If the target is gone, "That's no longer there." appears beside the link. The older `#looks=<set>` links from `make_alternatives` still work.

**Switch**
- **When it lands,** the reply gets a line "Showing you the story board", which links back to that view, and the browser gets a live event that changes the view once. The line is kept in the transcript and the event isn't, so a reload shows the line but never switches again.
- **It turns into a link** if the client is busy: an edit open, the image editor open, or an answer typed but not saved on the panel. The consultant is told why.
- **Enforced by the host, not just instructed:** a second switch in answer to the same client message also turns into a link.
- **Checked twice:** the browser reports "busy" with each message, and checks again when a switch arrives, since a turn can run for minutes.
- **A question** is unfolded, scrolled into view and highlighted for a couple of seconds.
- **The client's own controls** (mode buttons, "Back to your draft", the page selector) work exactly as before.

**Group chat works with one difference.** The room records only what members post. So in a room the switch result gives the consultant the "Showing you…" line to include in its room post. The live switch itself reaches the client in both modes.

**Tests**
- **How they're split:** no existing test drives a browser and a scripted model together, so I followed the repo's usual split. 6 tests run the real Worker with only the model scripted; 7 mount the real builder in jsdom, fed exactly what the host sends.
- **Checked they can fail:** when I broke the switch recording, the host guard, the browser guard or the "no longer there" note, the tests covering them failed.
- **Regression:** I ran the neighbouring suites (looks, panel, story, cadence, plan surface, client view, chat, priming, group chat). Three tests fail, and all three also fail on clean xgd-working: two in `reconciliation-builder-assistant-pane` (they expect the old two-argument prompt call) and REQ-391's comp-viewer test.
- **One regression I caused and fixed:** REQ-408's style test scans `builder.css` from the story-board section to the end of the file, so I moved my new CSS higher up.

The ticket body has the original requirements plus what was built and the test plan. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->