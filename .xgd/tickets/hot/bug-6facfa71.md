---
uid: bug-6facfa71
id: BUG-236
type: bug
title: 'Client loses their place: attachments hide the text box, crowded turns, mid-reply
  worker dumps, no Done on the panel, questions changing form'
created_by: EPIC-19
created_at: '2026-10-20T19:24:29.832787+00:00'
updated_at: '2026-10-20T19:58:50.725714+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  severity: high
  priority: high
  story_points: 10
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-5f832a19
  commits:
  - working_sha: b4d49d5f2a74184ca61fdf492006e0933586a8d6
    reconcile_sha: null
    main_sha: null
  - working_sha: ed965663f22a6f70cd90795a6ea5513dafc326df
    reconcile_sha: null
    main_sha: null
  version: 0.2.558
---

## Theme

In the latest test run the client repeatedly lost their place: the composer
became unusable, one consultant message carried six asks, a long worker report
landed mid-reply, the panel never said "got it", and a question changed form
under the client. One intent: **the client always knows where they are and what
to do next, and nothing takes their place away.** Reported by the operator,
2026-10-20.

## 1. Attachments can hide the text box (REQ-414)

`.builder-attach` (`builder.css` ~1263) wraps chips onto unlimited rows. With
many photos the chips push the text box and Send out of reach; the operator had
to delete every photo to type. **Fix:** the chip area is capped at about two
rows and scrolls inside itself (or collapses to "+N more" with a way to see
them). The text box and Send are always visible and usable, however many files
are attached.

## 2. Pacing: one thing at a time (priming)

