---
uid: bug-db247fe1
id: BUG-249
type: bug
title: 'Turns can wedge a session until the server restarts: progress deadline, self-expiring
  leases, automatic recovery, no ugly client errors'
created_by: EPIC-19
created_at: '2026-10-21T18:37:46.343167+00:00'
updated_at: '2026-10-21T19:22:56.227874+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: critical
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-962214e3
  commits:
  - working_sha: 5ad2bf9cadfecc106007e18ce2c3de3621e807d1
    reconcile_sha: null
    main_sha: null
  - working_sha: cc808aa09054bb266b2e2ef0c023c9acc7ecbffc
    reconcile_sha: null
    main_sha: null
  version: 0.2.572
---

## Incident (Ariel's AR Welding run, 2026-10-21 18:29 UTC)

`turn_cc6be6d1c46e1a31982cbad770fca1c6` opened normally (`POST /api/ai/prompt` →
200) and then produced nothing: no further events, **no error, warning or
restart in the dev log**, and its `turn_log` row has **no end time and no
outcome**. The browser's turn-health check showed the client: "That turn stopped
before it finished — the connection held, the reply did not (turn_…). It was our
failure, it has been recorded … ask again". Retries didn't help. **Restarting
the dev server fixed it** — it was not the model API (operator). So the session
was wedged by in-process state: a turn holding its lease/locks while awaiting
something that never resolved (a Durable Object call, a lock, a write-behind
drain, the talker desk…), with heartbeats still proving "alive".

> This would be catastrophic if it happened in production. (operator)

In production there is no "restart the dev server": a lease or lock held in a
Durable Object outlives the isolate, so a wedged session can stay wedged.

## Required behaviour

1. **No turn can hang forever.** Every turn has a **progress deadline**: if no
   progress event (delta, tool issue/record, progress, talker activity) arrives
   for a configured time, the host aborts it, records outcome `stalled` with what
   it was last doing, and releases everything it holds: the turn lease, REQ-397
   file locks, draft leases, the talker desk. Heartbeats alone don't count as
   progress. (If the lease heartbeat lives in lagrange-framework, file the
   framework half there: heartbeat must not keep a lease alive for a turn making
   no progress.)
2. **Leases and locks expire on their own** after their holder stops making
   progress, so a dead or wedged holder never blocks the next message.
3. **The flow picks back up.** After a stalled or failed turn, the host
   automatically resumes it (REQ-409's continuation, or LF REQ-175 resume from
   the session log), and the next client message is never blocked by the old turn.
4. **No ugly messages for clients.** In production the client sees a gentle
   "One moment — picking that back up…" while recovery runs, never turn ids or
   "it was our failure, it has been recorded". The detailed note stays in dev,
   behind a dev setting.
5. **Every turn closes in `turn_log`**, with an outcome and a cause (status code,
   stall duration, last awaited operation). A watchdog sweeps rows left open.
6. **Failures are diagnosable.** Log, per turn, the last event and the operation
   being awaited when it stalled, so the next incident names its cause.
7. **Model API resilience** (transient 5xx/overloaded, dropped connections,
   stalled streams: stall timeout + retry with backoff inside the tool loop) —
   if not already in `ClaudeAPIBackend`, file it in lagrange-framework.
8. **Operations:** an operator-visible alert when a turn stalls in production,
   and an admin "unstick this session" action as the last resort.

## Test plan
- Inject a never-resolving await inside a tool call: the turn is aborted at the
  progress deadline, `turn_log` records `stalled` with the awaited operation, the
  lease and file locks are free, and the next client message runs normally — no
  restart.
- A wedged talker desk / write-behind drain is handled the same way.
- Production client wording is the gentle line; dev shows the detailed note.
- No `turn_log` row stays open past the watchdog interval.


## Also: a talker that fails must not go silent (2026-10-21 18:43 UTC)

A second incident, different cause: the worker round was healthy, but every talker round failed at once with a 400 (empty thinking block — lagrange-framework BUG-91). The client saw the consultant stop responding.

