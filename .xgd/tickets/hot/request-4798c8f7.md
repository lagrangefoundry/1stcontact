---
uid: request-4798c8f7
id: REQ-467
type: request
title: 'Chat links: name where they go, and only point at what''s already there'
created_by: EPIC-19
created_at: '2026-10-26T02:26:26.120280+00:00'
updated_at: '2026-10-26T03:00:57.202597+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-df6587c3
  commits:
  - working_sha: 1ce185073db642a2b4da70c21b3584c82e7da6fc
    reconcile_sha: null
    main_sha: null
  - working_sha: 4d07d095a3c3fdcf3c82fcd284b297e34932d1a6
    reconcile_sha: null
    main_sha: null
  version: 0.2.663
  story_points: 5
---

## What the operator saw

First-Draft-Test Dina's Diner 4, 2026-10-26.

1. **A link that arrived before what it links to.** The chat said *"Meanwhile, 1 question needs you:
   [answer it]."* The operator clicked it and Input opened with no question to answer. The question
   appeared several seconds later. The operator: "we should not give users links until the material
   is ready".
2. **Link words that say what to do instead of where they go.** *"I've fixed the "See the full menu"
   button on the Home page: [have a look]."* The operator wants *"…on the Home page: [Home page]."*:
   "the link tells me where it's going, it is not telling me what to do when I get there."

## Where these come from

- The "Meanwhile" line is the host's: `meanwhileLine` (`tools/generate/src/cli/ai/cadence-core.ts`),
  said as a builder session starts, linking `#show=ask&ask=<id>` ("answer it") or
  `#show=questions` ("answer them"). The ids are the plan's open asks at that moment. On click,
  `planPanel.showAsk` (`apps/control-app/src/builder/plan-panel.js`) re-reads the plan once. If the
  question still isn't drawn it returns false, and the client lands on an Input with nothing
  highlighted. Here the panel didn't show the question for several more seconds.
- "have a look" is taught and templated in several places:
  - the host's build-done cue (`host-core.ts`, "The X page is done: [have a look]");
  - the first-draft line (`plan-core.ts`, "Your first draft is ready: [have a look]");
  - `config.js` (`draft: 'Your first draft is ready: have a look'`);
  - the comps decision link ("have a look and agree it");
  - the `show_client` tool description's own example ("[have a look](…)").

  The consultant copies the style into its own messages.

## The change

1. **A link is sent only when what it opens is there.** The host doesn't put a link in front of the
   client (in its own lines, or in a link it hands the consultant) until the target exists and is
   readable by the client's panel: a question is committed and listed in the plan the panel reads,
   a page exists in the page list, a look exists. If the target isn't ready yet, the line names it
   without a link, or the line waits until it is.
2. **A link that lands early still lands.** Following a `#show=` link whose target isn't drawn yet
   doesn't give up after one re-read. The panel opens the destination, shows that the item is on
   its way, and keeps re-reading (bounded, a few seconds), then unfolds and highlights the item as
   soon as it appears. Only if it never appears does it say plainly that the item isn't there.
3. **Link words name the destination, not an action.** Every link the host writes, and every link
   the consultant is taught to write, is labelled with where it goes: the page's name ("Home page",
   "Menu page"), "the question" or "Questions", "the comparison board", "the story board", "your
   first draft". The sentence around it says what to do there. The templates and examples above
   change accordingly: "Meanwhile, 1 question needs you: [the question]." and "The Home page is
   done: [Home page]." The `show_client` description and the consultant's priming say so too, so
   its own links follow suit.

## Test plan

UATs named `test_UAT_FC_REQ-467_*`:
- the "Meanwhile" line for an ask that isn't yet in the plan the panel reads carries no link (or
  isn't sent until it is); once it's listed, the line links it as "the question";
- the builder panel, given a `#show=ask` link for a question that appears only after several plan
  re-reads, ends with that question unfolded and highlighted, not an empty Input;
- the host's build-done line, first-draft line and comps decision link use destination labels
  ("Home page", "your first draft", "the comparison board"), and no host template or tool
  description example contains "have a look";
