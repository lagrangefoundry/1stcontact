---
uid: bug-db247fe1
id: BUG-249
type: bug
title: 'Turns can wedge a session until the server restarts: progress deadline, self-expiring
  leases, automatic recovery, no ugly client errors'
created_by: EPIC-19
created_at: '2026-10-21T18:37:46.343167+00:00'
updated_at: '2026-10-21T18:45:04.306412+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  severity: critical
  priority: high
  story_points: 8
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-962214e3
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