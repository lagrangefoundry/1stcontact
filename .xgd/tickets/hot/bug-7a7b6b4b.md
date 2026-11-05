---
uid: bug-7a7b6b4b
id: BUG-312
type: bug
title: 'Lost turns: carry on automatically once, and record why the Worker died'
created_by: EPIC-19
created_at: '2026-10-28T21:43:36.248938+00:00'
updated_at: '2026-10-29T15:46:41.308857+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  severity: high
  priority: high
  parent_uid: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-931c759b
  commits:
  - working_sha: 37c1e65f3f0ace20c1cbb2a030bf9bc33d3782d1
    reconcile_sha: null
    main_sha: null
  - working_sha: e2a60788a9dc68ba3d66f01ea2d95c1ef99d3737
    reconcile_sha: null
    main_sha: null
  version: 0.2.698
  story_points: 5
---

## Symptom

On production, 2026-10-28, the operator was on the 1st Contact site (`biz_51a6746495c8057e886ff98d4208e6b9`). Turn `turn_c0dee7acc77c135e6c7e03f61df4ea86` started at 21:20:28Z, writing the design, the page plan and a builder pass. Its last heartbeat was at 21:33:28Z. At 21:34:51Z it was marked `lost` ("junction: no live claim").

The client saw BUG-294's notice: "The work stopped before it finished… Press Carry on to pick it up from there." They had to press Carry on to continue (turn at 21:39:40Z).
- No deploy happened (the last production deploy was at 03:03Z).
- `log_records` holds no error for the loss. That fits the platform ending the isolate, for example `cpu_ms = 300000` exceeded over a 13-minute turn, or the memory limit.

## What

1. **A lost turn carries on by itself, once.** When a turn ends `lost` and the client didn't stop it, the host starts the same continuation Carry on sends ("Please carry on from where you stopped."), without waiting for a click.
   - The client sees one quiet line: "Picking up where I left off", or similar in the consultant's voice, not BUG-294's notice and button.
   - **At most one automatic carry-on per original turn.** If the continuation is lost too, BUG-294's notice and button appear as today, so a deterministic failure can't loop and spend.
   - Not after a client stop, a refusal, an errored round or a spending cap. Only after `lost`.
2. **Record why the Worker died, where it can be known.**
   - The turn log's `detail` names what the host can see: the heartbeat gap, and the last tool or step the turn was in, from the junction stream.
   - If the platform's own outcome is available (Workers Logs/Tail, `outcome: exceededCpu` / `exceededMemory`), record it with the turn, through Tail Workers or the observability API if that's cheap. Otherwise record "unknown — see Workers Logs at <time>".
3. **Investigate the cause on this turn.** Read Cloudflare Workers Logs for `1stcontact-control-app` around 2026-10-28T21:33Z and record the outcome here. If it's CPU, decide whether the long consultant turn should yield work across requests (for example, builder passes as their own invocations) rather than raising `cpu_ms` again.

## Test plan

- `test_UAT_FC_BUG-312_lost_turn_carries_on_once`: a turn ended `lost` with no client stop starts exactly one continuation turn carrying the Carry on message, and the client sees the quiet line, not the button.
- `test_UAT_FC_BUG-312_second_loss_shows_the_button`: if that continuation is also lost, no further automatic turn starts, and BUG-294's notice and button appear.
- `test_UAT_FC_BUG-312_no_auto_carry_after_stop_or_cap`: a client stop, a spending-cap stop or an errored round starts no automatic continuation.
- `test_UAT_FC_BUG-312_lost_turn_records_last_step`: the turn log `detail` of a lost turn names the heartbeat gap and the last step seen.


## Finding (2026-10-28, Workers Observability)

The lost turn was ended by the CPU limit. Query: `$metadata.service = 1stcontact-control-app`, outcome ≠ ok, 21:20–21:40Z.
- **21:34:12Z — `exceededCpu`**, `POST /b/biz_51a6746495c8057e886ff98d4208e6b9/api/ai/prompt`. **CPU 303,344 ms** against `cpu_ms = 300000` (`[env.production.limits]`), wall time 825,531 ms (~13.8 min).
- 21:34:51Z — `canceled`, `SessionJunction.jsrpc`: the junction noticing the dead claim, which became the turn log's `lost`.

