---
uid: bug-2b687d8f
id: BUG-302
type: bug
title: 'Client cards: edits that save, revisions the consultant can make, the client''s
  own names, and the look card at the top'
created_by: EPIC-19
created_at: '2026-10-27T20:22:37.289007+00:00'
updated_at: '2026-10-27T20:43:50.281908+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-6a23c32c
  story_points: 5
  commits:
  - working_sha: 0bd13c7cf377ecb07beeff2d9e6a5fcb9f515a41
    reconcile_sha: null
    main_sha: null
  - working_sha: bab860e46cd3e86cf05ff95c66980fe6932d65a0
    reconcile_sha: null
    main_sha: null
  version: 0.2.680
---

## Why

On First-Draft-Test Dina's Diner 6 (2026-10-27), the operator edited "The look we're going for" card four times and the original text came back every time. Asking the consultant to change it didn't help either. The cause was a bug, but the design behind it is also wrong: a card the client has hearted is frozen against the consultant, so the client has to type out an improvement the consultant came up with themselves.

## What

**1. Editing the look card never saves (the bug).**
- `compAction` in `apps/control-app/src/builder/api.js` forwards `site`, `action`, `url`, `reference` and `note`, but not `text`.
- So the board's `edit_direction` arrives with no words, and the server refuses it: "the direction needs some words".
- The board then redraws the old wording, and the error line reads "That was not saved: the direction needs some words".
- **Fix:** forward `text`. The client's edit is stored, and shown after the redraw.

**2. The consultant can revise a card the client owns, after discussing it with them.**
- **Today:** once the client has hearted or edited "Your position" (`write_positioning`) or "The look we're going for" (`visual_concept`), the consultant's rewrite is refused (`CLIENTS_WORDS`). Its only route is to ask the client to type the change in themselves.
- **New:**
  - The consultant may write a new version of either card when the conversation has led there: the client asked for it, or agreed to a suggestion.
  - The write never silently replaces the client's words. The card shows the new wording as the consultant's revision, the client's heart is cleared, and the previous version is kept.
  - The client can heart the new one, edit it, or go back to their previous version with one click.
  - The plan's log records who wrote each version.
- Rule 2 of the consultant's instructions ("never undo their choices") still holds. A revision replaces nothing the client can't get back, and the consultant offers it only after discussing it with them.
- Story-board notes the client wrote or reacted to stay protected as today. This change is for the two cards only.

**3. The consultant names things by what the client can see.**
- The client sees **"Your position"** at the top of the story board, and **"The look we're going for"** at the top of the comparison board.
- The consultant's tool text, host lines and instructions call them "the positioning card" and "the direction card". In conversation it improvised "the summary card".
- **Fix:** wherever text tells the consultant how to refer to a card or panel in front of the client, it gives the visible label, for example "the 'Your position' card on the story board". Internal names may stay in tool and parameter names. Apply the same check to the other client-visible surfaces the consultant names.

**4. "The look we're going for" goes at the top of the comparison board.**
- Today it sits between the consultant's note on the sites and the instructions for reviewing them.
- **New order:**
  1. the look card;
  2. the consultant's note on the range of sites;
  3. the instructions;
  4. any error;
  5. the sites.
- The edit error, when there is one, appears next to the card it belongs to, not among the comparison instructions.

## As implemented

**1. The save.** `compAction` forwards `text`. The board's `edit_direction` stores the client's words and draws them back.

**2. Revisions of the client's cards.**
- **The consultant's tools.** `write_positioning` and `set_decision` (for `visual_concept`) take a new `client_said` parameter: the client's words asking for the new version or agreeing to it.
  - A card the client owns is "Your position" hearted or edited, or a look card the client agreed (`chosen`).
  - Revising such a card without `client_said` is refused with a new code, `CLIENTS_CARD`. Its message says when a revision is allowed and what the client will see.
- **What the write does.**
  - It lands as a revision: the card shows "Revised by your consultant", and the heart is cleared (positioning `heart` false, or direction `proposed`).
  - The version it replaced is kept: `board.positioning.previous`, or `decision.previous` with its value, state, answer and client stamp. Only one level is kept. A second revision before the client acts keeps the client's version, not the first revision.
- **The log.** A `### Decision N` entry names the card by its visible label. It records the new version "revised by the consultant", the previous version and who wrote it ("the client's words", or "the consultant's, hearted/agreed by the client"), and **The client said:** with their words.
- **Going back.**
  - Each card has a "↩ Back to your previous version" button while a previous version is kept. Its tooltip shows that version.
  - The client actions are `restore_card` (story board) and `restore_direction` (comparison board). Each puts the previous version back exactly as it was (heart, edited lines, agreed state and answer) and drops the revision.
  - The restore is logged. The consultant's next turn is told "went back to their previous version of the … card, setting your revision aside".
- **Unchanged.** Story-board notes keep `CLIENTS_WORDS`. A delegated direction (the client said "you decide") is still rewritten freely, as before.

**3. Visible names.**
- The constants `POSITION_CARD` / `LOOK_CARD` (story-core) are used in every host line, reminder, notice and refusal that names the cards: the settled notice, the acknowledgement, the waiting line, the focus-task lines, `DIRECTION_SAY`, and the board and direction change notices.
- The plan-surface declaration no longer says "positioning card" or "direction card". Its overview gains a rule, "Name what your client can see by its label", which gives "Your story board", "Your position", "Sites we're comparing" and "The look we're going for", and says never to invent a name.
- Internal tool and parameter names are unchanged.

**4. Board order.** The look card, then the card's own error, then the consultant's note on the range, then the instructions, then the board's error, the empty state and the sites.

## Test plan

- `tests/test_UAT_FC_BUG-302_card_boards.test.ts` (jsdom, real boards):
  - `direction_edit_is_saved`: through the real `api.js` `compAction`, with `fetch` standing in for `/api/plan/comp`.
  - `look_card_heads_the_board`: the order, and the card's own error beside it.
  - `client_restores_previous_version_on_either_board`: one click on each board.
- `tests/test_UAT_FC_BUG-302_client_cards.test.ts` (node, real Toolbox and plan surface):
  - `consultant_revises_a_hearted_card`: both cards; refused without `client_said`; the heart cleared; the previous version kept; the log names the consultant.
  - `client_restores_previous_version`: the client's edited words come back; logged; the consultant is told.
  - `consultant_text_uses_visible_labels`: the declaration, the settled line, `DIRECTION_SAY`, the board and direction notices.
- Retargeted to the new names and behaviour:
  - REQ-425: `CLIENTS_WORDS` → `CLIENTS_CARD`, and the card's name.
  - REQ-432: the view's new `revised`/`previous` fields; a revision of the client's edited direction needs `client_said`.
  - REQ-408, BUG-264, BUG-269, and the REQ-425/REQ-432 wire suites: wording only.