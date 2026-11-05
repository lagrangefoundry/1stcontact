---
uid: request-c5d93e94
id: REQ-431
type: request
title: 'Builder input: one Input view, cards that read at a glance, How you can help
  in place of the Now banners, inline show links, cleaner comparison tiles, and text
  boxes that keep focus'
created_by: EPIC-19
created_at: '2026-10-22T23:59:44.188382+00:00'
updated_at: '2026-10-23T15:53:50.954981+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  story_points: 18
  chat_comment: comment-a839cdd2
  commits:
  - working_sha: 5e682de7146a5f5897bb36baddffac7df2524f07
    reconcile_sha: null
    main_sha: null
  - working_sha: 31778f6d006595511134b38fe407fe7bce97ddb3
    reconcile_sha: null
    main_sha: null
  - working_sha: 8a3e06df37ee36087b878d89ed0fde8b8abd4749
    reconcile_sha: null
    main_sha: null
  version: 0.2.591
---

## Why

On the story board you should be able to tell from across the room which notes
you have reacted to and which you haven't. You can't now:

- every card carries four faint buttons (❤️ 👍 👎 🗑, `opacity: 0.45`), so the
  board looks busy and the cards look the same either way;
- the text is 17px, so getting through a few dozen notes takes a lot of
  scrolling;
- the REQ-424 "Now" banner sits at the very top of the board, above "Your
  position" and the headline and far from the cards. The client is looking at
  the chat, and the banner pulls their attention to the wrong place;
- the banner says "0 of 8 notes reacted to" when there are dozens of unreacted
  notes on the board. The 8 are only the current round (`start_focus` caps a
  story task at `max_story_notes: 8`), but the client reads it as the whole board.

## What changes

### 1. The card's background colour says whether it has been reacted to

- The signal is the **background colour of the whole card**, and nothing else.
  The card is not dimmed, it has no transparency, and the text is not greyed.
  The text and the pill stay at full contrast on both kinds of card.
- **Unreacted:** a muted, neutral background (pale grey, or the theme hue washed
  almost to grey), clearly different from any theme colour. It carries **no
  reaction buttons**, only the React pill (section 2).
- **Reacted (❤️, 👍 or 👎):** the background is restored to the card's theme hue
  (`.story-note--c0`…`c5`), and the chosen icon replaces the pill.
- 👎 no longer dims the card (`opacity: 0.55` today). A 👎 card has the full
  theme background, the same as 👍 and ❤️. ❤️ keeps its lift (scale and shadow).
- From a distance, the board reads as coloured cards (done) and grey cards (still
  to do). Nothing else competes with that: the blue outline on the current round's
  notes (`.story-note--pending`) is removed along with the banners (section 4).

### 2. One React pill instead of four buttons

- An unreacted note shows a single **React** pill button in place of the four
  icons.
- Hovering over the pill (on a pointer device) or clicking/tapping it opens the
  four-way choice: ❤️ That's us · 👍 True, keep it · 👎 Not right, or not how I'd
  say it · 🗑 Delete. These are the existing labels in `config.js`. Picking one
  closes the choice. Escape or a click elsewhere closes it without choosing.
- On a reacted note the pill is replaced by that **reaction's icon**. Clicking the
  icon opens the same choice, so the client can change it.
- This must work from the keyboard: the pill and icon are buttons, the choice
  can be reached with Tab, and each option has its label as its accessible name.
- **Picking the reaction the card already has clears it.** The card goes back to
  the neutral background with the React pill, as if it had never been reacted to.
  `story-core.ts` already treats a repeated reaction as "unreact"; the choice
  must show which option is current, so it is clear that picking it again undoes it.
- Saving does not change: `{action: 'react' | 'delete', …}` through
  `/api/plan/board`.

### 3. Smaller text

- The note text and its edit box go from 17px to about 14px, with the emoji and
  padding reduced to match. The aim is noticeably more notes per screen while
  the text stays comfortable to read.

### 4. The "Now" focus banners are removed

Decided 2026-10-22: the banners don't work. Their job moves to "How you can
help" (section 8c) and to the consultant's one line in the chat.

- All three REQ-424 focus banners are removed: on the questions panel, the
  story board and the comparisons board (`createFocusBanner` and its Done button,
  `focus-banner.js`). The blue pending highlights that the banner's `render()`
  drove go with them: `plan-item--focus`, `plan-panel--focus`, `comp-tile--focus`,
  `story-note--pending` and `story-headline--pending`. The open items are already
  visible: open questions in their list, unreacted notes in grey (section 1),
  and sites still to comment on.