- When a talker round fails, the host does not leave the client's message unanswered: it queues the message for the worker's next boundary / the next round (BUG-224's path), and the client sees a gentle line ("I'll pick that up as soon as this part of the build is done").
- Repeated talker failures in one worker round are logged with their cause and stop being attempted for that round.
- Test: a talker round that ends `status: error` leaves the message delivered to the next round and shows the gentle line; no message is lost.

## Diagnosis (2026-10-21, implementing session)

The mechanism that matches the incident: a turn parked forever on an await (a tool call, a DO
write) keeps its session claim alive. The claim is held because lagrange-framework's
`TurnLease` heartbeat is a bare 5 s timer. `/api/ai/session` reports `live: true`, so the
failure notice is suppressed and the panel reattaches to a tail that never ends. Every retry
loses `claimTurn` and is answered `queued` onto a queue this host never drains, so it closes
`complete` with no reply. Nothing can unblock the turn: Stop aborts only the model stream,
the tool loop sits in `await entry.settled`, and `withProgress`'s and the manager's `finally`
both wait on the hung step. A restart "fixes" it because the heartbeats stop and the claim
lapses. The framework half is filed as **lagrange-framework BUG-92 (`bug-266fbb52`)**:
progress-tied heartbeat, cancellable tool waits, a bounded `promptStream` finally, a public
`abandonTurn`, 5xx/529/stream-stall retry in `ClaudeAPIBackend`, and talker `done` carrying
its status. This ticket is the host half. No code lands in lagrange-framework from here.

## Design (host half, as implemented)

1. **Progress deadline** (`progress-core.ts` `withProgress`). It already wraps every
   consultant turn's `promptStream` and wakes on a poll while the turn is silent, and the
   settings turn is now wrapped too. Progress means any event from the turn's own stream,
   or any junction record that is not control-class. Not progress: `heartbeat`,
   `turn_claim`, `stop_request`, `enqueue`, `interpose`, `subject`, and a host-sourced
   `progress` (the delegation runtime's "still working" timer is a heartbeat as well). A
   delegated worker writes to its *own* session's junction, so the host counts progress
   across every junction its manager opens. It does this with a per-manager witness, by
   wrapping the junction store given to the manager. A delegated build that is working is
   therefore never cut, and one whose worker is wedged is.
   When nothing has progressed for `stall_seconds` (`turn-clock.json`, default 300), the
   wrapper stops waiting on the hung step without awaiting it. It reports what the turn
   was last doing (the last record kind, and the tool named by an unanswered `tool_issue`,
   or `model` while it waits on the model). It then runs the host's release and ends the
   stream with a `done` whose `status` is `stalled`.
2. **Release** (host-core `releaseStalledTurn`). It requests a stop, which aborts the model
   stream if that is what hung. It appends `turn_end {status: aborted, stalled: true}` for
   every `turn_start` of this turn (worker and talkers) that has no end; that frees the
   claim, ends the talker's claim and makes `live` false. It drops the dead fork and the
   talker count, so the next round is not assembled as a talker's. REQ-397 draft leases
   already expire on their own (idle 300 s, implicit 60 s), so nothing more is needed for
   them. `siteTurn`'s own `finally` then runs normally: pending record, spend row and
   occupancy close as `aborted`.
3. **Bounded Durable Object calls** (`junctions.ts`). Every write-behind call and the
   adopt read has a ceiling (`DO_CALL_TIMEOUT_MS`, 15 s). A hung DO call is logged and
   dropped from the chain. That repairs itself: the next adopt sees the object behind and
   re-sends the tail. A wedged drain therefore never blocks `prepare`, the next turn or the
   route's flush.
4. **The flow picks back up** (`continuedTurn`, REQ-409's continuation). A round that
   stalls is continued once per client message with a host cue (`stall-continuation-cue`,
   naming what did not return), kept off the client's transcript like the other cues. The
   client sees the status line "One moment — picking that back up…" meanwhile. A second
   stall in the same message ends the request with the stall recorded.
5. **Every turn closes in `turn_log` with a cause.** `stalled` is a new outcome for a
   request the host ended and could not carry on. Its detail is the silence and the awaited
   operation: `stalled 300s awaiting tool Delegate (last: tool_issue)`. A request the host
   *recovered* closes `complete`, with detail `recovered after stalled …`, so the stall
   stays visible without the reopened panel calling a recovered request a failure. An
   errored done carries its scrubbed error text as detail. A **watchdog** on the existing
   10-minute cron (`sweepOpenTurns`, every tick) closes rows open past `TURN_LOST_AFTER_MS`
   as outcome `lost`, detail `watchdog: no close recorded within 15 min`. The operator
   console's turn health shows a `Stalled` count, and `/api/ai/session`'s `failed` reports
   `stalled` the way it reports `error`.
6. **Diagnosable**: the stall is logged at the moment it happens. It is a JSON
   `turn_stalled` line on `console.error` with session, turn, silence, awaited op and last
   record, which is the operator-visible alert in the Workers log.
7. **No ugly client messages.** A `TURN_DIAGNOSTICS` var is `"1"` in local `[vars]` and
   `[env.dev.vars]`, and is restated as `""` in `[env.production.vars]` (named environments
   must repeat every top-level var). Unless it is `"1"`, `/api/ai/session`'s `failed`
   carries no turn id and no detail, and the panel shows a gentle line ("That reply was cut
   short — sorry. Ask again and I'll pick it up."). The interrupted-turn notes fall back to
   their existing wording, which has no turn id. With it on, the detailed note stays, and a
   `stalled` turn names its cause. If a request stalls twice, the client reads "Sorry —
   that didn't go through. Ask me again and I'll pick it up from here."
8. **Unstick, the last resort**: `POST /api/ai/unstick {sessionId}`, in the
   conversation's own scope and open to whoever may drive it (the same people who can
   already press Stop). It runs the same release over every open turn and claim in the
   session's junction (`unstickSession`), logs `session_unstuck`, and flushes. It frees what
   the serving isolate's junction mirror can see; a turn wedged in another isolate is freed
   there by its own deadline.
9. **A talker that fails does not go silent.** When a talker round's `turn_end` says
   `error`, the host logs it with its cause and puts the client's message back in the
   inbox. It stops opening talkers for the rest of that worker round, and from then on
   delivers waiting messages at the worker's tool boundaries (BUG-224's path), or the panel
   runs them as the next prompt. The client sees "I'll pick that up as soon as this part of
   the build is done." as the status line (a model-sourced `progress` record).
10. **The desk itself is bounded.** `withProgress` awaits the talker desk's tick for no
   longer than the deadline, and never starts a second tick while one is still running, so
   a desk that hangs cannot hide a stall.

## Known limits (left to lagrange-framework BUG-92)

- The wedged step's own lease heartbeat timer keeps appending `heartbeat` records, which
  nobody honours, for the life of the isolate. Only a framework `abandonTurn` can stop it.
- Before the deadline fires, a prompt sent into the wedged session is still answered
  `queued` by the framework (no reply). After the deadline the session is free.
- A tool still hung inside the framework's tool loop is abandoned, not cancelled. It settles
  into nothing whenever it settles.

## Test plan (as implemented)

- `tests/test_UAT_FC_BUG-249_a_wedged_turn_frees_the_session.workers.test.ts`. A D1 double
  is the only double: its `site_pages` read never answers while armed by the model's
  `list_pages` call, under a 1.5 s deadline.
  - `…a_tool_that_never_returns_is_ended_and_the_work_carried_on`: the stream ends. The
    client reads the "One moment — picking that back up…" status and then the recovered
    reply, with no turn id. The recovery round is cued with `tool list_pages`. `turn_log`
    closes `complete` with `recovered after stalled … awaiting tool list_pages`. The next
    message is answered normally (not `queued`).
  - `…a_turn_that_stalls_twice_is_recorded_stalled_and_frees_the_session`: the ledger
    reads `stalled 2s awaiting tool list_pages (last: tool_issue)` and the client is told
    gently. On reopen `live` is false and `failed` is `stalled` with no turn and no detail;
    with `TURN_DIAGNOSTICS=1` both are present. The next message completes, with no restart.
  - `…the_watchdog_closes_a_row_nobody_closed`: the 10-minute cron closes a 20-minute-old
    open row `lost` and leaves a fresh one alone.
  - `…a_junction_write_that_never_lands_does_not_wedge_the_session`: a DO `append` that
    never answers does not block `flush` or `prepare`, and later writes still land.
- `tests/test_UAT_FC_BUG-249_a_failed_talker_does_not_go_silent.workers.test.ts`: every
  talker request fails (400). The client's mid-build message goes back to the inbox and is
  delivered to the worker's next call. The status line reads the deferred line, the inbox
  ends empty, and the talker is not retried for the round.
- `tests/test_UAT_FC_BUG-249_the_panel_says_it_gently.test.ts` (jsdom, installed
  webui-chat): without a turn id, `lost`/`error`/`stalled` read "cut short", never "our
  failure", "recorded" or a turn id. With diagnostics, a stalled turn names its cause.
- `tests/test_UAT_FC_REQ-306_a_killed_turn_leaves_a_record.workers.test.ts` now runs with
  `TURN_DIAGNOSTICS: '1'`, because it asserts the dev-only turn id.
- Regression run: the related workers suites (BUG-121/149/166/224/232/235/240/245/46,
  REQ-231/235/306/307/320/360/403/415/416) and node suites (priming, turn clock,
  continuation, panel, wrangler parity) pass. Some failures were checked against clean
  xgd-working and fail there identically: REQ-416 `priming_carries_the_method…`, REQ-185
  `break_glass_var_ships_empty`, REQ-180's two vocabulary checks, and AC1333's hook
  ordering. The webui/served-tree failures are worktree-location artifacts.