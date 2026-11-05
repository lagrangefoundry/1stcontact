---
uid: bug-f5e73b09
id: BUG-348
type: bug
title: 'Builder panel: a turn the consultant starts itself shows no status; the panel
  says nothing is happening'
created_by: EPIC-19
created_at: '2026-11-04T22:38:39.217893+00:00'
updated_at: '2026-11-05T00:15:18.764169+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-3a045c40
  commits:
  - working_sha: ccfcd121c69e802ffecea8db4c64b372468c7b65
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: 0b9b4d7390fb7e92d007b3daaf35fdd798b057c8
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  version: 0.2.768
  story_points: 5
---

## Symptom

Dev, 2026-11-04. A builder pass ended at 22:11:12 and, as REQ-627 now does, the host started the consultant's next round itself (`turn_start` "[The result of your Delegate call …]"). That round ran AnimateImage for 6.5 minutes (22:11:28–22:18:07), writing the progress line "The consultant is making a video clip — 2 of 3 done, a few minutes left" every ~30 s, then filed two tickets.

Throughout, the operator's open builder panel showed **"Nothing being built right now"** (`WORKERS_IDLE`), with no status, no progress line and no sign of a running turn. The consultant's last chat message said it was working on another video, so the client sees a promise and an idle panel. The panel made no requests for the site after 22:07:46, which suggests it wasn't following the new turn at all.

## Likely cause (to confirm)

The panel shows a turn's status (BUG-244's status widget in the plan panel's status slot, fed by chat's `progress` events) only for a turn it is following, and it starts following when it sends the prompt itself. A turn the **host** starts — after a builder pass (REQ-627), or any other host-started round (finished-cue turns, review continuations) — is never picked up by a panel that's already open. A reload probably shows it, since session load rejoins the running turn.

## Fix

- An open panel **notices a turn that starts without it** (whoever started it) and follows it exactly as if the client had sent the message: status widget, progress line, streamed reply and Stop. Within a few seconds of `turn_start`, with no reload.
- While any turn is running for the site, the status slot never shows `WORKERS_IDLE`. The idle line means only that nothing at all is running: no consultant turn, no builder pass and no long tool.
- A long tool on the consultant's side (AnimateImage, captures) shows its progress line like a builder pass does.

## Test plan

`test_UAT_FC_<ID>_*` (builder chat/plan panel, jsdom or Chromium with the scripted host):
- With the panel open and idle, the host starts a round itself (builder-result continuation). The panel shows the running status and the round's progress line without a reload, then the reply.
- While that round runs a slow consultant tool, `WORKERS_IDLE` is hidden. It shows again only once the round ends.
- Stop pressed during a host-started round stops it.

## Confirmed cause (dev junction, 2026-11-04)