- The server's focus task (`focus_tasks`, `start_focus`, the `FOCUS_OPEN` guard
  and the finished cue) stays. Without the Done button, a round still has to be
  able to end when the client stops working through it. Story notes have no
  Skip, so a round of notes could otherwise stay open indefinitely and block the
  consultant's writes to the board. Its endings become:
  - every item closed (`items`, unchanged);
  - the consultant's `end_focus` (unchanged);
  - **the client sends a message in the chat while a round is open.** That is
    their "back to the conversation", the same signal Done used to send. The
    round finishes as a `client` ending. The client's own message starts the
    turn, so no separate finished cue is sent for it.
- The consultant's tool descriptions and priming that mention the banner, "Done"
  or the banner's intro line are updated. The consultant's one line in the chat
  is now the only place the instruction appears (`FOCUS_SAY`, `start_focus`), so
  it must say what to do. Wording stays within the priming budget.

### 5. The count describes the board

- The count the client sees must not suggest that the board is nearly done when
  it isn't. It is the number of notes on the whole board that are still
  unreacted and not deleted, shown in "How you can help" (section 8c), not only
  the 8 in the consultant's current round.
- The round itself (its 8 items, and what the consultant is told) is not changed,
  except for how it can end (section 4).

## Test plan

`tests/test_UAT_FC_REQ-431_story_board_glance.*`, using jsdom on the story board,
plus a Playwright check for the visuals:

- an unreacted note renders with the neutral background, full-opacity text, a React pill and no reaction buttons;
- opening the pill shows the four options; picking one sends the existing action
  and the card renders with its theme background and that icon;
- clicking the icon reopens the choice, and a different pick changes the reaction;
- picking the current reaction again clears it: neutral background and React pill again;
- a 👎 note has its full theme background and is not dimmed;
- note text renders at the new size;
- no focus banner is drawn on the questions panel, the story board or the
  comparisons board while a round of each kind is open, and no pending highlight
  classes are applied;
- with a story round open, a client chat message finishes the round as a `client`
  ending, and no separate finished cue turn runs;
- with more unreacted notes than the round holds, "How you can help" reports the
  board-wide unreacted number.

Re-run the existing story board UATs (REQ-424/425/428, the REQ-408 builder.css
tail rule) and update the ones that check the old four-button markup, the
pending outline or the focus banner (REQ-424's banner/Done UATs are superseded by
section 4).

## Part two: one Input view, and a progress area that says how you can help

Added 2026-10-22, in the same conversation, for the same reason: the builder
pulls the client's attention in too many directions. The aim is one place where
the client gives input, and one place that tells them where they are and what
would help.

### 6. The questions panel moves into the preview, above the story board: the Input view

- Today the plan panel's questions ("Open questions" and "What you've told
  us", `plan-panel.js`) sit above the chat, in the chat column's vertical split
  (`app.js:1988`). They move into the preview pane's Story mode, **above the story
  board**.
- That mode is renamed from **Story** to **Input** (`PANE_LABELS`,
  `STORY_MODE_LABEL`). The Input view is everything the client is asked for:
  questions first, then the story board.
- Everything that opened Story now opens Input: `storyFirst()` before the first
  draft, `#show=story`, and `#show=ask` (`planPanel.showAsk`, which must also
  switch to Input before it scrolls to the ask). The client's remembered mode
  carries over: a stored `story` becomes Input.
- BUG-246's pane report gives the consultant the new name. Everything the
  consultant is told about where things are must be updated to match. In
  `priming.json`, "the preview has Story: a board of sticky notes", "View,
  Edit, Story, Comparisons or Looks" and "the story board is under Story, beside
  View and Edit" change, and so does anything that says the questions are on a
  panel above the chat. Wording stays within the priming budget.

### 7. The headline goes above "Your position"

- On the board the order becomes: **headline**, then "Your position" (REQ-425),
  then the notes. Today it is "Your position" first (`story-board.js:151`).

### 8. The progress area stays in the chat column, and is always there

The chat column's top part (the split's primary side, where the questions were)
becomes the **progress area**, in this order:

- **a. The progress bar** (the phase tracker `.plan-stages`, REQ-390/398), at
  the top, unchanged.
