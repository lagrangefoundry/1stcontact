---
uid: bug-4ea7ae10
id: BUG-265
type: bug
title: 'Consultant: ''I''ve put some questions under Input'' arrives with no link
  to them — every announcement of new client input links straight to it'
created_by: EPIC-19
created_at: '2026-10-24T01:21:01.140666+00:00'
updated_at: '2026-10-24T15:59:51.215818+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: medium
  parent_uid: epic-95bc3b15
  story_points: 3
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-f0856610
  commits:
  - working_sha: f61a6cf928505363c85c15179f03997d2825149d
    reconcile_sha: null
    main_sha: null
  - working_sha: 79cb05b8c3d2db4c49a7f86794cfdb2c409e5dc9
    reconcile_sha: null
    main_sha: null
  version: 0.2.612
---

## Symptom

Dina's Diner, 2026-10-24: the consultant added three questions and said "I've put
the three [?] gaps under Input as quick questions", with **no link** to them. The
client has to find the questions on their own. The operator: "no link to the
questions area, we need one."

## Cause

The consultant followed its steering exactly. Both `priming.json` and `set_ask`'s
description (`plan-surface.json`) give the model line as "I've put a few quick
questions under Input — whenever suits you", with no link. `set_ask`'s result
gives no link to paste. Other announcements do carry one: `add_comp` returns
`COMPS_BOARD_LINK`, and `show_client`/`start_focus` return a `link`. Questions
were left out.

## Fix

**Every time the consultant tells the client there is something new for them on
the Input board, the line links straight to it.**

- `set_ask` (when it adds a new ask) returns a `link`: `#show=ask&ask=<id>` for
  one new question, or the Questions section for several. Following it opens
  Input, expands Questions and scrolls to the item (REQ-433). Its `say` tells the
  model to put the link **in** its one line, worded for the sentence (REQ-431
  section 10 style), for example "I've put three quick questions under Input:
  [answer them here]". The priming example changes to match, within the priming
  budget.
- **The host makes sure of it.** If a reply in a turn that added questions
  contains no link to Input's questions, the host adds one at the **end** of that
  reply (never the top), with the same fallback REQ-431 uses for switch links.
  This also covers a reply that mentions the questions in passing.
- **Same for every other kind of new client input**: story notes put up for
  reaction, the direction card (REQ-432), comparison sites (already
  `COMPS_BOARD_LINK`), and looks. The ticket session checks each one's result and
  steering, and gives any that lacks a link the same treatment.

## Test plan

`tests/test_UAT_FC_BUG-265_new_input_is_linked.*`, using the scripted-model host
harness:

- `set_ask` adding one question returns a link to that ask. Adding several returns
  the Questions section.
- A scripted reply that announces new questions with the link inline: delivered
  unchanged, with one link.
- A scripted reply that announces them with no link: the host appends one at the
  end and none at the top.
- The link opens Input with Questions expanded at the new ask (jsdom, real
  `showTarget`).
- Priming and `set_ask`'s description show the linked form.
- Re-run the REQ-431 section 10 inline-link UATs and the REQ-433 link UATs.
## Also: the host's own "question above" line

The host's working line in the same session read "_Fixing the top of your home
page — about 15 minutes._ Meanwhile, 1 question above needs you." That line is
the host's own text (BUG-245's news line), not the consultant's. It says "above",
which has been wrong since the questions moved into Input (REQ-433), and it has
no link. It gets the same treatment: "Meanwhile, 1 question needs you: [answer it]",
linking to the question.

## What changed (implemented)

- **`set_ask`**: adding a new ask (or reopening a withdrawn one) answers `link`
  (`[answer it here](#show=ask&ask=<id>)`), `new_input` (that href) and a `say`
  telling the consultant to announce all the questions it adds now in **one line
  with the link inside it**. For several questions it should use the Questions
  section, `[answer them here](#show=questions)`. Rewording an ask already up
  answers no link.
- **New `#show=questions` target**: the Questions section of Input as a whole.
  `show_client` accepts it, and the builder opens Input with Questions expanded
  and scrolled into view.
- **The host makes sure of it**: any tool result naming `new_input` is recorded
  for the round. At the end of the reply, for each part of Input (questions,
  comparison board, story board) the reply never linked, the host appends one line
  at the **end**, never the top: `[Answer the new question here](<that ask>)` for
  one, `[Answer the new questions here](#show=questions)` for several. Any link
  into that part counts, so a reply that links the section for one question is
  left alone. It uses the same end-of-reply position as REQ-431's "Showing you …"
  line.
- **Direction card (REQ-432)**: `set_decision` on `visual_concept` that newly puts
  a direction on its card for the client (it was not proposed before, or its text
  changed) answers a link to the comparison board, `new_input` and a `say`. An
  unlinked announcement gets `[Open the board to see](#show=comps)` at the end.
- **Comparison sites**: `add_comp` also names `new_input`, so the host's guarantee
  backs up `COMPS_BOARD_LINK`.
- **Story notes**: `pin_notes` answers a story-board link and a short `say`
  (link the board when you tell the client the notes are up to react to). The host
  adds nothing to the reply for notes.
- **Looks**: already linked (`make_alternatives` answers `#looks=` links), so
  unchanged.
- **The host's working line**: "Meanwhile, 1 question needs you:
  [answer it](#show=ask&ask=<id>)." or "Meanwhile, N questions need you:
  [answer them](#show=questions)." The word "above" is gone.
- **Steering**: the priming example now reads "I've put a few quick questions
  under Input: [answer them here](…)", with set_ask's link in it. `set_ask`'s
  description says the same.

## Design decisions

- The `say` is attached **after** the plan write, as `add_comp`'s is. A plan
  write's result is clipped to 200 characters per string (REQ-361), and that
  clipping cut the steering off.
- **Story notes get no host-appended link**: notes are pinned in most turns, and
  a forced link on every one would be noise. The result carries the link for when
  the consultant does tell the client.
- The priming paragraph was tightened so this change is net-negative on the
  priming budget (−134 characters against clean xgd-working). BUG-129's ceiling
  test is red on clean working before this change (200202 > 200000), and is
  200068 after.

## Test results

- `tests/test_UAT_FC_BUG-265_new_input_is_linked.workers.test.ts` (host, scripted
  model, real routes, D1 and ticket store): one new ask returns its link and the
  section link; rewording returns none; a reply that links the questions itself is
  delivered unchanged with one link; an unlinked reply gets the section link at its
  end, never its top; one unlinked new question gets its own link; the direction
  card gets its link; the working line links the open question and never says
  "above".
- `tests/test_UAT_FC_BUG-265_new_input_is_linked.test.ts` (jsdom, real
  `mountBuilder`): clicking `#show=questions` in the reply opens Input with
  Questions expanded and scrolled to. Clicking a single ask's link scrolls to that
  ask. Priming and `set_ask`'s description show the linked form.
- REQ-379's line assertion and REQ-401's priming example assertion were updated to
  the new wording. The REQ-413, REQ-431, REQ-433, BUG-236 and BUG-245 suites pass.