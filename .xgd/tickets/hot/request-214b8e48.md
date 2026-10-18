---
uid: request-214b8e48
id: REQ-408
type: request
title: 'Story board: a third preview mode where the client''s own words become themed
  sticky notes and a headline'
created_by: EPIC-19
created_at: '2026-10-18T13:53:14.087264+00:00'
updated_at: '2026-10-18T14:37:59.317165+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0b94cbb1
---

## What changes

The preview pane gets a third mode beside **View** and **Edit**: **Story**. It shows a story board: the client's own words about their business, pinned as sticky notes, grouped into themes, with a headline at the top. It's background material for the consultant — what the copy is written from — and never changes the site by itself.

Why (operator, 2026-10-18): a site is made distinctive by the business's story, not by its formatting, and the story is hard to get out of a client talking to an AI. Bob's Salon showed the consultant accepting pasted facts and moving on; ten reviews and the best story lines were never asked for. A marketing consultant would work this stage at a whiteboard with Post-its. The board does that, and because every note is the client's own words, nothing on it can be invented — unlike an early draft full of guessed copy, which a novice may read as the process getting them wrong.

### The mode
- **Story** sits with View and Edit in the preview's mode control.
- Before the first draft exists, the preview opens in Story (instead of the grey placeholder). Afterwards the client switches to it.

### Notes
- **The consultant pins key quotes from the conversation** onto the board.
- She may reword a quote so it reads as a note — change person or tense, drop unneeded words — but **never add a claim, a fact or an adjective**. Hovering a note shows the original sentence it came from.
- **One emoji per note**, chosen by the consultant, saying what it's about (e.g. 💇 the work, 👪 people, 💬 something a customer said, 📍 the place).
- **The client can add a note** by clicking a theme, and **can edit any note**, including ones the consultant pinned. A note the client wrote or edited is their wording: the consultant never rewords it.
- **The consultant never rewords a note the client has reacted to** with 👍 or ❤️.

### Themes
- The consultant groups notes into **themes, at most about six**. Each theme's name is written on the board and its notes cluster around it.
- **Each theme has its own note colour** from a fixed, muted palette. The written name means colour is never the only signal.
- Moving a note to another theme, or adding or renaming a theme, is done by asking the consultant in the chat (v1). No arrows (v1).

### Reactions
One per note, exclusive; clicking the same one again clears it.
- ❤️ **"That's us"** — the heart of the business. The note is shown slightly larger and lifted.
- 👍 **True, keep it.**
- 👎 **Not right, or not how I'd say it.** The note stays, shown pale with its badge, and the consultant asks about it or offers a better wording.
- 🗑 **Delete** — it doesn't belong. The note leaves the board.

### The headline
A slot at the top of the board answering **"why would the right customer pick you over what they'd otherwise choose?"** — one line a stranger reads on the home page, not a strategy statement. It costs one exchange, never a workshop.
1. **Empty:** grey shadow text *"The headline… why you?"*. The client may click and type; we don't expect them to.
2. **Options offered:** the consultant offers two or three, written from hearted notes, never from nothing. The slot shows her recommended one in full with a strip: **‹ 1 of 3 › · my pick · Choose…**. ‹ › steps through them in place; **Choose…** opens a panel with all options stacked, each with "Use this", and **"Write my own"** at the bottom. While options show, the slot is visibly undecided (dashed outline).
3. **Chosen:** the strip goes and the line stands alone (solid outline). Clicking it edits it in place. Unchosen options are kept in the plan as offered-not-chosen so they aren't offered again.
4. **Edited by the client:** marked *your words*; the consultant may suggest a change in the chat but never overwrites it.
- **A new offer never replaces a choice:** after a choice, new options appear as "2 new options" in the strip, opened only if the client wants.
- **Typing over an offer is a choice:** the client's text becomes the headline and the options are dismissed.
- If nothing lands after one round, the consultant moves on; the headline is settled in the draft instead.

### Look and feel
The board has its own fixed style, the same for every business, and **never takes the site's colours or fonts** — it's about messaging, not styling. Visually interesting but not overwhelming; **every visual element tells the client something or makes the board easier to read**:
- an off-white board with nothing but the notes on it;
- notes in a rounded, informal but legible face, readable without zooming, with a slight random tilt (the one purely decorative touch);
- the headline written like marker: bigger, darker, plain;
- one motion only: a note fades in when pinned, off under reduced motion.

### The consultant knows the board
The board only works if the consultant uses it, and Finding 13's lesson is that what she isn't told doesn't happen. So:
- **Her priming explains the board:** what it's for, that she fills it during "Getting to know you" and keeps it up as the client talks, how to pin and word notes (the never-add rule), themes, emoji, what each reaction means and what to do about a 👎, how to offer headline options, and that copy is written from hearted notes.
- **Her tool manual** describes the board operations: pin, reword, re-theme, remove a note; create and name a theme; offer headline options.
- **Her per-turn notice reports the client's board activity** since her last turn — reactions, added and edited notes, a headline choice or edit — the way panel answers are reported. Board activity never starts a turn by itself.
- **She announces board changes in one line**, e.g. *"I've put four of your sayings on the story board — heart the ones that are most you, and thumbs-down anything that's off."*
- **The finish line for "Getting to know you" names the board:** every theme has at least one reaction, at least one note has a heart, and the headline is chosen — or offered once and passed over.
- **Builders are briefed from it:** a brief that concerns copy carries the chosen headline and the hearted notes.

### Storage
The board lives in the site's plan (beside asks and comps), so it outlives any one conversation and is read the same way on the one-to-one and group-chat paths.

## Why free-coded
A new preview mode over the existing plan, plus consultant priming and plan operations — one cohesive feature.

## Test plan
UATs (`test_UAT_FC_<ID>_*`):
- Story appears as a third preview mode; a site with no draft opens in it.
- A pinned note shows its text, emoji and theme colour; hovering shows the original sentence.
- Each reaction sets its state, a second click clears it, and only one holds at a time; 🗑 removes the note; 👎 leaves it shown pale.
- The client can add a note to a theme and edit any note; the consultant's reword operation refuses a client-written, client-edited, 👍 or ❤️ note.
- The headline: empty shows the shadow text; offered options step with ‹ › and Choose… picks one; typing over an offer makes it the choice; a later offer leaves the choice in place.
- The board's styles do not change when the site's palette or fonts change.
- The consultant's next-turn notice reports reactions, client notes and a headline choice; a reaction starts no turn.
- The consultant's priming and manual describe the board, its reactions and the headline.

Regression scope: plan-panel and preview-mode UATs (REQ-364, REQ-390, REQ-398, REQ-401, REQ-402, REQ-403, BUG-215).



### Also in this ticket: a self-review that falls due (operator, 2026-10-18)
The consultant's priming now carries a distinctiveness rubric (swap test, headline test, one thing only they could say, real proof, main action in the first screen, restraint), to be applied after the first draft and before publishing. Prompt advice alone is the Finding 13 failure, so the host makes it fall due:
- A new plan check `weakest_point` — *"Honestly, the weakest part of the site right now is [weakest point]. Shall I [what you would do about it]?"* — on the existing triggers `first_pass_complete` and `before_publish`. Asking it requires her to judge the draft against the rubric.
- It was taken out of the prompt-only commit because `test_UAT_FC_REQ-379_opening_publish_makes_the_pre_publish_checks_due` pins the exact pre-publish check list; that assertion is updated here.
- Note: two other REQ-379 cadence UATs (`…first_builder_session_makes_layout_happy_due…`, `…later_builder_session_is_a_revision_round…`) already fail on xgd-working without any change; not caused by this ticket.