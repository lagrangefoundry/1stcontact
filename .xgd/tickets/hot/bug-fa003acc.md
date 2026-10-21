---
uid: bug-fa003acc
id: BUG-245
type: bug
title: 'One voice, one thing at a time: absorb work news into the next reply, comps
  as cards with Send/Skip and the consultant''s commentary, a board that knows it''s
  done'
created_by: EPIC-19
created_at: '2026-10-21T17:27:46.675245+00:00'
updated_at: '2026-10-21T18:22:05.237378+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-52904f4f
  commits:
  - working_sha: da70b3eae62ab0187a7335d66efecd082a95fa70
    reconcile_sha: null
    main_sha: null
  - working_sha: fea1d4de9588e389f5eed768ae12f12de868188b
    reconcile_sha: null
    main_sha: null
  version: 0.2.570
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


## As built

### 1. One voice: the work's news is absorbed, not posted
- **The browser decides** (only it knows the box has unsent text). `chat.js`'s
  `talkDesk` replaces BUG-236's hold: once the round has gone to work (first
  `progress`), text arriving while the composer has unsent text **or a talker
  reply is being written** is not drawn at all — absorbing is sticky for the
  rest of the round, so news is never cut in half. REQ-210's forked result (text
  after the last tool call) is decided at the round's end the same way: absorbed,
  or passed to `webui-chat` to show as its own bubble. Otherwise the result shows
  as it always did.
- **The marker is gone**: `CHAT_RESULT_HELD`, `.builder-chat-held`, the hold's
  polling. In its place a quiet status line, `CHAT_NEWS_WAITING` ("Done ✓ — the
  consultant will tell you in its next reply"), under the progress banner where
  the status widget was (`.builder-chat-news`), cleared when the client next
  writes.
- **The origin keeps the withheld result**: `POST /api/ai/absorbed
  {sessionId, turnId, text}` → `absorbed_news` on the session's chat ticket
  (`session-delta.ts`). The next turn's notice (`absorbedNewsDelta`, on the same
  `planAnswers` channel) hands the words over once: respond to what the client
  said first, then the news in a line or two, never a second question.
- **Replay matches what the client saw** without a framework change: the
  framework's folded turns carry `turn_id`, so `openSession` cuts each withheld
  result from the end of the turn that carried it (`withoutAbsorbed`, by turn id
  where known, else the latest turn ending with it) and drops a turn left empty.
  `openSession` answers `news: true` while one is untold, and the pane shows the
  same quiet line after a reload.

### 2. Comps announced in one line
- `add_comp` no longer returns a markdown tile; it returns `say`
  (`COMP_ADDED_SAY`): one line for the whole board, ending with
  `COMPS_BOARD_LINK` = `[Open the board to see](#show=comps)`, no pictures,
  addresses or descriptions, nothing asked until the client has looked.
- `show_client` gains the target `comps` (the board as a whole); the builder's
  `#show=comps` link opens Comparisons.
- A client-added comp reaches the next turn **by name** (`clientCompAddsLine`),
  not as a tile. `capture_site` failures no longer append a tile.
  `compTile` / `compTileDisplay` are deleted.

### 3–4. Comp cards: why, a note, Send or Skip
- Per comp on the plan: `why` (the consultant's line, via `add_comp`/`note_comp`
  `why`), `note` (the draft in the box), `state` (`sent`|`skipped`; absent =
  open), `sent`, `sent_at`. Board header note `comps_note` via `ask_comps note`.
- Card (`comparisons.js`): thumbnail (larger — one or two cards per row via a
  container query at 720px), name, address, "Open the real site ↗", source,
  Remove, "Why I picked it", a growing notes box ("What do you like? What would
  you never do?"), footer state + **Send to the consultant ➤** + **Skip /
  Reopen**. States: Open (empty), "Not sent yet" with a dot (unsent text), "Sent
  ✓ <time>" with an accent edge and Send dimmed, "Skipped" muted. Typing is kept
  as a draft (debounced 800 ms, and on leaving the box); editing a sent note
  reads "Not sent yet" again (derived: sent only while the box holds what was
  sent).
- Route `/api/plan/comp` actions are now `add`, `remove`, `skip` (the whole
  comparison), `draft`, `send`, `skip_site`, `reopen_site`
  (`clientCompAction`). The client's likes/dislikes route action (`note`) and
  `finish` are removed; the consultant still records likes/dislikes with
  `note_comp`.

### 5. Sending a note; the board knows when it is finished
- Send stores the note, then the board calls `chat.say("On <site>: <note>")`:
  the client's own message, sent where a typed one would go (the talker while
  work runs, else a turn).
