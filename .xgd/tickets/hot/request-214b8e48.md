---
uid: request-214b8e48
id: REQ-408
type: request
title: 'Story board: a third preview mode where the client''s own words become themed
  sticky notes and a headline'
created_by: EPIC-19
created_at: '2026-10-18T13:53:14.087264+00:00'
updated_at: '2026-10-18T15:33:15.897416+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 13
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-0b94cbb1
  commits:
  - working_sha: c80b1bcda31b262eda7250725ab1d485eed1f723
    reconcile_sha: null
    main_sha: null
  - working_sha: dd5e5b5c0ee9cb5a84bb0d5a0273e852b1daa3ff
    reconcile_sha: null
    main_sha: null
  version: 0.2.530
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



## As built (2026-10-18)

### Where it lives
- **Board data** is `plan.fields.board` (`themes`, `notes`, `headline`), with its shape, rules, client actions, consultant operations, notice, reminder and builder-brief text in `tools/generate/src/cli/ai/story-core.ts`. `checkPlan` runs the board's rules on every plan write; `panelView` (GET `/api/plan`) carries `board` and `drafted`.
- **The client** acts through `POST /api/plan/board` with an action: `react` (`heart` / `up` / `down`; the same one again, or none, clears it), `delete`, `add` (theme + text), `edit` (note + text), `choose` (an option on offer), `write` (the headline's text). Compare-and-set, retried once on a clash; a note or theme the board doesn't hold is a 404. It never starts a turn.
- **The Story pane** (`apps/control-app/src/builder/story-board.js`) is a mount mode beside View and Edit. It draws from the same plan view the plan panel reads (no second fetch), and its toolbar has only the mode toggle.

### Rules the consultant's operations enforce (group `KeepStoryBoard`, granted to both roles like the asks)
- `pin_notes` pins one or more notes. Each needs its text, **the sentence it came from** (`quote`, shown on hover), **exactly one emoji**, and a theme. Naming a theme the board doesn't have yet starts it.
- **At most six themes**: the palette has six muted colours and each theme gets the first free one.
- `reword_note` and `remove_note` refuse (`CLIENTS_WORDS`) a note the client wrote, edited, ❤️'d or 👍'd. Changing only the emoji is allowed on any note. Rewording a 👎 note clears the 👎, because the client hasn't seen the new words yet.
- `move_note` and `set_theme` re-theme, add and rename themes.
- `offer_headlines` takes 2–3 options, a `pick`, and `from`: hearted note ids. It's refused with no hearted notes behind it ("never from nothing") and refused for a line already offered and passed over. Before a choice the offer is the options; after a choice it's stored as `new_options` and never replaces the chosen line.
- Choosing an option, or typing a line (including typing over an offer), settles the headline. Every other option is kept as `passed`. A typed line is marked `yours` ("your words").

### The consultant is told
- **Per-turn notice:** on the plan-answers cursor, one line — "Your client worked on the story board since your last turn (N changes): gave n1 "…" ❤️; added "…" under Family; reworded…; deleted…; took back their reaction…; chose the headline "…" / wrote their own headline "…"". It ends "Ask about each 👎, or offer a better wording." when there's a new 👎. Her own pins are never reported back to her.
- **Per-turn plan entry:** a `Story board:` line (counts, themes, reactions, headline state). It also says what's still missing for "Getting to know you" to finish: a reaction on every theme, a heart, a headline offered. An empty board tells her to start pinning.
- **Priming** (both variants): a "## The story board" section, plus the board's line in the "Getting to know you" finish line. **Tool manual:** an overview paragraph and the six operations. **Opening message:** a bullet naming the story board.
- **Builder briefs:** every delegated brief gets a short story block appended once the board has a chosen headline or hearted notes: the headline verbatim, then the hearted notes verbatim. It's appended to every brief, not only to briefs that concern copy, because judging "concerns copy" would be a guess and the block is small (≤1,500 characters, counted against the brief ceiling).

### The preview
- While the plan has no `milestones.first_pass_at` (no first draft), opening a site switches the pane to Story **without remembering it** as the client's mode. If the first draft lands while the host is still showing Story, the pane goes to View so the client sees it. After that, Story is theirs to switch to, and a mode they pick is remembered as before.
- The board's style is literal values only (no custom properties), in the builder's own document, never the preview frame. So the site's palette and fonts can't reach it. Note tilt is deterministic per note id, so notes don't wobble on redraw. A note fades in when first pinned, with no fade under reduced motion. A redraw waits while the client is typing on the board.

### weakest_point
- Added to `plan-seed.json`'s checks on `first_pass_complete` and `before_publish`. A seed check missing from a stored plan is appended on read (`plan.ts`), so existing sites get it too. Priming's rubric paragraph names it.
- `test_UAT_FC_REQ-379_opening_publish_makes_the_pre_publish_checks_due` now expects `weakest_point` in the pre-publish list.
- `test_UAT_FC_BUG-205_…stepping_never_changes_the_mode` pinned the exact mode list to prove there is no looks mode. It now expects `['view', 'edit', 'story', 'comp']`: Story is a deliberate addition (this ticket), not a looks mode.

### UATs
- `tests/test_UAT_FC_REQ-408_story_board.test.ts`: the consultant's operations through the real Toolbox, client actions, notice, reminder, builder brief, priming/manual, weakest_point.
- `tests/test_UAT_FC_REQ-408_story_pane.test.ts`: the real builder in jsdom — third mode, opens first before a draft, notes/colours/hover, reactions and delete, add/edit, headline steps / Choose… / typing over / new options, style independent of the site palette and fonts.
- `tests/test_UAT_FC_REQ-408_story_board_on_the_wire.workers.test.ts`: real routes in workerd — consultant pins in a turn, client acts via `/api/plan/board` with no turn started, the next turn hears it, headline offered and chosen.
- Pre-existing failures, unchanged by this ticket (identical on the main checkout): REQ-379's two builder-session cadence UATs, the delegation suites (REQ-295/340/342/354, BUG-167), and a set of node chat-host/assistant suites. Because the delegation suites are red, the brief-appending path is covered at the `storyBrief` level only.