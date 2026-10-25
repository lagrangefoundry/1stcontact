---
uid: comment-9b186146
id: COMMENT-5521
type: comment
title: Comment on request REQ-414
created_by: xgd
created_at: '2026-10-19T22:43:15.946276+00:00'
updated_at: '2026-10-19T23:11:10.646042+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-cff9cb69
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "5fc0301d-66b1-4d27-8ccf-51c9f9128607",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a4d4884c-649b-4f99-a7b9-eda2839856ed-user" -->

<!-- xgd-chat role="user" ts="2026-10-19T22:41:59.487153+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a4d4884c-649b-4f99-a7b9-eda2839856ed-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-19T23:11:09.989686+00:00" -->
#### Claude
I've read REQ-414 and I'm now mapping the current upload and chat code (`upload.js`, `chat.js`, and how a turn is sent) before deciding on the design.

I'm checking how the shared chat composer handles an empty send. That decides how "send only attachments" can work without changing the framework.

I've found the existing role-change route. Now I'm checking whether it allows switching an already-placed upload to "for reference", which the chip's role choice depends on.

I've mapped the existing upload tests. Next I'm reading the REQ-161, BUG-181, REQ-287 and REQ-221 tests, because the chat-drop behaviour they check is what this ticket replaces.

I have the design settled. Before writing code I'm setting the ticket to `free_coding` and cutting the branch, then I'll read the remaining tests that pin the old chat-drop note.

Baseline is green in the branch worktree. Now reading how the site chat is created and what options `chat.js` takes, so the attachment tray can plug in.

I'm about to write the new `attachments.js` module. First I'm checking the BUG-70 style scan, since every control the builder creates has to have a sized CSS rule.

Now writing the code: config words first, then the new `attachments.js` module.

Module written. Now wiring it into `chat.js`: bind the tray above the composer on each paint, draw attachment lines as chips in the transcript, and clear chips when the conversation changes.

Applying the `chat.js` edits.

`chat.js` is wired. Now adding the CSS for the tray and the in-bubble chips, placed after the chat-step rules rather than at the end of the file, which the REQ-408 test reserves for the story board.

Now `app.js`: create the tray, hand it to the site chat, stop the overlay watching the chat, and remove the fake upload note.

Updating the overlay comment and simplifying `receiveFiles`, which is now Library-only.

Removing the now-unused "which entry point" plumbing from `upload.js`, since the overlay only serves the Library now.

Rewriting the REQ-161 builder tests: the Library keeps the overlay, the chat no longer raises it, and the chat-drop note tests go because REQ-414 replaces that behaviour.

I'm keeping BUG-181's honest failure wording: if placing a picture on the site fails at send time, the attachment line will say it's in the Library but not ready yet. Updating the module.

Now writing the REQ-414 UATs. First checking how an existing builder suite installs a minimal markdown parser in jsdom, so the in-bubble chips can be tested.

Writing the REQ-414 UAT file.

The run hung. I think the cause is in my send-button watcher: setting `disabled` when it's already set still fires a mutation, which loops forever. Stopping the run and fixing that.

Now the REQ-287 and REQ-221 tests.

Those pass too. Now the wider regression: every test that mounts the builder or the chat pane, in batches.

Baseline shows the same 21 failures without my change, so none are mine. My working tree is restored. Now checking lint and typecheck.

Ticket body updated. Now merging back: taking the merge lock, then merging into `xgd-working`.

Merged cleanly; the ticket rematerialize step found nothing to do. Running the REQ-414 and retargeted suites once more on the merged `xgd-working` before promoting.

Ticket is at `free_coded` with both commits and version 0.2.545. Releasing the lock and removing the branch.

REQ-414 is implemented and merged into `xgd-working`. The ticket is at `free_coded` (version 0.2.545, two commits recorded). I haven't tried it in a real browser; the tests run the real builder and chat component in a simulated browser.

**What the client sees now**
- Dropping a file on the conversation, or using the new **📎 Attach files** button above the text box, adds a chip to the composer. Nothing is added to the transcript. The chip shows a thumbnail or icon, the label once uploaded (`IMAGE-12`), a *For the site* / *For reference* choice and a remove ×.
- Pictures and fonts default to *For the site*; everything else defaults to *For reference*.
- On send, each file adds one line under the client's text, e.g. `📎 Attached: IMAGE-12 (for the site), shopfront.jpg`. The consultant gets exactly that in the same turn, and the client's message shows it as a chip with a thumbnail, live and after a reload.
- Sending only attachments is allowed. A file that is refused shows the reason on its chip and isn't sent. Files added while the consultant is working go with the next message, through the existing BUG-224 handling.
- The Library's upload overlay is unchanged but now only appears for drops on the Library.

**Decisions you might want to check**
- **"For the site" is applied when the message is sent, not on upload.** Every file uploads as reference, and the existing role-change route switches it to the site at send time. This keeps the chip's choice reversible: the server refuses to switch a file back to reference once it's on the site. The cost is that a chip removed before sending leaves a reference-only item in the Library.
- **If putting a picture on the site fails at send**, the attachment line says "It's in your Library, but isn't ready to use on the site yet: <reason>". This keeps BUG-181's rule against claiming a file is usable when it isn't.
- **No change to the shared chat component.** It has no attachment support, so the tray sits above its input box and takes over Enter and ▶ only while a chip is waiting. Otherwise the composer behaves as before.
- **Old behaviour replaced, recorded on the ticket.** The fake upload note is gone. The BUG-181, REQ-287, REQ-161 and REQ-221 tests that checked it now check the chip and the sent line instead.

**Tests:** the 8 new REQ-414 tests and the four reworked files pass. Across the 111 test files that mount the builder or chat, 21 tests fail, and the same 21 fail on the original code with my change removed, so none come from this work.

To try it on dev, it needs `bin/deploy --env dev`.

The background test run that just got stopped was my first REQ-414 run. It hung on a bug in the send-button watcher, which I fixed before going on. After the fix, all 8 REQ-414 tests pass, and they pass again on the merged `xgd-working`, so nothing needs rerunning.

<!-- xgd-chat-end -->