The panel only ever finds a running turn at two moments: when it mounts (`openSession` says `live`) and when its own stream stops without an ending (BUG-123's chase). Once a stream ends normally, nothing tells an open panel that the next turn started. So any turn the panel didn't start itself goes unseen until a reload: a host-started round, another tab's message, or a job that carries on after its stream ended.

In the incident, the junction shows job `turn_2ae5390c…` given a `job_end` with status `lost` at 22:04:25 (`stop_request` reason `lost`). Its runner then carried on with step 6 at 22:04:25.9 and kept running rounds through the 22:11:12 Delegate-result round and the 6.5-minute AnimateImage, until a second `lost` `job_end` at 22:18:51. The panel's stream ended at the first `job_end`, and from then on it was idle by its own account. That premature ending is BUG-343's area (only the runner declares a job's ending). BUG-343's fix landed at 12:27 PST, before this incident at 14:04 PST, so it may still be leaking, but that is not this ticket's scope. This ticket makes the panel robust to any turn it didn't start.

## Design

- **Origin: `POST /api/ai/await-turn {sessionId, cursor}`.** A long poll that answers `{started, cursor}`. It reads the conversation's junction from `cursor` (only new bytes; the junction's `since` is incremental) every ~1.5 s, for up to ~45 s. It answers `started: true` with the offset just before the first `turn_start` or job start it finds. Otherwise it answers `started: false` with the offset it reached, so the next call continues with no gap. With `cursor: null` ("from now") it first checks whether a job is already running, which closes the gap between a stream ending and the next wait. The window and poll interval are origin deps, so a test can shorten them.
- **Panel (`chat.js`).** While the conversation is idle (no turn streaming or followed), the pane keeps one wait open on the conversation's connection slot. That slot is free while idle, so a tab's standing connection cost is unchanged (BUG-295). When the wait answers `started`, the pane rejoins from that offset through the same `streamReattach` → `resume` path a reload uses. The status widget mounts in the plan panel's status slot with its progress line, the reply streams, and Stop works as for a turn the client sent. The wait is re-armed after every turn the pane follows, and dropped when the conversation changes or the pane is destroyed. A refusal or network error backs off and retries.
- **`WORKERS_IDLE`.** No separate change. The idle line already hides whenever the status slot holds a visible status widget, and the widget is now mounted for every running turn, including a consultant tool's progress line (AnimateImage, captures).

## What landed

- `tools/generate/src/cli/ai/host-core.ts` — `awaitSessionTurn(sessionId, cursor, deps, {waitMs, pollMs})`, with `AWAIT_TURN_MS` = 45 s and `AWAIT_TURN_POLL_MS` = 1.5 s. It reads the junction only past `cursor`. `cursor: null` does one whole read, answering a running job at its `from`, then continues from the log's end.
- `apps/control-app/src/router.ts` — `POST /api/ai/await-turn`. It answers 400 for a cursor that is neither a non-negative integer nor null, 404 for a conversation this business doesn't hold, and otherwise `200 {started, cursor}`. Router dep: `awaitTurn: {waitMs, pollMs}`.
- `apps/control-app/src/builder/api.js` — `awaitChatTurn`, which throws on a non-OK answer.
- `apps/control-app/src/builder/chat.js` — `awaitUnseenTurns`, started by `paint` one tick after it finishes. It waits from the transcript's cursor, or from now when the paint is rejoining a live turn. While the panel is busy it checks back every 500 ms, then waits from now. A failed wait backs off 2 s, 5 s, 15 s, then 30 s repeating. An answer that arrives while the client has started their own turn is ignored. A started turn is rejoined through `streamReattach(answer.cursor)` → `resume`, with BUG-294's stopped notice if the origin says it died. `destroy` and any repaint end the loop. A transport without `awaitTurn` or `streamReattach` runs no loop.
- `apps/control-app/src/builder/app.js` — an injected `chatTransport.awaitTurn` is forwarded to the pane.

Not covered: a message sent from another tab is followed (status, reply, Stop), but its user bubble is not drawn until the next reload, because the junction's `turn_start` is not projected into the rejoined stream.

## UATs

- `tests/test_UAT_FC_BUG-348_panel_follows_a_turn_it_did_not_start.test.ts` (jsdom, real chat panel and real plan-panel status slot, origin scripted at the transport):
  - `host_started_round_shows_status_progress_and_reply_without_reload`
  - `idle_line_hidden_through_a_slow_consultant_tool_until_the_round_ends`
  - `stop_during_a_host_started_round_stops_it`
- `tests/test_UAT_FC_BUG-348_await_turn_route.workers.test.ts` (real router, in-process runner, junction DO, D1, R2; scripted model):
  - `await_turn_answers_a_turn_started_elsewhere_and_where_to_rejoin_it` — no turn: `started: false` and the offset reached; a message sent by another client: `started: true`, and reattaching from that cursor carries its reply
  - `await_turn_from_now_answers_a_job_already_running`
  - `await_turn_refuses_a_bad_cursor_and_an_unknown_conversation`