- `settleComps`: when every card is sent or skipped, `comps_finished_at` is
  stamped (cleared again by reopening, a new site, or an edit that unsends). The
  next turn is told once (`CLIENT_COMPS_FINISHED_LINE`: sum up the conventions
  and record `visual_concept`, without being asked). When the board finishes on
  a **Skip**, nothing else starts a turn, so the board calls
  `chat.cue('comps_finished')`: `POST /api/ai/prompt {sessionId, cue}` runs a turn
  on a hidden cue (`comps-finished-cue`, kept off the replay like the
  continuation cue) — only while the finish is still untold, else 409 and
  nothing. A cue raised while a turn runs waits for the panel to be free.
- "I've finished commenting" (BUG-236) is removed.

### 6–8. The panel
- Typed answers: the button is **Save**, with a state beside it: "Not saved yet"
  (with a dot) while the box differs from the stored answer, "Saved ✓" while it
  matches. Multi-select keeps its Done. No turn starts.
- New questions: the "Open questions" heading carries `data-new="N new"`, drawn
  as a badge by CSS (the heading's words are unchanged); each unseen open item
  has `.plan-item--new` until the client touches or focuses it. Seen asks are
  kept per site in browser storage; the first sight of a site's panel sees what
  is already on it.
- While a round runs (`setBusy`), `.plan-panel--working`: a 2 px in-progress
  blue (#2563eb, the banner's) edge and a gently pulsing blue banner, static
  under reduced motion, plus `aria-busy` and a visually hidden "The consultant is
  working" — never colour alone.

### Priming
- New paragraph after the hand-back rule: you and the work are one voice; news
  that arrives while the client writes is handed to you next turn — answer
  first, then the news in a line or two; a result shown at once is one short
  message, never a second question.
- New-question announcements go inside the next reply, never as an interruption.
- Comps section: `ask_comps` note, `add_comp why`, ONE line with the board link,
  no tiles; a sent note "On <site>: …" gets two or three sentences at most (the
  deliberate exception to DOC-65's "a panel answer never starts a turn"); the
  finished board is summed up without being asked.

### Supersedes (explicit)
- BUG-236 item 3's hold (result held behind a marker) and its comp Done /
  "I've finished commenting"; BUG-202's in-chat comp tiles and the failed-capture
  tile; REQ-378's client likes/dislikes route. Their UATs are removed or
  rewritten: BUG-236 (marker ×2, comp Done, finish; host finish), BUG-202 (tile
  ×2; failed capture renamed `..._a_failed_capture_says_so_quickly`; priming
  renamed `..._the_priming_searches_in_the_same_turn_it_asks`), REQ-378
  (`client_likes_and_dislikes…`), REQ-419 (cards now have a note box and Send /
  Skip; "Open the real site ↗"). Typed answers' "Done" → "Save" in BUG-236's.

## UATs
`tests/test_UAT_FC_BUG-245_one_voice_one_thing.test.ts` (jsdom, real components):
unsent text → no bubble, no marker, absorbed reported with the round id, quiet
line until the next message; result during a talker reply absorbed; `news`
survives reload; card shows why / growing box / Send / Skip / board note;
draft → Send → labelled message → Sent ✓ → edit → Not sent yet; Skip mutes,
Reopen, last Skip cues once; two-per-row and sent/skipped CSS; `#show=comps`
opens Comparisons; a sent note is the client's message and starts the reply;
Save with Not saved yet → Saved ✓; "N new" badge and highlight until opened;
working state; priming (both corpora).

`tests/test_UAT_FC_BUG-245_one_voice_one_thing.workers.test.ts` (real routes, D1,
ticket store): `add_comp` keeps `why` and hands one line with the board link,
`ask_comps` note; a client-added comp named once, no tile; draft kept and never
told, send/skip/reopen and board finished/unfinished; finished board told once;
a Skip-finished board's cue turn runs once (409 after) and the cue is not
replayed; an absorbed result is cut from the replay, `news` set, the next turn
told once.