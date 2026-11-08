---
uid: comment-6ed4ac0a
id: COMMENT-7933
type: comment
title: Comment on request REQ-662
created_by: xgd
created_at: '2026-11-07T20:47:36.370692+00:00'
updated_at: '2026-11-07T21:18:57.799687+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4afc03e7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c61fb34e-4bb8-49c7-a600-1e97bfdba7d8",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="919c59c2-83d9-452a-bebe-34561f77905c-user" -->

<!-- xgd-chat role="user" ts="2026-11-07T20:46:39.789922+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="919c59c2-83d9-452a-bebe-34561f77905c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-07T21:18:44.372236+00:00" -->
#### Claude
The worktree is ready. Next I'm reading how the Settings assistant is wired, so the Email and Legal assistants copy that pattern.

Still reading: I'm going through how the host opens and runs a business-scoped conversation. The two new roles need that per-business mechanism.

I've mapped the Settings assistant and REQ-660's message routes. Next I'm checking how the Worker passes its per-business wiring into the host.

I'm checking how the Worker launches a browser, so `preview` can return a picture of the rendered email.

Now checking how the builder's chat client opens a business conversation, so a pane can name its role.

I have enough of the pattern now. Last piece of reading is the REQ-239 session test, which shows how a scripted model drives a business turn end-to-end.

Starting to write code. First, the tail of the settings declaration, to see the groups, sequences and absences format.

Writing the Email assistant's tool declaration (`messages-surface.json`). The manual is projected from it.

Now the Email assistant's operations module, `messages-core.ts`: ports, re-coded refusals, and the write hook.

Now the Legal assistant's declaration, view only.

Both declarations are written. Checking that the framework's validator accepts them before going further.

Both declarations pass validation; the projected manuals are about 5.3k and 2.3k characters. Next: the two roles and their priming.

priming.json now has both roles' entries. Next, the role builders and reminder providers in `roles.ts`.

Now `host-core.ts`. Reading the start of `buildBusiness` so the Paperwork manager matches it exactly.

Making the host-core edits: ids, keys, deps, and the Paperwork manager.

Now the Paperwork manager builder itself, beside `buildBusiness`.

Updating `openBusinessSession`, `aiStatus` and the business branch of `streamPrompt`.

Host side done. Running the typecheck.

The typecheck passes. The only two errors are in files I haven't touched. Checking whether REQ-661 has landed before writing the Worker side.

REQ-661 hasn't landed. I'll write the Worker adapters now: Email fully, over `handleMessageRoute`; Legal shaped to REQ-661's overview, so wiring it is one line once that lands.

Writing the Worker adapter, `paperwork-assistant.ts`.

Wiring the adapter into `ai.ts` and the router.

The control app typechecks clean. Now the browser side: open by role, carry the selection, and handle `messages_changed`.

Now the UATs. First, the scripted-model helpers.

I'll add a narrow `RouterDeps` seam for the Legal port. Its default stays null until REQ-661's overview lands. That lets the Legal UATs drive the real router and host.

Writing the UAT file.

All 8 UATs pass. Next is the regression scope: Settings (REQ-239/251/260), priming budgets (REQ-171/466) and REQ-660's messages suite.

The consultant's prompt budget fails at 200,553 against a 191,200 target. I didn't touch the consultant, so I'm checking that test on a clean xgd-working.

I'll write the change-reminder UAT now. I'll verify it against REQ-661's uncommitted changes route applied temporarily, then revert that route.

REQ-661's worktree is gone, so it may have just landed. Checking.

REQ-661 has landed. Merging xgd-working into my branch so I can finish the Legal wiring and the pane hook-up.

REQ-661 added the same `messages_changed` constant and handler, so the conflicts are duplicates. I'll keep REQ-661's versions and my imports.

Conflicts resolved. Now reading REQ-661's pane, to see the drop-in contract for the assistant and how it publishes the selection.

REQ-661 left its assistant pane as a drop-in (`setAssistant`). I'm mounting the Email and Legal chats there, in `app.js`.

Now wiring the Legal port in the router over REQ-661's `legalOverview`. Checking the bundle shape first.

The typecheck is clean. One fix in `legal-core`: `list_changes` should include versions published on the same day as `since`.

The branch now holds a clean merge plus one adaptation commit, with code identical to before. Running REQ-662's, REQ-661's and the builder suites.

