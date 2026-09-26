---
uid: bug-3625c6ff
id: BUG-149
type: bug
title: 'Builder chat: the durable junction never writes, because the Durable Object
  stub is cached across requests'
created_by: EPIC-19
created_at: '2026-09-25T23:25:51.210884+00:00'
updated_at: '2026-09-26T06:58:35.954263+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-94cc7600
  commits:
  - working_sha: 4f8a81613096d01f31259d43a64ca11c15bffecc
    reconcile_sha: null
    main_sha: null
  - working_sha: 5fd542f38688b3a90d3751075317081f770eef7b
    reconcile_sha: null
    main_sha: null
  version: 0.2.371
---

# Builder chat: the durable junction never writes, because the Durable Object stub is cached across requests

## What happens

[[REQ-307]] made the session junction durable so that an isolate dying mid-turn
costs the client the rest of the answer and nothing else. It does not do that.
On every request except the first one a fresh isolate handles, the junction
adapter silently reverts to `memoryJunctions()` — in-RAM, per isolate — which is
precisely the exposure REQ-307 was built to remove.

The dev server log carries this once per prompt:

    junction durable:site-site_936dd7c…: could not be prepared — Error: Cannot
    perform I/O on behalf of a different request. I/O objects (such as streams,
    request/response bodies, and others) created in the context of one request
    handler cannot be accessed from a different request's handler. This is a
    limitation of Cloudflare Workers which allows us to improve overall
    performance. (I/O type: OutgoingFactory)

## Why

`durableJunctions(namespace)` (`apps/control-app/src/junctions.ts`) keeps a
`Map` of `DurableJunctionStorage` for the isolate's life — correctly, because the
mirror it holds is what makes the port's synchronous reads possible. But each
storage also **captures the `DurableObjectStub` in its constructor**:

    storage = new DurableJunctionStorage(sessionId, namespace.get(namespace.idFromName(sessionId)))

A stub is an I/O object. workerd binds it to the request context that created it
and refuses it from any later request. So the stub works for exactly the request
that built the storage and throws `Cannot perform I/O on behalf of a different
request` for every request after that.

The throw lands in `prepare()`, which catches by design:

    } catch (err) {
      this.adopted = false
      console.error(`junction ${this.key}: could not be prepared — ${String(err)}`)
    }

and `queue()` then drops every write on the floor:

    private queue(write): void {
      if (!this.adopted) return
      …
    }

Appends still land in the in-isolate mirror, so reads look right, the turn
streams normally, the fold to the archive happens normally, and **nothing
anywhere says the durability tier is off.** The class comment describes this as
"degrades to exactly `memoryJunctions()` — today's behaviour", which is accurate
and is the defect: it degrades to the failure mode the ticket exists to fix, at
the only moment it matters.

## Evidence — measured on the Lagrange Foundry session, 2026-09-25

Durable Object `1stcontact-control-app-SessionJunction`, name
`site-site_936dd7c92e5e14df694dd9a80433aa4f`:

- the object holds **2,170,269 bytes / 1,994 records / 89 turns**, and its last
  record is the `turn_end` at `22:11:14.234Z`;
- of those 89 turns, **85 came from the one `seed` that ever landed**
  (`epoch = 1`, a single 291,247-byte chunk written 2026-09-24T18:49:18) and only
  **4 are live turns**: 02:05:53, 02:35:40, 04:32:53 and 22:02:07;
- the archive's `chat_transcript` comment holds **17** turns added after that
  seed. **Thirteen of them never reached the object.**

Every chunk row but the seed holds exactly one record, so the "object is behind,
push the tail forward" repair in `adopt()` has never once fired — consistent with
`adopted` being false, since that repair is inside `adopt()` too.

The four that did land are each the **first** prompt on a fresh isolate. The dev
log shows the pattern directly, on one dev-server generation:

