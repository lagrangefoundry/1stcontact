---
uid: bug-fa003acc
id: BUG-245
type: bug
title: 'One voice, one thing at a time: absorb work news into the next reply, comps
  as cards with Send/Skip and the consultant''s commentary, a board that knows it''s
  done'
created_by: EPIC-19
created_at: '2026-10-21T17:27:46.675245+00:00'
updated_at: '2026-10-21T17:27:46.675245+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: high
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-52904f4f
---

## Why (Ariel's AR Welding run, 2026-10-21; operator decisions)

Too many things happen at once, and the flow breaks:
- While the client was answering a story question, the comps arrived as a second
  message — four screenshots, four links, four descriptions and a second
  question — and pushed the conversation out of view. Panel questions appeared
  at the same time with no mention.
- Twice, while the client typed, a button "The consultant has finished — show
  what it said" (BUG-236 item 3) appeared; clicking it showed nothing (the held
  worker prose is hidden by REQ-210 item 5a during a fork, so the release has
  nowhere to render). And the button itself announces a second voice.
- The comp note boxes are tiny; "Done" doesn't say whether anything was sent.
- After commenting on every comp, the client had to tell the consultant they
  were finished.
- The progress banner was easy to miss while the consultant worked.

> We want the talker and the worker to really appear as one entity.
> Too many things at the same time is bad.

## What changes

### 1. One voice, one thread at a time
- While the client is mid-answer (unsent text in the box) or a question to the
  client is open, nothing opens a new topic in the chat. News from the work —
  comps found, a draft built, panel questions added — is **not posted as its own
  message**; it is **absorbed into the consultant's next reply**, after that
  reply has responded to what the client said ("…Meanwhile, I've put four shops
  on the comparison board — open the board when you're ready.").
- If the client isn't mid-answer, the news can come at once — but as one short
  message, never a second question on top of an open one.
- **Remove the "The consultant has finished — show what it said" marker**
  (`CHAT_RESULT_HELD`, the hold in `chat.js`) and BUG-236 item 3's hold. While the
  result is waiting, the status widget shows a quiet state ("Done — first draft
  ready"), not a message.
- The same applies to a worker finishing while a talker reply is generating
  (replaces REQ-210 D5's "result shown after the talker's reply" for this host).
- Replay after reload must match what the client saw: a result absorbed into a
  later reply isn't shown again as its own bubble. If this needs the framework
  (marking a worker result as delivered-via-the-next-round), file it in
  lagrange-framework and do this side as far as it can go.

### 2. Comps announced in one line, with a link
The chat says only, e.g.: "I've put four Bay Area fabrication shops on the
comparison board, under Comparisons in the preview, chosen to show you a range.
[Open the board to see](…)" — the link is REQ-413's view link to Comparisons.
No screenshots, site links or per-comp descriptions in the chat (reverses
BUG-202's in-chat comp tiles). The "where on the range?" question waits until the
client has looked.

### 3. Comp cards, with the consultant's commentary
Each comp is a proper card on the board (REQ-419): a larger hero thumbnail, the
site name and "Open the real site ↗"; **the consultant's note on why it was
chosen** (a new per-comp field the consultant sets, one or two lines); a
multi-line notes box that grows ("What do you like? What would you never do?");
a footer with state and buttons. Two cards per row on a wide panel, else one.
The board also has a short header note from the consultant explaining the range.

### 4. Each comp is open or closed: Send or Skip
- Footer buttons: **Send to the consultant ➤** and **Skip**.
- States, always visible: **Open** (empty or with unsent text — "Not sent yet"
  and a dot when there's text); **Sent** ("Sent ✓ <time>", the card edge in the
  accent colour, button dimmed); **Skipped** ("Skipped", card muted).
- Typing is kept as a draft (never lost), but only Send reaches the consultant.
- A closed card can always be reopened: editing a sent note makes it "Not sent
  yet"; un-skipping reopens it. Re-sending posts the change.

### 5. Sending a note starts a short exchange
- On Send, the note appears in the chat **as the client's own message**, labelled
  with the site ("On JDS Custom Ironworks: …"), and the consultant replies in at
  most two or three sentences: what it takes from the note for this site, and a
  follow-up question only if the note opened something worth asking. This is a
  deliberate exception to "a panel answer never starts a turn" (DOC-65) — comp
  notes are opinions to react to; fact answers keep today's behaviour.
- **The board knows when it's finished.** When every card is Sent or Skipped, the
  host tells the consultant (per-turn notice / cue) and the consultant, without
  being asked, sums up the conventions it will follow and records them as the
  visual_concept decision — the step the first draft is built from. BUG-236's
  "I've finished commenting" button is replaced by this.

### 6. Panel answers: Save states
Fact questions' typed answers use the same states with **Save**: "Not saved
yet" → "Saved ✓". (No turn.)

### 7. New panel questions are visible and mentioned once
A **"N new"** badge on the panel and a highlight on new items until opened; the
consultant mentions them in one line inside its next reply (item 1), never as an
interruption.

### 8. The panel shows when the consultant is working
While the consultant (or its build) is working, the panel goes through a clear,
visible change — a coloured edge/header tint, gently animated, static under
reduced motion — so the client can't miss it. **Default colour: the progress
banner's in-progress blue**, so "blue = in progress" means one thing everywhere
and green stays "done"; the operator judges it in the next run. Never colour
alone: the status widget's words carry it.

## Test plan
- With unsent text in the composer, a finished build posts no bubble and no
  marker; the next reply contains the news after its response; reload shows the
  same.
- Comps announcement: one line with a Comparisons link; no images or site links.
- Comp card shows the consultant's why-chosen note and a growing notes box;
  states Open / Not sent yet / Sent ✓ / Skipped render and transition; edit after
  send returns to Not sent yet.
- Send posts the labelled note as a client message and the consultant's reply is
  short (priming); when all cards are Sent/Skipped the consultant receives the
  board-complete notice and records visual_concept.
- Fact answers show Not saved yet → Saved ✓ and start no turn.
- New asks raise the badge and highlight; the panel shows the working state
  while a round runs and clears after.