That's a temporal-dead-zone bug: the panel publishes its selection while it's still being built. Simpler fix: read the panel's own selection when a prompt is sent, and only for the matching mode.

REQ-661's own UATs pin two things REQ-662 supersedes on purpose: the "not available yet" placeholder, and a selection without a label. Reading them.

That's it: the store id changes per host instance. The turn-end mark belongs to the conversation, so I'll key it by session id.

All 9 pass. One more UAT, for the Legal port's default wiring: no seam, over REQ-661's real `legalOverview`. A client business should answer an empty document list.

All 10 REQ-662 workers UATs pass. Re-running the full regression scope and both typechecks.

Only the pre-existing REQ-466 overrun is red. Last checks: the chat-panel and feedback suites, since the new panes carry a Feedback control.

Everything in scope passes. Reading my promotion notes before bumping the version and landing.

Order matters: ticket body first, since ticket writes commit to xgd-working. Then lock, merge xgd-working into the branch, bump the version there, and fast-forward back.

Now the ticket body. I'll keep the existing text and add what actually landed, the design decisions, and the test plan as built.

Now lock, merge xgd-working into the branch, bump the version there, and fast-forward.

REQ-663's session holds the merge lock; it took it three minutes ago. I'll wait for it to be released.

Memory saved. Waiting on REQ-663's merge lock.

The lock is released. Taking it and merging xgd-working, which may now include REQ-663, into the branch.

Both conflicts are adjacent lines, so I'll keep both sides of each. Then a clean merge commit, without `-a`.

The senders route goes through `handleMessageRoute` too, so both changes stay "one API, two callers".

The typecheck is clean. Adding a UAT for `list_senders` over REQ-663's route, then re-running the REQ-662 suites.

That last assertion was convoluted. Simplifying it to say exactly what it means.

Everything passes. Committing the adaptation, then bumping the version on the branch.

xgd-working moved again (a ticket write). To keep the version commit at the tip, I'll merge working in underneath it, then fast-forward xgd-working at once.

Fast-forwarded. Running the overlay check, then moving the ticket to `free_coded` with the full SHAs.

It's `free_coded`. Two more steps: bring the ticket body up to date with the senders change, then tear down the branch.

REQ-662 is built and landed on xgd-working as version 0.2.813. The ticket is at `free_coded` and its body describes what actually shipped. It is not a duplicate: no other ticket wires these two assistants.

**What landed**
- **Email assistant and Legal assistant:** a separate conversation each, per business, in the Email and Legal panes REQ-661 left for them. Each reuses the Settings assistant's per-business machinery: budget, spend metering and interrupted-turn handling.
- **Email tools:** every read and write goes through the same message routes the Paperwork pane calls, so the assistant can't be allowed something the pane refuses. Refusals come back as the host's own, with the declaration's codes. Saves are live, and each one sends `messages_changed` so the pane refreshes. `preview` returns a picture of the email where the deployment has a browser.
- **"Send to me":** `send_test` takes only the message key. It goes to the signed-in person's verified address and nowhere else.
- **Legal tools:** view only. They read REQ-661's legal overview, so the acceptance numbers are counts and never names.
- **Neither assistant** can read sent mail or contacts.
- **Priming and per-turn reminders** as the ticket specifies, including the "Send to me" offer, "you are not a lawyer", and "publishing makes everyone accept again".

**Changes from the ticket as written**
- REQ-663's senders landed while I was working, so `list_senders` reads its senders list (read only). `update_message` can also set which address a message is sent from.
- I changed two of REQ-661's own UATs: the pane now holds a conversation instead of "not available yet", and the open item now carries its label.
- The "changes the client made" reminder is measured in the Worker's memory, the same way the Site consultant's change reminder is. After a cold start or a deploy there is no previous turn to measure from, so it says nothing.
- For Legal, only published versions count as changes: the Worker never sees drafts, and publishing happens at deploy, so in practice the Legal reminder will rarely fire.

**Tests:** 11 new workers UATs and 2 new pane UATs all pass, as do the Settings, REQ-660, REQ-661 and REQ-663 suites. One test fails: the Site consultant's prompt size is 200,553 characters against a 191,200 target. I got the same number on a clean xgd-working, so it isn't from this change, but the consultant's prompt is over budget and needs someone to review it.

I couldn't reach REQ-663's session to tell it the senders adaptation landed. That session had ended, and its own work is already merged, so nothing is waiting on it.

<!-- xgd-chat-end -->