| time (UTC) | prompt route | junction error |
|---|---|---|
| 21:43:20 | `POST …/api/ai/prompt` | yes — dropped |
| 21:50:29 | `POST …/api/ai/prompt` | yes — dropped |
| 21:55:29 | *server restarted* | |
| 22:02:07 | `POST …/api/ai/prompt` | **no** — landed |
| 22:20:10 | `POST …/api/ai/prompt` | yes — dropped |

The 22:20:10 turn was then killed three minutes in by a dev-server restart. Its
`turn_log` row still reads `ended_at` null, its `pending_turn` still reads
`open`, there is no spend row, and — because of this bug — **not one of its
records exists anywhere**: no `turn_start`, no prompt, no delta, no tool record.
Had REQ-307 been live, `_reconcile` would have closed and folded it.

## What the fix has to do

1. **Do not cache the stub.** Keep the storage and its mirror for the isolate's
   life — that is what the port needs and it is pure memory — but retain the
   *namespace* and obtain the stub per use, inside the request that is using it.
   The namespace binding is not request-scoped; the stub is.
2. **Drain inside the request that appended.** The write-behind chain must be
   awaited on a `ctx.waitUntil` belonging to the request whose stub issued the
   writes, or the same restriction bites the flush instead of the read.
3. **A dropped write must not be silent.** `adopted = false` currently means
   "this session is now RAM-only, indefinitely, and nobody is told". Whatever the
   recovery is, the adapter must either retry the adopt on the next request or
   report the degradation somewhere an operator sees — a `console.error` per
   prompt in a dev log is not that.

## Acceptance

- A session whose junction object was prepared on request N has its records
  reach the object on requests N+1, N+2, … — measured by reading the object,
  not by the absence of an error.
- After a Worker restart mid-turn, the object holds that turn's `turn_start`,
  prompt and deltas up to the moment of the restart, and `_reconcile` closes the
  dangling turn `aborted` and folds it.
- No `Cannot perform I/O on behalf of a different request` appears in the dev log
  during an ordinary multi-turn conversation.
- The degradation path (object genuinely unreachable) is still non-fatal — the
  conversation still opens, replays and takes a turn — but it is no longer the
  path an ordinary second request takes.

## Boundaries

The companion defect — that an incomplete junction is preferred over a complete
archive, which is what made this visible as "my whole session vanished" — is
upstream's `SessionManager.transcript()` and is filed in `lagrange-framework`,
not here. Fixing this bug stops junctions going stale; it does not make a junction
that is already stale safe to show. Both are needed.

Recorded as EPIC-19 Finding 12, Defect A.


---

## What was built

### 1. The stub is never held; the namespace is

`DurableJunctionStorage` now takes the `JunctionNamespace` and the session id,
and takes a stub from the namespace **per use** — in `adopt()`, and in `queue()`
at the moment a write is queued, which is inside the request whose turn
appended it. The storage and its mirror still live for the isolate's life,
because that is what makes the port's synchronous reads possible; only the
handle is short-lived. `durableJunctions()` hands the binding over unchanged.

The write-behind chain is drained by the request that created it, which every
writing route already did — `streamTurn`'s `finally` awaits `host.flush` inside
the `ctx.waitUntil` it registered, and `/api/ai/session` awaits it before
answering. Reattach writes nothing. So requirement 2 needed no new plumbing,
only the stub lifetime to stop violating it.

### 2. A degraded storage repairs itself, losslessly

The recovery arm of requirement 3 is the one taken. Every session entry point
awaits `prepare`, so a failed adopt costs **this** request's writes their
durability and nothing beyond it — provided the next adopt does not then delete
them, which it would have.