- **b. The workers area** (the chat's status widget, BUG-244), under it,
  **always visible**. When nothing is running it does not disappear (`hidden`,
  `display: contents` today). It shows a quiet idle line, for example "Nothing
  being built right now". When work starts, it shows the activity as it does now.
- **c. A new "How you can help" section**, under the workers area. It replaces
  the blue "Now" banners (section 4). It has one line per kind of input the
  client owes, each a link to where they give it:
  - "3 questions for you to answer" opens Input, scrolled to the questions;
  - "5 notes for you to react to" opens Input, scrolled to the story board;
  - "4 sites to comment on" opens Comparisons, while the comparison board is
    raised and has sites the client has neither commented on nor skipped;
  - "Choose a headline" and "Confirm your position card" open Input at the
    headline or the card, while a headline is offered but not chosen, or the
    card is drawn but not yet confirmed. These are the REQ-425 steps the banner
    used to prompt.
  - The lines come from one list of kinds, each with its own count and target,
    so a new kind of input is a new entry.
  - A line whose count is 0 is left out. When every count is 0, the section says
    so in one line (for example "Nothing needed from you right now").
  - Questions are the open asks (`status === 'open'`, as `PLAN_STILL_TO_ANSWER`
    counts them). Notes are every unreacted, undeleted note on the board, the
    same board-wide number as section 5.
- The REQ-379 line "N questions still to answer" is replaced by the questions
  line here and is not shown twice.

### 9. The counts update in real time

- Both counts change **the moment the client acts**: answering or skipping a
  question, reacting to, un-reacting, or deleting a note. They also change when
  the consultant adds asks or notes in the middle of a turn (`plan_changed`).
- Today a story board write returns its view to the board only
  (`/api/plan/board`, then `followFocus`), and the plan panel's numbers wait for
  the next `refresh()`. Every write's returned view must reach the progress
  area, the questions and the board alike. That means one view, drawn
  everywhere, not a second fetch.

### Test plan (part two)

Add to `tests/test_UAT_FC_REQ-431_story_board_glance.*`, or a sibling file
`..._input_view.*`:

- the preview's modes show **Input** and no Story; Input shows the questions
  above the story board; the chat column no longer holds the questions;
- `#show=story`, `#show=ask` and `storyFirst()` open Input, and a stored
  `story` mode restores as Input;
- the board's order is headline, "Your position", then notes;
- the progress area's order is progress bar, workers area, How you can help;
- with nothing running, the workers area is visible with the idle line;
- "How you can help" shows the open-question count, the board-wide unreacted
  count, the sites still to comment on, and the headline and position-card lines,
  each link opening the right view at the right section; a zero line is absent;
  all zero gives the single "nothing needed" line;
- commenting on or skipping a site, choosing a headline, and confirming the card
  each update their line straight away;
- reacting to a note, and answering a question, changes the matching count with
  no refresh or turn in between;
- the priming text names Input, not Story (update the BUG-246/REQ-408 priming
  UATs that assert the old wording).

### 10. A "Showing you …" link sits inside the consultant's sentence, not above it

- **Observed:** a reply began with a standalone link line, "Showing you the
  comparison board", above all of its paragraphs. Further down, the reply said
  "Meanwhile, I've put the comparison board in front of you". The link was
  separated from the sentence it belongs to.
- **Cause:** `keepClientOriented` (`cadence-core.ts:335`) yields
  `shownLine(shown)` as its own paragraph straight after a switching tool call
  (`show_client` with `how: 'switch'`, or `start_focus`). When the consultant
  calls the tool before it has written anything, the line lands at the top.
- **Wanted:** the link is part of the consultant's own sentence, for example:
  "Meanwhile, the comparison board is ready for you [open the board]. For each
  shop, tell me one thing you'd steal and one thing you'd never do, and skip any
  that don't speak to you."
  - The switching tool's result gives the consultant the link (its `href`), and
    the descriptions of `show_client` and `start_focus` tell it to put that link
    inline, in the sentence that says what it showed, worded for the sentence
    (for example "[open the board]").
  - The host no longer emits a standalone "Showing you …" line ahead of the text.
    If the consultant's message for that turn has no link with the shown `href`,
    the host adds a "Showing you …" link at the **end** of the message, so the
    way back to the view is never lost. It is never added at the top.
  - The view switch itself (`SHOW_CLIENT`) still happens when the reply arrives,
    as now.
- Group chats (`say_in_room`) are unchanged.

### Test plan (part three)

- With a scripted consultant that calls a switching tool and then writes a
  sentence containing the shown `href`, the delivered message has the link inline
  and no "Showing you …" line.
- When the consultant's text has no such link, the message ends with one
  "Showing you …" link, and none appears before the text.
- The view switch still fires. (Assert on the tool result and the delivered
  text, not on transcript-wide matches.)

## Part four: comparison tiles, and text boxes that keep their focus

### 11. Typing in a text box never loses focus (defect, the most urgent item)

- **Observed:** on the comparisons board, if you stop typing in a tile's notes
  box for a moment, the box loses focus. Anything typed next goes nowhere.
  The operator: "these are barely usable".
- **Cause:** `comparisons.js` saves a draft 800 ms after the last keystroke
  (`DRAFT_MS`) and redraws with the returned view. The redraw keeps the tile being
  typed in, but re-inserts it with `grid.replaceChildren(...)`. Detaching the
  focused textarea drops its focus, and nothing restores it. The same happens on
  every plan refresh (`onPlanChanged` mid-turn, `onTurnEnd`) through the plan
  panel's `onView`. The plan panel's typed answers have the same flaw: `render()`
  re-inserts the in-use block with `list.replaceChildren(...)`, so a refresh while
  the client is typing an answer blurs it. Only the story board is safe, because
  `typing()` holds the redraw until `focusout`.
- **Wanted:** on every input surface (the questions, the story board, the
  comparisons board, and the new Input view), no redraw ever detaches or replaces
  a text field that has focus. Focus, caret position, selection and the typed text
  all survive draft saves, the returned views of the client's own actions,
  mid-turn `plan_changed` refreshes and turn-end refreshes. One shared way of
  redrawing a list does this for every panel: nodes already in place are left in
  place and only changed nodes are moved or replaced. It is not a per-panel
  patch.

### 12. Comparison tiles read cleanly

- **Text size:** the comparisons board sets no base font size, so it renders at
  the browser default of 16px (rem = 16px), while the rest of the builder uses 13px
  (`--builder-control-font-size`). It looks giant next to everything else. The
  board gets the builder's base size, and its tile text scales from that.
- **Title and address are separated:** the business name and its domain render
  run together ("…in the Bay Areahrtmobilewelding.com"). The domain sits on its
  own line under the name, in the smaller muted style.
- **More space between the tile's parts:** there is a clearly larger gap between
  the name/address block and the link row (Open the site · Suggested · Remove), and
  between the link row and "Why I picked it". Today the whole tile is one 8px
  flex gap.
- **"Open the real site ↗" becomes "Open the site ↗"** (`COMPS_VISIT`).
- **The "Your notes" label is removed** (`COMPS_NOTES_LABEL`). The notes box keeps
  its placeholder ("What do you like? What would you never do?") and gets an
  accessible name, so it is still announced properly.

### Test plan (part four)

- With a comparisons tile's notes box focused and part-typed, a draft save, a
  returned view from another tile's action, a `plan_changed` refresh and a
  turn-end refresh each leave the same element focused, with the caret where it
  was and the text intact. The same holds for a typed answer on the questions
  panel. jsdom, real `render()` paths, asserting on `document.activeElement`
  and `selectionStart`.
- A tile renders the name and domain as separate lines, the visit link reads
  "Open the site ↗", and there is no "Your notes" label, while the textarea
  still has an accessible name.
- Playwright: the comparisons board's tile body text computes to the builder's
  base size (not 16px), and the gaps between the head, the link row and "Why I
  picked it" are larger than the gaps inside each row.

## Implementation (as landed)

- **One redraw for every input surface** — `list-redraw.js`'s `placeChildren`:
  nodes already in place stay put, and the node holding focus is never moved
  (the others are placed around it). The questions panel and the comparisons
  board both redraw through it. The story board keeps its own hold-while-typing.
- **The plan panel is split in two.** Its questions are `planPanel.element`, at
  the top of the Input view (`.input-view`: questions, then the story board, one
  scrolling column). Its progress banner is `planPanel.tracker`, at the head of
  the chat column's `.progress-area` (the split's primary side), followed by How
  you can help. The workers row (`statusSlot`) is always shown and holds the idle
  line "Nothing being built right now" whenever no status widget or news line is
  visible in it.
