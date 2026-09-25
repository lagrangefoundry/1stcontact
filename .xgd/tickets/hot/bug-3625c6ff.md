---
uid: bug-3625c6ff
id: BUG-149
type: bug
title: 'Builder chat: the durable junction never writes, because the Durable Object
  stub is cached across requests'
created_by: EPIC-19
created_at: '2026-09-25T23:25:51.210884+00:00'
updated_at: '2026-09-25T23:25:51.210884+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-94cc7600
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