So a single consultant turn (design, page plan, builder pass and checks on the 1st Contact site) used five full minutes of CPU inside one request. Raising `cpu_ms` isn't available: 300,000 ms is the Workers maximum. Point 3 therefore becomes: **the long turn must yield across invocations**, for example by running each builder pass (and its render and layout checks) in its own invocation, Durable Object or Workflow step, so that no single request accumulates the whole turn's CPU. Measure which steps account for the CPU (renders, layout checks, design validation, transcript replay) before choosing.

Until then, point 1's automatic carry-on is a mitigation, not a fix: a turn that dies on CPU continues in a fresh invocation with a fresh 5-minute budget.

The token in `CLOUDFLARE_API_TOKEN` now has Account → Workers Observability → Read, so point 2 can query `workers/observability/telemetry/query` for the outcome of a lost turn (`$workers.outcome`, `cpuTimeMs`, `wallTimeMs`).

## What landed (2026-10-28)

**1. A lost turn carries on by itself, once.**
- The reader that finds a turn `lost` (session open, or a rejoined stream's 10 s check — BUG-294) now says whether it may be carried on: `failed.carry` on the reopen, `meta.carry` on the stream's `lost` end. `carry` is true for a site conversation's turn that was not itself the automatic carry-on of a lost one. The settings conversation keeps BUG-294's button.
- When `carry` is true the panel sends the host cue `lost` (`POST /api/ai/prompt {cue: "lost"}`) in place of painting BUG-294's notice. It is a fresh request, so a turn that died on CPU gets a fresh 5-minute budget. No message is sent in the client's name.
- The prompt route takes the `lost` cue only while the session's last turn ended `lost` and was not itself that cue. Otherwise it answers 409 and starts no turn. So a second loss, a client stop, an errored round and a turn ended at its spending cap are never carried on automatically. The panel paints the notice and button if the cue is refused, so the client always has one or the other.
- The carried-on turn runs on a hidden `lost-continuation-cue` (host guidance: look at the change record before redoing work, don't apologise). It opens with one quiet line, "Picking up where I left off.", streamed live and written to the transcript, the same way an errored round's recovery line is.
- If the carried-on turn is lost too, its `carry` is false: BUG-294's notice and Carry on button appear. A manual Carry on sends the client message ("Please carry on from where you stopped."), not the cue, so a loss after pressing it is carried on once more automatically.

**2. The turn log records how the turn died.**
- `turn_log.detail` for a lost turn: `junction: no live claim; last beat <ts> (silent <n>s when found); last step in <tool> | after <tool> | in the model; platform outcome unknown — see Workers Logs around <ts>`. The step is a `tool_issue` with no finished `tool` record, else the last finished tool, else the model.
- The platform's own verdict (`exceededCpu`, `exceededMemory`) isn't fetched in-worker. The isolate that would report it is the one that died, and querying the observability API from the Worker would need a new production secret. The detail names the time to look at instead.
- The session response no longer carries the raw lost-turn record (turn id, detail) to the client; `failed` carries what the panel needs.

**3. Not done here:** making the long consultant turn yield across invocations (the CPU fix itself). It needs the measurement the Finding calls for first. The automatic carry-on is the mitigation.

## Tests

- `tests/test_UAT_FC_BUG-312_lost_turn_carries_on.workers.test.ts`: `lost_turn_carries_on_once` (reopen says `carry`, the cue streams the quiet line first and runs on the lost cue, a second cue is 409), `second_loss_shows_the_button` (a lost carry-on reports `carry: false`, cue 409), `no_auto_carry_after_stop_or_cap` (aborted / error / complete endings, cue 409), `lost_turn_records_last_step` (detail names beat, silence, `in Delegate`, Workers Logs).
- `tests/test_UAT_FC_BUG-312_panel_carries_on_by_itself.test.ts`: `lost_turn_carries_on_once` (panel sends the `lost` cue, shows the quiet line, no notice or button), `second_loss_shows_the_button` (`carry: false` paints the notice and button, no cue), `a_refused_carry_on_still_leaves_the_button`.
- Neighbour suites run: BUG-129/245/249/262/277/284/285/288/294/298, REQ-171/182/306. One failure, `BUG-249 …stalls_twice…`, fails the same way on clean xgd-working, so it predates this change.