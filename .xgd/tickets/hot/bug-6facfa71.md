---
uid: bug-6facfa71
id: BUG-236
type: bug
title: 'Client loses their place: attachments hide the text box, crowded turns, mid-reply
  worker dumps, no Done on the panel, questions changing form'
created_by: EPIC-19
created_at: '2026-10-20T19:24:29.832787+00:00'
updated_at: '2026-10-20T19:41:17.956300+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: high
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
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