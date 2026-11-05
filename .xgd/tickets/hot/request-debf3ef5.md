---
uid: request-debf3ef5
id: REQ-434
type: request
title: 'Story board: settled once position and headline are agreed — no new notes
  or reaction rounds in Refining, client material goes onto the page, reopened only
  on purpose'
created_by: EPIC-19
created_at: '2026-10-23T01:58:12.283546+00:00'
updated_at: '2026-10-23T16:22:33.394199+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 3
  blocked_by:
  - request-63c7d191
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-c8707ef8
  commits:
  - working_sha: 2a06bd2c8fc4cf14b705dbfdcfcb3a97c31888f9
    reconcile_sha: null
    main_sha: null
  - working_sha: 75a7bc0a5ff51f666c858fef71b66e4ec61d5641
    reconcile_sha: null
    main_sha: null
  - working_sha: a263ee095f736e0088cd473ed3d93d97f4ddab14
    reconcile_sha: null
    main_sha: null
  version: 0.2.594
---

## Why

Observed on Ariel's Arc Welding, 2026-10-23, during **Refining**. The position was
confirmed and the headline chosen, so "Getting to know you" was done. Then:

- **01:46.** The client wrote, for the classes page, the kid on the fence and
  "making it stronger than it was". The consultant pinned three of those lines as
  story notes. The first `pin_notes` was refused by the six-theme limit, so it
  filed them under existing themes instead.
- **01:52.** The client said "Sure" to the plan for the top of the home page. The
  consultant recorded that as a `todo` task and then called `start_focus story`
  on six new notes (n28 to n33). That switched the client to the story board:
  "Heart the ones that are most you". The client's "yes, do that" was answered
  with "go and react to these instead".

The operator: "We got the headline, we are not proposing to change it, so do more
stories really make sense? Content on the site does not have to come from the
storyboard."

The story board is a **discovery** tool. It gathers the client's story so the
consultant can reach their **position** and their **headline**. Once both are
settled, its job is done. Material the client gives afterwards is site content,
and it is already in the client's own words, so asking them to heart it adds
nothing. REQ-432 makes this worse: `settleStages` reopens "Getting to know you"
whenever a new unreacted note appears (`notes_reacted` stops holding), so every
note pinned in Refining pulls the client back into discovery.

Follow-on to **REQ-432** (implemented, `ready_to_reconcile`), and related to
REQ-428 (the unreacted-notes cap on `pin_notes`) and REQ-424 (story rounds).

## What changes

### 1. Once discovery is done, the board takes no new notes

- While "Getting to know you" is done, `pin_notes` is refused with a reason that
  says what to do instead. For example: "The story board is settled: the
  position and headline are agreed. Use what the client tells you as content on
  the page it belongs to." Nothing is written.
- `start_focus` of kind `story` is refused for the same reason. The REQ-428
  unreacted-notes pressure (the `pin_notes` cap, its "start the reaction task"
  guidance, and any Due or agenda line about unreacted notes) does not apply
  while the stage is done.
- The board stays visible as a record: its notes, position and headline. The
  client can still react, edit or delete, and nothing asks them to.

### 2. What the client says becomes content

- The consultant's instructions say that once the story is settled, what the
  client tells it about themselves goes onto the site, on the page and section it
  belongs to, in the client's own words. The client reviews it there, in the
  draft. It is not pinned and the client is not asked to react to it.
- Wording stays within the priming budget. The story board passage and the
  REQ-424/428 reaction-task lines are scoped to discovery.

### 3. The board reopens only on purpose

- A done "Getting to know you" no longer reopens just because a note appears or
  a fact stops holding as a side effect. Of REQ-432's reopen triggers for this
  stage (new notes, a new headline offer, the card redrawn), the host no longer
  reopens it on its own.
- The consultant can reopen it deliberately when something the client says would
  change their **position or headline**. For example, if the client decides the
  art is the business and the trade is the sideline. That is an explicit action
  (for example `set_stage getting_to_know_you in_progress` with a reason, or a
  dedicated reopen call) that is told to the client in one line ("this changes how
  you'd describe the shop, so I've reopened the story board"). After that, notes
  and story rounds work as before, until the stage settles again.
- Other self-ticking stages ("Looking at other sites") keep REQ-432's reopen
  rules unless the ticket session finds the same loop there.

### 4. A yes is acted on

- When the client agrees to a proposal ("Sure", "yes", "do that"), the reply
  starts the agreed work (or says it is queued behind the build already running).
  It does not switch them to a different task. A story round or a comparison round
  is never started as the answer to a client's agreement. This is a priming rule:
  the 01:52 turn recorded the work as `todo` and then switched to the story board.

## Test plan

`tests/test_UAT_FC_REQ-434_story_board_settles.*`, using plan-core through the real
write paths, plus the scripted-model host harness:

- With "Getting to know you" done, `pin_notes` is refused with the "story is
  settled" reason and the plan is unchanged, and `start_focus story` is refused
  the same way.
- With the stage done, no reminder, agenda or Due line about unreacted notes is
  sent.
- With the stage done, a plan write that would have made `notes_reacted` false
  does not reopen the stage. A deliberate reopen does, it is stamped with its
  reason, and pinning then works again.
- "Looking at other sites" still reopens when a site is added (REQ-432 unchanged).
- A scripted consultant turn replying to "Sure" makes no `start_focus` call (assert
  on the tool calls of that turn, not the transcript).
- Re-run the REQ-432, REQ-428 and REQ-424 UATs. Where an existing REQ-432 UAT pins
  "new notes reopen Getting to know you", replace it in line with section 3; this
  ticket supersedes that rule for this stage.