- **One view, drawn everywhere.** A write on the story board or the comparisons
  board hands its returned view to the host, which draws it through
  `planPanel.render` — questions, board, comparisons, How you can help and the
  focus follower alike. Neither board draws a write's view itself when the host
  takes it. No re-read is needed for any count to move.
- **How you can help** (`help.js`) has one list of kinds — questions, notes,
  comps, headline, positioning — each with its count and target. Comps count
  while raised, as sites whose card is still open (not sent, not skipped). The
  headline line shows while the headline is `offered`; the card line while the
  card is `written` (drawn, not confirmed). Lines open Input scrolled to the
  questions, the notes, the headline or the card, or open Comparisons.
- **Pane id `story` is now `input`** (`client-pane.js`), label Input. A
  remembered `story` mode is rewritten to `input` before the pane restores.
  `#show=story` opens Input; `#show=ask` switches to Input and then scrolls to the
  question. The show target names (`story`, `ask`) are unchanged.
- **The React control.** One button per note (React, or the reaction's emoji),
  `aria-haspopup`/`aria-expanded`, opening a group of four labelled buttons (the
  three reactions and Delete), the current reaction `aria-pressed` with
  "pick again to clear" in its title. It opens on hover with a pointer (CSS
  `@media (hover: hover)`) or on a click; Escape (focus back to the control) or a
  pointer-down elsewhere closes it; only one note's choice is open at a time.
  Unreacted cards paint `#ecebe8`; reacted ones their theme colour; nothing is
  dimmed. Note text and its edit box are 14px.
- **Focus rounds end on the client's chat message.** `/api/ai/prompt` (not a
  cue) and `/api/ai/interpose` both call `endFocusOnClientMessage` first, which
  finishes an open round as `client`. `focus_finished_at` (what the builder cues
  on) now counts only rounds ended by every item closing, so a `client` ending
  never produces a cue, and the origin would refuse one anyway (the turn was
  told). The consultant's notice says "they went back to the chat with N of M
  left". The `/api/plan/focus` route, `focusAction` and `focus-banner.js` are
  deleted.
