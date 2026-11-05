---
uid: request-98eeaa02
id: REQ-433
type: request
title: 'Builder input: one Input board — Questions, Stories and Comparison sites as
  collapsible sections under one ''Your input'' summary'
created_by: EPIC-19
created_at: '2026-10-23T01:28:29.001007+00:00'
updated_at: '2026-10-23T16:08:36.552503+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 5
  blocked_by:
  - request-c5d93e94
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-db339964
  commits:
  - working_sha: 5dffa5d5e2e8d7eb76342065ab4ad569f363aac3
    reconcile_sha: null
    main_sha: null
  - working_sha: 5bdf325a3b66fcf2dd94cf42fb12ce0e04682b1b
    reconcile_sha: null
    main_sha: null
  version: 0.2.592
---

## Why

Even after REQ-431, what the client is asked for lives in two preview modes:
**Input** (questions and the story board) and **Comparisons** (the comparison
sites). The operator: "instead of a separate Questions Panel and Comparison Board,
one Input board. That's really clean: all the user input is in one modal view."
Here "modal" means one preview mode beside the chat, as Input is today. It is not
a pop-up.

**Builds on REQ-431** (merged into xgd-working): its Input mode, "How you can
help", the removal of the Now banners, and inline show links.

## What changes

### 1. One Input board with three sections

- The preview's modes become **View, Edit, Input, Looks**. Comparisons is no
  longer a separate mode: its board moves into Input as the third section.
- At the top of Input is a **"Your input"** summary, one line per section, each a
  link that scrolls down to its section and expands it:
  - Questions for you to answer
  - Story board for your reaction
  - Comparison sites for your feedback
- Below the summary, three **collapsible sections**, in this order, each with its
  state in its header:
  - **Questions**, for example "Questions (2 unanswered)" or "Questions
    (Complete)".
  - **Stories**: the headline, then "Your position", then the notes (REQ-431
    order), for example "Stories (5 to react to)" or "Stories (Complete)".
  - **Comparison sites**, for example "Comparison sites (3 to comment on)" or
    "Comparison sites (Complete)".
- **Every section is always there**, even before it has content. An empty section
  says so in its body: "No questions yet", "No story notes yet", "No comparison
  sites yet". It does not disappear. A comparison board the consultant has not
  raised shows as empty, not hidden.
- What counts as Complete is the same as the counts behind "How you can help"
  (REQ-431 section 8c): no open questions; every note reacted to or deleted, a
  chosen headline and a confirmed position card; every site commented on or
  skipped. An empty section is never Complete.

### 2. Expand and collapse

- **When Input is opened, complete sections start collapsed** and the others
  start expanded. This is decided only when Input is opened.
- **A section never collapses while the client is in it.** Finishing the last
  item leaves it open, with its header now reading Complete, until the next time
  Input is opened.
- The client can expand or collapse any section by its header at any time. The
  header is a button with `aria-expanded`.

### 3. Every link leads to the same place

- The "Your input" summary, the always-visible **"How you can help"** in the
  progress area (REQ-431 section 8c), and the consultant's links all use **one
  list of lines with one set of counts**. They are the same list, drawn in two
  places, and can never disagree. The progress-area copy is always visible; the
  summary copy sits at the top of Input.
- Every link to client input opens **Input**, **expands** the target section even
  if it is Complete (so "change your answer" works), and **scrolls** to it. Where
  the link names one item, it scrolls to that item: `#show=ask` to a question,
  `#show=story` to the board, `#show=comps` to the comparison sites,
  `#show=comp` to one site's tile.
- Anything that opened the Comparisons mode now opens Input at the comparison
  section, including `start_focus`/`show_client` switches to comps and REQ-419's
  `comparisons.raised()` offering. A client's remembered `comparisons` mode
  restores as Input.

### 4. What the consultant is told

- BUG-246's pane report gives the new set of modes. Every priming and
  tool-description line that names Comparisons as a separate mode or view (and
  the "View, Edit, Input, Comparisons or Looks" lists left by REQ-431) is updated
  to say that the comparison sites are a section of Input. Wording stays within
  the priming budget.

## Test plan

`tests/test_UAT_FC_REQ-433_one_input_board.*`, using jsdom on the builder:

- The modes offered are View, Edit, Input and Looks; there is no Comparisons mode.
- Input shows the "Your input" summary and then three sections, in order, each
  header carrying its state.
