---
uid: request-37e96d99
id: REQ-436
type: request
title: 'Consultant: long worker turns — a one-hour ceiling with a 10-minute warning,
  a talker beside every turn, stop builds that change nothing, announce finished pieces'
created_by: EPIC-19
created_at: '2026-10-23T16:17:52.494165+00:00'
updated_at: '2026-10-23T17:15:07.412426+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  parent_uid: epic-95bc3b15
  story_points: 8
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-8f3bab53
  commits:
  - working_sha: 1b1b34744572bbc3eb106143cada149a63064756
    reconcile_sha: null
    main_sha: null
  - working_sha: c66898789a4c05f7bb02d4d14e39bc622666d824
    reconcile_sha: null
    main_sha: null
  version: 0.2.598
---

## Why

On Ariel's site (2026-10-23) one consultant worker turn ran **52 minutes**
(`35e1c20f…`, 01:16 to 02:08 UTC), chaining builder after builder on the top of
the home page. The talker (REQ-416) answered the client throughout, so the
length itself did no harm. The operator: "With talker vs worker I think we can
be fairly generous with worker run length if talker is responsive."

What did hurt:

- **A turn with no talker beside it.** The layout-fault hold that started at
  02:08:02 had no talker, so the client's "ok" at 02:09:13 was queued with
  nobody to answer it.
- **Loops.** BUG-256's 17 minutes went on fixes that changed nothing.
- **No backstop.** Nothing ends a runaway turn. Spend is what matters, but time is
  what people understand, so the backstop is time.
- **Results arrive only at the end** of a long turn, even when pieces were
  finished long before.

## What changes

### 1. A one-hour ceiling on a worker turn, with warning

- A worker turn (the consultant's own round, including any host hold that
  continues it) may run for at most **60 minutes**. The limit is a configured
  value, not a literal in code.
- **At 50 minutes the worker is warned**, as host guidance at its next call
  boundary. For example: "About 10 minutes left in this turn. Finish what you
  are doing, start no new build, and then report to your client what is done
  and what is left." It starts no new `Delegate` after the warning; one already
  running may finish.
- **At 60 minutes the turn is ended by the host**, gracefully. A builder still
  running is stopped. The client gets a reply that says what was finished and
  what is left, so they are never left hanging. That reply comes from the worker
  if it reported after the warning. Otherwise the talker gives it, built from the
  turn's finished tasks and build reports. The unfinished work stays on the plan
  as tasks (REQ-428 `set_task`), so the next turn picks it up.
- The warning and the end are recorded on the junction, so a later investigation
  can see why the turn stopped.

### 2. A talker beside every long-running turn

- Every worker turn has a talker beside it, so a client message is always
  answered within seconds. That includes host-started turns such as the
  layout-fault, review and promise holds. BUG-256 made a message *end* a hold; with
  a talker the hold can carry on and the client is still answered. The talker's
  rounds brief the worker as they do today.

### 3. Stop builds that change nothing

- If two builds in a row inside one turn leave the pages unchanged (the same
  draft content, or the same findings at the same measurements), the worker is
  told to stop building that thing and to report it. The host does not start a
  third such build. This generalises BUG-256's layout-specific rule to any build.

### 4. Finished pieces are announced as they land

- When a build inside a long worker turn finishes and changes the site, the
  talker tells the client in one line, with a link to the page. For example: "The
  top of the home page is done, have a look." This does not wait for the turn to
  end. It is one line per finished build, and never one for a build that changed
  nothing.

## Test plan

`tests/test_UAT_FC_REQ-436_long_worker_turns.*`, using the scripted-model host
harness with a controllable clock:

- At the warning time the worker receives the warning line, and a `Delegate` it
  then calls is refused with the reason.
- At the ceiling the turn ends, a running builder is stopped, and the client's
  reply names what was finished and what is left (from the worker's report when
  it gave one, and otherwise from the talker). Unfinished work stays on the plan
  as tasks.
- A client message during a host hold gets a talker reply within the same hold,
  and the hold continues.
- Two builds in a row that change nothing make the worker stop, and no third build
  is started.
- A build that changes a page during a long turn produces one talker line with a
  link; a no-change build produces none.
- Re-run the BUG-256, REQ-416 talker and host-holds UATs.

## Root cause of "no talker beside the hold" (found during implementation)

Every host round already runs with a talker desk beside it. The 02:09 "ok" missed
it because the panel did not know a turn was running: the reattach after a reload
follows one round, so when the 02:08 hold continued the request, the panel sent the
message to `/api/ai/prompt` rather than to the talker. There it found the session
held and was queued on the junction. The fix therefore lives in the host: **a prompt
that finds the session held goes to the talker beside the work**, whichever route
the panel used.

## What landed (free-coded)