A consultant turn listed all five new panel questions with explanations, then
what comes next, then the important story question last — the client started
answering the panel and never got to the story. The existing "one topic, at most
one question per message" rule was not enough.
- Questions added to the panel are announced in **one line in total** ("I've put
  a few quick questions on the panel above — whenever suits you"), never one line
  per question and never the questions restated. This replaces REQ-401's
  "announce every question you add" wording.
- **A message ends on its one real question, and that question is the main thing
  in it.** When the important question is a story question, little else goes in
  the message.
- "What happens next" goes in its own message, or not at all, when the message
  also asks something.

## 3. The worker's hand-back is short and never lands while the client types (REQ-416)

The worker finished while the client was replying to the talker and posted a
page and a half.
- The worker's final result is **short**: what's ready, where to look, at most
  one question — about three lines. Detail stays in its record for the
  consultant to bring up when relevant.
- **While the composer has unsent text**, the result is held behind a small
  marker ("The first draft is ready") and appears when the client sends or clears
  the box. (REQ-210 D5's wait-for-the-talker rule still applies.)

## 4. The builder instructions still say not to look (REQ-342 text vs REQ-415)

The `delegation-method` template says "When the checks come back passed, believe
them and move on … Re-inspecting work … moves them to the more expensive side",
and "look … not otherwise". That contradicts REQ-415 and the operator's rule that
the principal must check delegated work, especially in the final stages
("processing is cheap … TOKENS ARE COSTLY … the principal MUST check the work").
Rewrite it: the record says what changed; the host's attached picture and layout
check say how it looks; look at what the builder made before telling the client
it's done; the record means you don't need to re-read the site's data. Update the
REQ-295 / REQ-342 / REQ-343 UATs that pin the old wording.

## 5. The panel has an explicit "I'm finished" (REQ-378 / REQ-390 / REQ-401)

Typed answers save only on blur (`change`), so there is no Submit; Enter works in
single-line boxes but not multi-line ones; the comp board has only "Add" (a
site), not a way to finish notes.
- Every typed answer has a clear **Done** button; Enter submits single-line
  answers; a **"Saved ✓"** confirmation shows once stored. Save-on-blur stays as a
  safety net.
- Comp notes: a **Done** per site, and **"I've finished commenting"** under the
  board, which tells the consultant (per-turn notice) the client has finished
  with the comps.

## 6. A showing question can't change form

A phone/email question appeared as a text box and then redrew as radio buttons —
most likely the consultant rewrote the same ask's input type after posting it
(confirm from the plan's change history).
- The host **refuses changing a shown ask's input type or options**; the refusal
  tells the consultant to withdraw it and add a new ask, which appears as a new
  item.
- **A panel redraw never discards text the client is typing** in any answer box.

## Test plan
- Composer with 20 attachments: text box and Send remain visible and focusable.
- Priming: the one-line panel announcement, ends-on-one-question and
  next-steps rules are present; REQ-401's per-question announcement wording is
  gone.
- Worker result: a scripted long result is held while the composer has text and
  shown after send; result guidance asks for ~3 lines.
- `delegation-method` no longer says to believe passed checks without looking;
  updated pinning UATs pass.
- Each typed answer has Done; Enter submits a single-line answer; "Saved ✓"
  appears; comp board has per-site Done and "I've finished commenting", which
  reaches the consultant's notice.
- `set_ask` changing a shown ask's input from text to single_choice is refused;
  typing in an answer box survives a redraw triggered by another plan change.


## 7. A quieter bottom of the screen (operator, 2026-10-20)

> The bottom of the screen is getting pretty busy. I want to loose the paper clip and "Attach files" and instead add a "+" symbol inside the text entry area to mirror the send button … Same functionality as we have now. Can we move the widget showing the progress to be an area UNDER but connected to the progress bar that we have at the top please?

Both depend on **lagrange-framework REQ-214** (a leading composer action and a host-placed status widget).

- **Attach becomes a "+" inside the text entry area**, mirroring Send (REQ-214 `composerAction`). The separate "📎 Attach files" row and its button go (`attachments.js` ~132, `ATTACH_BUTTON` in `config.js`). Everything else about attachments is unchanged: drag and drop, chips above the text box (capped per item 1), choosing site or reference per file, going with the next message.
- **The status widget moves to the plan panel**, into an area directly under the progress banner (REQ-398 / BUG-209) and visually joined to it, using REQ-214 `statusContainer`. It keeps its text ("The consultant is …"), elapsed time and Stop building. It is present only while the worker is working; the banner does not change height otherwise. Nothing of it remains above the composer.

Tests: the composer shows a "+" inside the input that opens the file picker, and no "Attach files" control exists; with a build running, the status widget is inside the plan panel under the progress banner and not in the chat, and Stop building still stops the worker.



## Implementation (2026-10-20, items 1–6)

Items 1–6 are implemented. **Item 7 is not:** it depends on lagrange-framework
REQ-214 (`composerAction` / `statusContainer`), which is still `draft` upstream.
Item 7 stays open on this ticket until REQ-214 lands. It is not worked around by
moving `webui-chat`'s DOM from the host.

1. **Attachments.** `.builder-attach__chips` is a wrapping flex area capped at
   96px (about two rows of chips) that scrolls inside itself
   (`overflow-y: auto`). It is hidden when empty. The text box and Send stay
   below it and usable.
2. **Pacing (priming, both corpus variants).** The REQ-401 paragraph now says to
   announce panel questions "in one line in total … never one line per
   question, never the questions restated". The paragraph adds "a message ends
   on its one real question …" and "what happens next goes in its own message,
   or not at all …". `set_ask`'s description (`plan-surface.json`) says the
   same one-line-in-total rule. REQ-401's UAT is updated to pin the new wording.
3. **Worker's hand-back.** Priming: "when you come back from the work, keep the
   result short: what is ready, where to look, and at most one question — about
   three lines. The detail stays in your record …". Browser (`chat.js`
   `talkDesk`): once a work stream has shown its status (its first `progress`),
   any consultant text that arrives while the composer has unsent text is held.
   A marker above the box says "The consultant has finished — show what it
   said". The held text appears when the client sends or clears the box (the box
   is checked every 250ms), or presses the marker. The stream keeps being read
   meanwhile, so talker replies are not held up, and the turn's `done` still
   waits for the talker (REQ-210 D5). When the box is empty, the result shows at
   once as before.
4. **`delegation-method`.** "Believe them and move on", "re-inspecting … moves
   them to the more expensive side" and "and not otherwise" are gone. It now
   says: the record means you do not need to re-read the site's data. How it
   looks comes back too: a builder's result carries the host's picture of the
   page and the layout check's findings (REQ-415). A passed check says only that
   what you asked about holds. "Look at what the builder made, in the picture
   attached to its result, before you tell your client it is done". Look closer
   when the record and the brief do not meet, or a check failed or came back
   unanswered. The REQ-295 / REQ-342 / REQ-343 UATs are updated to pin this.
5. **Panel "I'm finished".** Every typed answer (one-line and `long_text`) has a
   **Done** button. Enter in a one-line box is Done. Leaving the box still saves
   as a safety net, and the same answer is sent once however many of these
   happen. After any answer is stored, **"Saved ✓"** shows on the item's line for
   about 4s. Comp board: each site has a **Done** that stores both its likes and
   dislikes at once and shows "Saved ✓". Under the board, **"I've finished
   commenting"** posts `/api/plan/comp` `action: finish`, which stores
   `comps_finished_at` on the plan. The panel then shows "Thanks — the
   consultant will pick it up from here." The consultant's next turn is told,
   once, on the plan-answers cursor: "Your client has finished commenting on the
   comp board …". The plan digest also says so. Adding a site, or the client
   noting one after finishing, clears it, and the button shows again.
6. **Questions keep their form.** `set_ask` on an ask already on the panel (open,
   answered or skipped) is refused with `ASK_SHOWN` when it would change the
   ask's `input` or `options`. The refusal says to `withdraw_ask` it and
   `set_ask` a new ask with a new id. Rewording (`prompt`, `why`) is still
   allowed, and so is reopening a withdrawn ask. The plan panel keeps the text
   the client has typed into any answer box (and into comp notes), keyed by ask
   or by comp, until it is stored. A block redrawn by another plan change, while
   the client had moved to another box, is drawn with their text still in it.

### Tests
- `tests/test_UAT_FC_BUG-236_client_keeps_their_place.test.ts` (jsdom, real
  components): 20 attachments scroll inside two rows, and the box and Send stay
  usable. A result is held while the box has text and shown when it is cleared,
  or when the marker is pressed. With an empty box it shows at once. Enter
  saves a one-line answer and shows "Saved ✓". A long answer's Done sends once.
  A redraw keeps typed text. A comp's Done saves both notes. "I've finished
  commenting" posts `finish` and says it was heard. Priming pacing and the
  short hand-back.
- `tests/test_UAT_FC_BUG-236_panel_keeps_its_shape.workers.test.ts` (real
  routes and D1): a consultant turn's `set_ask` from phone to single_choice is
  refused with ASK_SHOWN and nothing changes. Withdrawing and adding a new id
  is a new item. `finish` is stored and told on the next turn, once.