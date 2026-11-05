---
uid: request-85bf0f4c
id: REQ-425
type: request
title: 'Story board: a positioning card between the notes and the headline, and readiness
  per area so the consultant proposes first'
created_by: EPIC-19
created_at: '2026-10-21T19:43:28.066371+00:00'
updated_at: '2026-10-21T23:26:22.706524+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-8520a80f
  commits:
  - working_sha: 22ddcd152104147c90efdcaa962073ff6cf7ff2b
    reconcile_sha: null
    main_sha: null
  - working_sha: aa8e92eb49b8d85f7c3d4af5cdeb9140d1b88151
    reconcile_sha: null
    main_sha: null
  version: 0.2.580
---

## Why (Ariel's AR Welding run, 2026-10-21; operator)

After the client rejected the headline the consultant had chosen ("If you
wouldn't stand under it, don't weld it"), it asked: "If a contractor reads one
line at the top of your page, what do you want it to tell them?" — the right
question asked the hardest way (a blank page, DOC-33 §7.2). The client knew the
answer ("Beauty and Strength — quality custom metalwork"); most owners won't.

Three gaps:
1. **No synthesis step.** The story board collects material; nothing turns it
   into a position, so the consultant goes from notes straight to a headline.
2. **The story, not the sale.** The vivid adage was chosen because it's
   memorable, not because it tells a contractor why to choose this shop. Story is
   proof, not pitch.
3. **One pace for everyone.** Clients range per area (words, look, function) from
   "I don't know where to start" to "I know exactly what I want — just do it".

> If I know the answer to your question, don't force me through a brainstorming
> exercise with you to get there … if I don't know where to start, please help me
> build the concepts I need. (operator)

The priming half landed as `7b5db38f70` ("Propose first, then ask" and "From
story to message"); this ticket is the product half.

## What changes

1. **A positioning card on the story board**, above the headline slot (REQ-408),
   written by the consultant from the client's hearted notes:
   - what I'm hearing (two or three themes);
   - what you're known for;
   - why your customer picks you (per kind of customer, through what they're
     deciding on).
   The client hearts it or edits it (client edits are theirs, as with notes).
2. **Headline options are derived from the positioning card**, and the slot's
   options say which line of the card each one comes from. No headline options
   are offered before a positioning card exists.
3. **"Getting to know you" finishes with a confirmed positioning card** (hearted or
   client-edited), completing REQ-405's missing story criterion — or the honest
   fallback (nothing distinctive: be the most trustworthy and easiest to contact),
   recorded as a decision.
4. **Readiness per area on the plan**: messaging, look and feel, site functions —
   `unknown | has_ideas | knows_exactly`, set by the consultant from what the client
   says and shown in its per-turn notice, so it calibrates (propose and guide vs.
   carry out) without re-asking.
5. **Focus task (REQ-424):** react to notes → confirm the positioning card → pick a
   headline, one step at a time.

## As built

**The card** lives on the story board in the plan (`fields.board.positioning`,
story-core.ts). Its lines have ids that headline options name as their source:
`h1`…`h3` (what I'm hearing, 2–3), `known` (what you're known for, exactly one),
`p1`…`p3` (why a kind of customer picks you, 1–3, each naming the customer and
the reason through what they are deciding on).
- The consultant writes it with `write_positioning`, naming the hearted notes it
  is written from in `from`. A card from an unhearted note, or with the wrong
  number of lines, is refused. While the card is still the consultant's it can be
  written again.
- The client confirms it from the Story pane (`POST /api/plan/board`):
  `heart_card` toggles a heart, and `edit_card` rewords one line. Neither starts a
  turn. Once the client has hearted or edited the card it is theirs: a rewrite
  is refused `CLIENTS_WORDS`, as with notes.
- The consultant's next turn hears it: "hearted the positioning card", "took back
  their heart…", or "reworded the positioning card's known (what you're known
  for) line to …".
- The Story pane draws the card **above the headline slot**, in three titled
  parts. The heart button is pressed when the card is hearted, any line can be
  clicked and edited in place, and edited lines are marked "your words". The card
  has a fixed, literal style, like the rest of the board.

**Headlines come from the card.** `offer_headlines` takes `sources` (one card
line id per option) instead of `from` (hearted notes). With no card it is refused
`NO_POSITIONING`, and a missing or unknown source is refused. The sources are kept
next to `options` and `new_options`, and a chosen option keeps its line as
`headline.source`. On the pane, the shown option and each option in Choose… say
"from what you're known for" or "from why Contractors pick you".
*Supersedes REQ-408's rule that headlines are offered from named hearted notes.*
The card is now what is written from hearted notes, and headlines are written
from the card.

**The fallback.** `write_positioning({fallback: true})` writes the honest card: a
single known-for line, by default "The most trustworthy choice, and the easiest
to get hold of", needing no hearts. It is recorded as a decision: `core_story`
is set to `proposed`, with the value "Fallback — nothing distinctive yet: …". It
is never downgraded from a client state.

**The finish line** for "Getting to know you" (story-core `boardFinishGaps`, in
the per-turn plan entry) now includes the card. It shows "no positioning card",
then "the positioning card is not confirmed (the client hearts or edits it)",
until the card is confirmed or the fallback is recorded. A recorded fallback also
lifts "no note has a heart". The board line names the card state: none, written
but not confirmed, confirmed, or fallback recorded. The finish line stays
advisory, as REQ-408's is: `set_stage` does not refuse ticking the stage.
Several existing suites tick it freely, and the priming describes it as a finish
line, not a gate. The priming's finish line names the confirmed card or fallback.

**Readiness** is a plan field, `readiness: {messaging?, look?, functions?}`, each
`unknown | has_ideas | knows_exactly`. It is listed in `PLAN_KEYS`, so it
persists. The consultant sets one or more areas with `set_readiness` (PlanWork),
from what the client says and never by asking. Every per-turn plan entry carries:
"Client readiness — messaging: knows exactly; look and feel: not judged yet; …
Propose and guide where unknown, build on their ideas, carry out what they know
exactly". An unknown level is refused.

**Focus (REQ-424), one step at a time.** A story task now covers one step.
`start_focus({kind: 'story'})` picks the next step that is waiting:
1. the new unreacted notes, if there are any;
2. otherwise the item `positioning`, while the card is written and not confirmed;
3. otherwise the item `headline`, while options are offered and none is chosen.

Explicit items may not mix a step with notes. The step closes when the card is
confirmed or the headline chosen. The focus view carries the step, and the banner
reads "Heart the card, or edit it" or "Pick a headline" (with "Card confirmed" or
"Headline chosen" once done). The card or headline slot is outlined while
waiting. The consultant's lines say "confirming the positioning card…" or
"picking a headline…", and the finished notice says what the client did ("they
hearted the positioning card", "they chose the headline …"). While a story task
is open, `write_positioning` and `offer_headlines` are refused `FOCUS_OPEN`, as
`pin_notes` already was. The plan entry's waiting line names "the positioning
card to confirm" or "the headline options to pick from".

The talker may also use `write_positioning` and `set_readiness`. Priming
("Propose first, then ask" and "From story to message") now names
`set_readiness` and the positioning card.

## Test plan
- `tests/test_UAT_FC_REQ-425_positioning_and_readiness.test.ts`: the card is
  written from hearted notes, in its three parts, and can be rewritten while it is
  the consultant's. The client hearts it (toggles) or edits a line, and then it is
  theirs, which the next turn hears. Headlines are refused without a card or
  without matching sources. Options carry their sources, and the chosen headline
  keeps its source. The finish line is met by a confirmed card or a recorded
  fallback, and the fallback sets `core_story` to proposed. Readiness persists and
  appears in the per-turn entry, with unknown levels refused. The focus task goes
  notes → card → headline, with `FOCUS_OPEN` on a new offer during the card step.
- `tests/test_UAT_FC_REQ-425_story_pane_card.test.ts` (jsdom, the real story
  board): the card is drawn above the headline in three parts, the heart posts
  `heart_card`, and editing a line posts `edit_card`. Options show their source
  line, a card focus step outlines the card with the right banner text, and no
  card is drawn before one exists.
- `tests/test_UAT_FC_REQ-425_positioning_on_the_wire.workers.test.ts` (real
  routes, D1 and ticket store): the tools are granted. Readiness and the card are
  written in real turns. The client hearts through `/api/plan/board` and no turn
  starts. The next turn's tail carries "hearted the positioning card", "positioning
  card confirmed" and the stored readiness.
- Updated for the superseded headline rule: REQ-408's board, wire and manual
  suites, and BUG-233's boarded session. These now write the card and offer
  headlines with `sources`, and expect the finish line to include "no positioning
  card".