- `turn-clock.json`: `turn_ceiling_minutes: 60`, `turn_warning_minutes: 10`,
  `idle_builds: 2`. `turn-clock-core.ts`: `turnCeiling()` / `setTurnCeiling()` (the
  suites' clock control, like `setStallDeadline`) and `IDLE_BUILDS`.
- `host-core.ts`, the per-message clock (`messageClocks`): this is set at the start
  of `continuedTurn` and spans the message's rounds and holds. Each message drained
  after it (BUG-256) gets its own clock.
  - **Warning:** from `ceiling − warning`, the consultant's per-call `notice` carries
    `turn-closing` ("about N minutes left… start no new build… set_task what is not
    finished… tell your client what is done and what is left"). `Delegate` is refused
    with `turn_closing`, and a builder that ran out is not replaced. No host
    continuation or hold (layout, review, promise, budget) starts. `willContinue` is
    false, so a reply that runs out is narrated as a stop and not as "still working".
    The talker desk records the warning on the junction as the round's status
    (`TURN_CLOSING_LINE`, "Finishing this part up.") and logs `turn_closing`.
  - **Ceiling:** the talker desk logs `turn_ceiling`. If the consultant has said
    nothing to the client since the warning, the talker is cued (`turn-close-cue`)
    to put what is unfinished on the plan with `set_task` and to tell the client what
    is done and what is left. After that reply, the consultant's round and every
    running builder session (from the delegation runtime's `pending`) get a Stop with
    reason `turn_ceiling`. If the consultant did report, the Stop comes at once. The
    request ends with `done {status: complete, ceiling: true}`, a reply and not a
    Stop.
- `host-core.ts`, `answered()`: a prompt that finds the session held, on a session
  with a talker setting and an inbox, is posted to the inbox. The running round's
  talker desk answers it, and the hold carries on. `followTalked()` streams that
  talker round's words to the request as its reply, ending at its `turn_end`. It
  passes on the other talker frames and the work's status meanwhile. If no talker
  ever took the message (the work finished first, the session has been free for a
  poll, and the message is still in the inbox), the request takes it and answers it
  as a turn of its own. Without an inbox or a talker it queues on the junction as
  before (BUG-256).
- `host-core.ts`, `afterBuild()`, on every `Delegate` result (the REQ-415 look
  runs inside it where there is a camera):
  - **No-change builds:** a build that wrote no page, or whose look found findings
    and moved none (same finding within 2px, as BUG-256 defines unmoved), counts as
    idle, and a build that changed something resets the count. At `idle_builds` (2)
    the result carries `idle-builds` ("THE LAST 2 BUILDS CHANGED NOTHING… tell your
    client plainly what could not be done"). Any further `Delegate` in that message
    is refused with `idle_builds`.
  - **Announcements:** a build that changed a served page (or a shared part, shown
    on home) queues `build-done-cue` for the talker, naming each page with its
    `#show=draft&page=<id>` link. The talker desk opens it as a cued round (REQ-215)
    at its next poll, beside the work. Talker cues are now a queue per site, so the
    BUG-240 dive cue and build cues do not overwrite each other.
- `account-core.ts`: `WorkerLimits.refusal` and the `turn_closing` / `idle_builds`
  Delegate errors. `roles.ts` / `priming.json`: the four templates `turn-closing`,
  `turn-close-cue`, `build-done-cue` and `idle-builds`.

## Design decisions

- **Supersedes BUG-256's "a message during a hold ends it"** (explicit supersession).
  With a talker beside every round, the message is answered within the hold and the
  hold continues. BUG-256's UAT
  `test_UAT_FC_BUG-256_a_message_sent_during_a_hold_ends_it_and_is_answered_next_with_its_photo`
  is renamed `…_a_message_sent_during_a_hold_is_answered_with_its_photo`. It keeps
  BUG-256's own requirement (the message is answered, photo line intact, the reply
  streamed to the request that sent it) and no longer asserts that the hold ended.
  BUG-256's junction drain is unchanged for sessions without a talker.
- **The refusal after idle builds covers the rest of the message,** not only "that
  thing". The host cannot tell what a third build is for before it runs. A new
  client message resets it.
- **Announcements go out for every build that changed a page,** with no "long turn"
  threshold. The cue lets the talker pass if it has already said so, and the
  consultant is primed (BUG-240) not to repeat the talker.
- **The warning is a per-call notice, not an interposed message.** An interposition
  left undelivered at a round's end would drain as a client turn.
- **Upstream gap, worked around here.** lagrange-framework's `callerStopped` (in
  `delegation_toolbox.js`) reads the last `turn_start` as the open turn. After a
  talker round opens and closes beside the worker, it sees no open turn, so a Stop
  on the consultant's round no longer reaches its builder. That affects the client's
  own Stop building too. The ceiling stops the builder sessions by name instead.
  The upstream fix (open turn = the last `turn_start` without `fork_of`) belongs in
  a lagrange-framework ticket.

## Test plan (as landed)

`tests/test_UAT_FC_REQ-436_long_worker_turns.workers.test.ts` (real route in
workerd, scripted model, ceiling set in seconds with `setTurnCeiling`):

- `…past_the_warning_the_worker_is_told_to_finish_and_a_build_it_asks_for_is_refused`
- `…at_the_ceiling_a_running_build_is_stopped_and_the_talker_says_what_is_done_and_left`
  (the talker's `set_task` is on the plan)
- `…at_the_ceiling_a_worker_that_reported_after_the_warning_is_stopped_without_a_talker`
- `…a_message_sent_during_a_hold_is_answered_by_the_talker_and_the_hold_carries_on`
- `…two_builds_in_a_row_that_change_nothing_stop_the_building`
- `…a_build_that_changes_a_page_is_announced_by_the_talker_with_a_link_and_one_that_changes_nothing_is_not`

Re-run: the full workers project (1704 pass; the 12 failures also fail on clean
`xgd-working`) and the node suites that import the changed modules (BUG-168's
turn-clock UAT passes; the workspace-origin failures are the worktree's missing
built assets).