- the consultant's priming/tool text tells it to label links by destination.

Related: [[REQ-413]], [[BUG-265]], [[REQ-459]], [[EPIC-19]].


## What landed

**1. Links point only at what is there.** Every host link was checked against what it opens:
the "Meanwhile" line's ids come from `openAsks`, which reads the same committed plan the panel's
`/api/plan` reads (`planPanel(fields).asks.open`), so an ask not yet in that plan is neither counted
nor linked. The build-done line names only pages the store holds. `set_ask` and `set_decision` hand
over their links after the plan write commits. The lag the operator saw was on the panel side, so
change 2 below is the fix for it.

**2. A link that lands early still lands.** `planPanel.showAsk` no longer gives up after one
re-read. It opens Input at once, shows "Your question is on its way…" (`PLAN_ASK_COMING`, a
`role=status` line where the question will appear, in place of "No questions yet"), and re-reads the
plan every 500ms, up to 12 times (`SHOW_WAIT_MS`/`SHOW_WAIT_TRIES`, ~6s). A draw from any other
refresh in the meantime counts too. As soon as the question is drawn it is unfolded, scrolled to and
highlighted. Only if it never appears does the chat say "That's no longer there." The same bounded
re-read (`lookAgain` in `app.js`) covers `#show=draft&page=` links (re-reading the page list) and
`#show=comp` links (re-reading the plan).

**3. Link words name the destination.** Host lines and taught examples now read:
- Meanwhile: "Meanwhile, 1 question needs you: [the question](#show=ask&ask=…)." and
  "…2 questions need you: [Questions](#show=questions)."
- Build done (`pageDoneLine` in `show-core.ts`): "The Home page is done: [Home page](…)."
- First draft: "Your first draft is ready: [your first draft](#show=draft)". The How you can help
  row reads "Your first draft is ready" (the row is itself the link).
- Comparison board (`COMPS_BOARD_LINK`, the direction card's `set_decision` link, `DIRECTION_SAY`,
  `FOCUS_SAY`, the priming example): "[the comparison board](#show=comps)".
- Story board (`STORY_BOARD_LINK`): "[the story board](#show=story)".
- `set_ask`: "[the question](…)", and "[Questions](#show=questions)" for several.
- Lines the host adds at the end of a reply: "Showing you [the story board](…)" (the link is the
  view's name, not the whole phrase), "A new question for you: [the question](…)", "New questions
  for you: [Questions](…)", "New on [the comparison board](…)", "New on [the story board](…)".
- `show_client`'s `link` without a `label` is the target's own name ("the story board", "the
  Coastal look"), no longer "Open …". Its switch `say` gives the linked name as the example.
- The `show_client` description says a link's words name where it goes, never what to do there,
  with the Home page example and "never 'have a look', 'open it' or 'answer it' as a link". The
  `label` param says the same. The consultant's priming ("showing" section, both corpus variants)
  carries one line: "Link words name the place, never the action ("have a look")." It is kept that
  short because BUG-129's priming ceiling had ~70 characters to spare.

## UATs

- `tests/test_UAT_FC_REQ-467_a_link_that_lands_early.test.ts` (real builder, jsdom). Covers: a
  `#show=ask` link whose question reaches the plan only ~1.5s after the click opens Input, shows the
  on-its-way line, and ends with the question unfolded and highlighted after several re-reads, with
  no "no longer there". A question that never appears gets "That's no longer there." after a few
  seconds, not at once.
- `tests/test_UAT_FC_REQ-467_links_name_where_they_go.test.ts`. Covers: the host's lines above,
  word for word. No link in any host template, tool description (the whole plan surface) or priming
  is labelled with an action ("have a look", "answer…", "open…", "see…", …). The `show_client`
  description and the priming teach destination labels.
- The existing UATs that pinned the old wording were updated to the new wording: BUG-263, BUG-265
  (both), REQ-379, REQ-401, REQ-413 (both), REQ-431, REQ-436 (which also now asserts the cue's
  example is "[Prices page](…)"), REQ-444, REQ-445, and BUG-230's fixture. REQ-413's
  "withdrawn question" check now waits out the bounded re-read.