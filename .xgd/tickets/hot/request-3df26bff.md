---
uid: request-3df26bff
id: REQ-445
type: request
title: First draft hand-over explains how we'll work through changes, and stages follow
  their logical order (no Refining while First draft is open)
created_by: EPIC-19
created_at: '2026-10-24T19:18:01.698246+00:00'
updated_at: '2026-10-24T20:08:09.418231+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 5
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-add45430
  commits:
  - working_sha: d37a2ca944f1983f6c7dbd8c87dfa8d4108bc014
    reconcile_sha: null
    main_sha: null
  - working_sha: af1e5920e5b385fa197fe9465ccbfeb8fcb59598
    reconcile_sha: null
    main_sha: null
  version: 0.2.618
---

## Why

Follow-up to **BUG-269** and **REQ-444** (both at `ready_to_reconcile`, landed
2026-10-24 morning, not yet on the dev snapshot used for Dina's Diner).

Together those make the first draft self-ticking (`draft_reviewed`), refuse
Refining before it (`DRAFT_NOT_SEEN`), put "show the draft" first on the agenda,
switch the preview to View, and lead the announcement with the link. The
operator asked for two more things:

1. **The invitation to look at the first draft comes with context**: "this should
   be done with context explaining how we can/will work through changes." A link
   and "what do you think?" is not enough. The client needs to know what a first
   draft is for and how changes will be handled.
2. **The stages are ordered where the logic requires it**: "It is logically
   impossible to have First draft unfinished AND be working on Refining." BUG-269
   blocks only `set_stage refining` while the draft is unreviewed. The priming
   still says "Any order is fine" (`priming.json` ~507, ~1268), nothing stops
   other impossible combinations, and plans already in that state (Dina's:
   First draft and Refining both `in_progress`) stay that way.

## What changes

### 1. The first-draft hand-over explains how we work through changes

When the first draft is shown, the consultant's hand-over message says, briefly
and in the client's terms:
- **What this is:** a first real version to react to. The words come from what
  they have told us. Anything not yet decided (for example colours and fonts
  before "Colours & fonts") is a placeholder, and it says which.
- **How to give feedback:** anything goes. They can say it in the chat, point at
  the part they mean (the preview's mark-a-point tool, where available), or
  just say what feels wrong. They do not need to know how to fix it.
- **What happens next:** the consultant gathers their changes, makes them in
  rounds, and shows each round. Bigger questions (look, structure) are settled
  before small ones. Nothing is final until they say so.
- **One clear ask:** have a look (link first, as REQ-444 requires) and say what
  works and what does not.

This is part of the steering the host gives when the draft lands (BUG-269's Due
line and the first-pass `say`), worded once in `priming.json` within the budget,
not improvised each time. It is said once per site, at the first draft. Later
rounds get a one-line reminder at most.

### 2. Stages follow their logical order

- **Prerequisites are declared on each stage** in `plan-seed.json` (data, like
  REQ-432's `done_when`). For example `refining` requires `first_draft` done, and
  `ready_to_publish` requires every earlier stage done or deliberately skipped.
  The child session settles the full set with the operator. Where order genuinely
  does not matter (for example "Looking at other sites" alongside "Getting to know
  you") no prerequisite is declared.
- **The host enforces it on every plan write.** A stage cannot become
  `in_progress` or `done` while a prerequisite is not done: `set_stage` is refused
  with a reason naming the prerequisite. If a prerequisite **reopens** (REQ-432),
  a later stage that depends on it goes back to `not_started` (or is held), and
  the consultant is told why.
- **Existing plans are repaired:** a stored plan where a stage is in progress or
  done ahead of an unmet prerequisite is normalised on load. Dina's Refining
  returns to not started until First draft is done.
- The priming's "Any order is fine" is replaced by the declared order.

## Test plan

`tests/test_UAT_FC_REQ-445_first_draft_handover_and_stage_order.*`:

- When the first draft lands, the host's steering for the hand-over carries the
  three parts (what it is, how to give feedback, what happens next) and the link
  first. A scripted reply following it contains them.
- `set_stage refining in_progress` while First draft is not done is refused,
  naming the prerequisite. After First draft ticks, it is accepted.
- Reopening First draft (REQ-432) returns a dependent Refining to not started,
  and the consultant's next turn is told.
- A stored plan with Refining in progress and First draft open loads with
  Refining not started.
- `ready_to_publish` cannot be set while an earlier stage is open and not skipped.
- Re-run the BUG-269, REQ-432 and REQ-390 stage UATs.
## Added 2026-10-24: the hand-over directs the review, copy first

The operator: "When the consultant tells me to look at the first draft it should
direct me to specific things to look at, and copy/text should be something we want
to get mostly right at this point." No new step or checkbox. The first draft
itself is where the copy is reviewed.

- **The hand-over names three to five specific things to look at**, each with a
  link to where it is on the page (a section anchor or `#show=draft&page=…`), and
  **copy comes first**. For example:
  1. "Read how we tell your story ('How Dina came to own Hal's'): is that how
     you'd say it?"
  2. "Check the facts that must be exact: prices, hours, address, phone."
  3. "Does the headline still feel right now that it's in place?"
  4. One or two things the consultant itself is unsure about.
- **It says what is deliberately not finished yet** (for example colours and
  fonts before "Colours & fonts"), so the client does not spend feedback on it.
- The consultant chooses the items from what it wrote and what it is least sure
  of. They are never generic, so the list differs per site. The steering asks for
  specific items with locations. It does not supply a fixed checklist.
- The client's replies on these items count toward "First draft reviewed"
  (BUG-269).

Added tests:
- The first-draft hand-over steering requires three to five specific items with
  locations, copy first, and a "not finished yet" line. A scripted reply following
  it has those parts, and each item's link resolves to a section of the draft.

## As built (2026-10-24, free-coded)

### Stage order
- `plan-seed.json` stages carry `requires`: **Refining** and **Colours & fonts** require
  First draft; **Finishing touches** requires Refining and Colours & fonts; **Ready to
  publish** requires Finishing touches and `earlier` (every earlier stage done or passed
  over — not started — none left in progress). Getting to know you, Looking at other
  sites and First draft require nothing (build-sooner keeps them concurrent).
- `set_stage` refuses a stage marked in progress or done while it waits, naming what it
  waits on ("… can't be started while "First draft" is not done" / "… while "Getting to
  know you" is still in progress"). The code is `DRAFT_NOT_SEEN` when the wait is a built
  but unreviewed first draft (BUG-269's code and reason, now via the generic guard, which
  replaces BUG-269's Refining-only check), otherwise the new `STAGE_ORDER`. Stages are
  settled before judging, so a First draft whose finish line is met counts as done.
- On every plan write (`settleStages`) a stage ahead of what it requires goes back to not
  started, stamped `held`; the consultant's next turn is told: "Refining" is back to not
  started, because "First draft" is not done. Tell your client in one line why; start it
  again once that is done. A self-ticking stage is never ticked ahead of what it requires.
- Stored plans are repaired on read (`stagesFor`, which the control app's `toPlan` uses):
  Dina's Refining reads as not started while First draft is open. The read repair is
  silent (no stamp).
- "Any order is fine" is replaced in `priming.json` (both variants: "Some wait on earlier
  ones; any can reopen."), the plan surface overview and the `set_stage` description, and
  `STAGE_ORDER` is declared on the surface. Priming stays inside BUG-129's ceiling.

### First-draft hand-over
- The wording lives in the host's first-draft agenda line (`FIRST_DRAFT_LEAD`, REQ-444),
  shown while the first pass's checks are due — once per site, when the draft lands —
  not in `priming.json`: BUG-129's priming budget is at its cap, and this is the
  "steering the host gives when the draft lands". Order: the REQ-444 link line first;
  what it is; three to five specific things to look at, copy first, each with a
  show_client link to its page (examples: their story, exact facts, the headline, what
  the consultant is least sure of — chosen from what it wrote, never a generic list);
  what is not finished yet (e.g. colours and fonts until "Colours & fonts"); how to give
  feedback (anything goes); what happens next (rounds, big before small, nothing final
  until they say so).
- Links are page-level (`#show=draft&page=…`); section anchors are not built (the
  builder's show link opens pages only). The test's "resolves to a section of the draft"
  is checked as "resolves to a page of the draft".

### Tests
- `tests/test_UAT_FC_REQ-445_first_draft_handover_and_stage_order.test.ts` (6 UATs).
- Superseded "any order" fixtures updated (explicit supersession of REQ-390's "any
  order"): REQ-390 (behind-the-build now touches First draft), REQ-432 (Colours & fonts
  ticked after a reviewed draft); BUG-230, BUG-235, REQ-415, REQ-427 publishing-gate
  tests now bring the plan up to the stage first via `tests/support/plan-stages.ts`
  (`planUpTo`).
- Red on clean xgd-working before and after (not this ticket): REQ-427 first-draft
  hand-back, REQ-416 priming, REQ-398 hover, BUG-245 priming.