- **Consequence for the talker:** a talker only runs on a client message, and
  that message now ends any open round, so the talker is never briefed that a
  round is open. Its `talker-focus` briefing and the branch that chose it are
  removed; while the build runs, a message from the client frees the board for
  the talker (it can pin again).
- The plan view keeps `focus` (the open round, or `null`) as data; no surface
  draws it.
- **Show links.** A one-to-one `show_client` switch result carries `href` and a
  `say` telling the consultant to link it inside the sentence that says what it
  showed, never on a line of its own. `start_focus`'s `say` (`FOCUS_SAY`) says the
  line is all the client is told and to link its own words with the `href`.
  `keepClientOriented` still delivers the switch immediately after the call, but
  emits no line there; at the end of the reply (before the backend's `done`) it
  adds `[Showing you …](href)` for each switched view the reply never linked.
- **Comparison tiles:** board font size `var(--builder-control-font-size)`
  (13px), tile text in `em` from it; head is a column (name, then address);
  head → link row and link row → "Why I picked it" spacing larger than inside
  either; "Open the site ↗"; no "Your notes" label, the textarea named
  "What do you like? What would you never do? — <site>".
- **Wording for the consultant and the client:** `priming.json` (the plan panel,
  stages, story board and showing sections, both copies), `plan-surface.json`
  (asks, stages, `show_client`, `start_focus`, comps) and the opening in
  `plan-seed.json` (Input; How you can help) name Input, not Story or a panel
  above the chat. BUG-129's system text is 80 characters shorter than before
  this change (it was already over its ceiling).

## Design decisions made while implementing

- The empty questions panel no longer fills a pane, so REQ-417's ghost text is
  centred within the panel's own band at the top of Input, not in a full-height
  pane.
- REQ-424's banner/Done UATs were deleted (superseded by section 4). Its guard
  UAT now tries the held writes in the same turn that opened the round, because
  the client's next message ends it.

## UATs

- `tests/test_UAT_FC_REQ-431_story_board_glance.test.ts` — neutral unreacted card
  with one React pill; the choice and a pick; change and clear; Escape / click
  elsewhere / one open at a time; 👎 at full theme colour; headline → card →
  notes; no banner or pending class on any surface during a round; Chromium: 14px
  text, the two backgrounds, opacity 1.
- `tests/test_UAT_FC_REQ-431_input_view.test.ts` — Input replaces Story, questions
  above the board, chat column holds none; `#show=ask`, `#show=story`, the
  first-draft rule and a remembered `story` open Input; priming names Input;
  progress area order and the always-there workers row; How you can help lines,
  links, zero and all-zero; every count moving on the client's own action with
  no re-read; focus/caret/text kept in a comparison note (draft save, another
  tile's action, `plan_changed`, turn end) and in a typed answer; tile markup;
  Chromium: 13px tile text and the larger gaps.
- `tests/test_UAT_FC_REQ-431_focus_and_show_on_the_wire.workers.test.ts` — a
  client message ends a round as theirs with no cue; a message while the work
  runs ends a story round and the talker can pin; an inline link gets no
  "Showing you" line; a reply without the link ends with exactly one.
- Updated for the new layout and names: BUG-200, BUG-209, BUG-235, BUG-244,
  BUG-245, BUG-246 (both), REQ-364, REQ-379, REQ-390, REQ-398, REQ-401, REQ-403,
  REQ-408, REQ-413 (both), REQ-417, REQ-419, REQ-424 (both), REQ-425.