- With no questions, no notes and no comps raised, all three sections are present
  with their "No … yet" lines, and none reads Complete.
- Opening Input with one section complete starts that section collapsed and the
  others expanded. Completing the last item in an open section leaves it open, and
  reopening Input collapses it.
- `#show=ask`, `#show=story`, `#show=comps` and `#show=comp` each open Input,
  expand the right section (including a complete one) and scroll to the item.
- The summary lines and "How you can help" render from the same data, and acting
  on an item updates both at once.
- A stored `comparisons` mode restores as Input; a comps switch from the
  consultant opens Input at the comparison sites.
- Priming names no separate Comparisons mode (update the REQ-419/BUG-246 priming
  UATs that assert it).

## As built

- **`input-board.js`** (new) draws Input: the "Your input" summary, then the three
  sections. The plan panel (questions), the story board and the comparison board go
  into the section bodies unchanged. Comparisons is no longer a registered mode, and
  `CLIENT_PANES`/`PANE_LABELS` are `view, edit, input, looks`.
- **The summary is How you can help, drawn a second time.** `createHelp` takes a
  `heading`, and Input's copy is headed "Your input". Its lines are How you can
  help's own counted lines ("2 questions for you to answer", "5 notes for you to
  react to", "3 sites to comment on", "Choose a headline", "Confirm your position
  card"), not three fixed per-section lines, so the two copies are one list by
  construction. Each `HELP_KINDS` entry names its `section`; a header's count is
  the sum of its kinds. So "Stories (N to react to)" counts unreacted notes plus an
  offered headline plus a written position card.
- **Header states:** "(N unanswered)" / "(N to react to)" / "(N to comment on)"
  while anything is owed, "(Complete)" when complete, and the bare title otherwise
  (empty, or waiting on the consultant). Complete means: questions, at least one ask
  and none open; stories, at least one note, every note reacted to, the headline
  `chosen` and the card `confirmed` or `fallback`; comparison sites, at least one
  comp and every card sent or skipped. An empty section is never Complete.
- **Empty bodies** reuse each surface's own empty line, reworded to lead with the
  fact: "No questions yet", "No story notes yet. As we talk, …", "No comparison
  sites yet. Add one you know below, …". The comparison board's own "Sites we're
  comparing" heading is dropped, because the section header names it. A board
  that was never raised shows its empty line and its add form.
- **Collapse is decided on opening Input** (the panel's `mode` event). If Input is
  open before the site's plan has been read (a restored mode, or a site switch while
  in Input), the decision waits for the first read view. Nothing else collapses a
  section, and the header (`aria-expanded`, `aria-controls`) toggles it.
- **One route in:** `openInput(target, item)` in `app.js` opens Input, expands the
  target's section and scrolls. It serves How you can help, the summary,
  `#show=ask|story|comps|comp`, the "Looking at other sites" stage link, and
  start_focus/show_client switches. `#show=comps` no longer needs the comps to be
  raised, since the section is always there. A stored `comparisons` (or `story`)
  mode is rewritten to Input on mount.
- **What the consultant is told:** the pane report sends `pane: 'input'` and no
  longer a `comps` count; `readClientView` and the digest drop `comps` and the
  `comparisons` pane. In the priming, "View, Edit, Input or Looks", and the comp
  board is raised "as a section of Input". The show_client, ask_comps, add_comp and
  comp-notes descriptions say the same. The wording is net-shorter: the BUG-129
  ceiling count went 200,604 → 200,450. The suite was already over 200,000 on clean
  xgd-working before this change.

## Tests (as built)

`tests/test_UAT_FC_REQ-433_one_input_board.test.ts` (9 UATs): the modes; summary
then three sections with header states and a header that folds; every section
present when empty with its "No … yet" line and none Complete; complete sections
start collapsed, a section finished in place stays open and collapses on reopening;
a restored Input decides from the first read view; `#show=ask|story|comps|comp`
each open Input, expand a complete section and scroll to the item; the summary and
How you can help are the same lines and move together; a stored `comparisons` mode
restores as Input; the priming names no Comparisons mode.

Superseded assertions updated in REQ-419 (the board is a section of Input, raised
or not), REQ-403, REQ-413, REQ-417 (empty-line wording), REQ-431, BUG-245 and BUG-246
(pane report and digest).