`adopt()`'s "the object is behind, push the tail forward" repair was gated on
`adopted && the epoch is unchanged && the object is shorter`. That is sound for a
flush that did not land and answers the wrong question for the state this bug
produces: after a failed prepare `adopted` is false and the mirror holds records
that never left the isolate, so the wholesale-adopt path would have thrown them
away the moment the object came back. The gate is now a new `behind()`
predicate that compares the bytes: the object's stream is pushed forward iff it
is a strict **prefix** of the mirror (an absent or empty object being the trivial
prefix). That is sound with or without the flag, whatever the epoch did, and it
cannot overwrite a divergent object — a stream that is not a prefix is adopted,
as before, so the "a `seed` must not overwrite a real junction" rule is intact.

### 3. The log is a transition, not a drumbeat

`console.error` fired once per prompt, forever, saying the same thing. It now
fires when the tier goes off (`RAM-only until the object can be read — …`) and
when it comes back (`durable again — …`), both on `console.error` so the pair
reads together in one stream.

### 4. Two small robustness changes in the same chain

`drain()` swallows a rejected tail rather than propagating it (it is documented
as never rejecting, and its one caller is a `waitUntil`), and `queue()` chains
with `.then(run, run)` so a link that somehow rejected cannot stall every write
behind it.

## Test plan

`tests/test_UAT_FC_BUG-149_a_later_request_still_writes.workers.test.ts`, in the
workerd project against the real Durable Object:

| UAT | Acceptance bullet |
|---|---|
| `…_a_session_prepared_on_one_request_still_writes_on_the_next` | records reach the object on requests N+1 and N+2, read from the object |
| `…_an_ordinary_conversation_logs_no_cross_request_io_error` | no `Cannot perform I/O …` in the log across a three-turn conversation |
| `…_a_turn_killed_on_a_later_request_is_still_recovered` | a restart mid-turn leaves `turn_start`, prompt and deltas on the object; `_reconcile` closes it `aborted` and folds it |
| `…_records_written_while_the_object_was_unreachable_reach_it_when_it_returns` | §2 above — the repair is lossless |
| `…_an_unreachable_object_is_a_durability_failure_and_not_a_conversational_one` | the degradation path is still non-fatal |

Four of the five fail against the Worker as it shipped; the fifth is the
degradation path and must pass both ways.

**Why the suite wraps the binding.** The Durable Object is the real one, as in
REQ-307's suite. What is wrapped is the *namespace*, to enforce a platform rule
the test runtime does not: measured, `@cloudflare/vitest-pool-workers` serves a
whole test file from one I/O context, so a stub captured in one `worker.fetch`
is still usable in the next. That is exactly why REQ-307's suite passed against
a Worker that had already stopped writing in production — every case in it kills
or reopens on the first request a session ever sees. The wrapper hands out
stubs that throw workerd's own sentence, verbatim, from the next request onward,
and can also make the object unreachable so the degradation and recovery paths
are reachable at all.

Regression scope: the workerd project in full, plus `pnpm -r build` (tsc).


### Harness note — where a request ends

The suite passes the Worker a real `ExecutionContext`, and a request is over
when what it held open has settled, not when the `done` frame arrives.
`streamTurn` returns its `Response` before `start()` runs and registers a
`ctx.waitUntil` promise that settles only after the turn's `finally` has closed
the ledger, flushed the junction and flushed the audit. A suite that retired the
request at the last frame would be refusing the turn's own flush — measured: it
produced `write did not land — Cannot perform I/O …` from a write that was still
queued — and would have recorded a harness artefact as a defect. A killed
isolate is the opposite case and has its own verb: the request is *abandoned*,
its held promise dropped, because a turn whose `finally` never runs is exactly
what a restart mid-turn is.

## Verification

- `tests/test_UAT_FC_BUG-149_a_later_request_still_writes.workers.test.ts`:
  5 passed. Against the Worker as it shipped, 4 of the 5 fail — the fifth is the
  degradation path and passes both ways.
- The workerd project in full: 162 files / 1365 tests passed.
- The node tests that import `router.ts`: 38 passed. Nothing outside the workerd
  project imports `junctions.ts`.
- `tsc --noEmit` on `apps/control-app`: clean.