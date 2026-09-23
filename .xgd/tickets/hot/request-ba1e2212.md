---
uid: request-ba1e2212
id: REQ-307
type: request
title: A durable junction, so a deploy does not have to wait for an empty house
created_by: EPIC-19
created_at: '2026-09-22T23:27:12.118848+00:00'
updated_at: '2026-09-23T02:36:51.693800+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b4335002
---

## What this is for

A deploy, an isolate eviction, or a `wrangler dev` reload currently destroys every
turn in flight. We cannot gate a deploy on "no client has a turn running" — turns
here run 2–9 minutes once the consultant delegates to `claude_builder` workers, so
at any working hour there is one open. A restart must cost the client the rest of
the answer and nothing else: not their words, not the work the turn already did,
not the coherence of the transcript.

## Why it is lost today

The junction is the only place a turn's records live while the turn is open. The
archive deliberately lags by a whole open turn — `closedPrefix` cuts at the last
boundary where no turn is open, because folding half a turn splits one reply in
two — so between `turn_start` and `turn_end` there is no durable copy of the
prose OR the tool records. In this Worker the junction is RAM: `ai.ts` passes
`junctions: lib.memoryJunctions()`. When the isolate goes, so does the turn, and
no `finally` runs — no `turn_end`, no fold, no spend row, and [[BUG-121]]'s
pending record is left at `status: open`. EPIC-19 Finding 10 records three such
losses in one afternoon, each correlated with a source change restarting the dev
server under a live turn.

`ctx.waitUntil` ([[BUG-46]]) already holds the isolate open past a CLIENT
disconnect, which is a different failure and is closed. Nothing can hold open an
isolate that is being replaced.

## This is not an upstream change, and upstream says so

`junction_memory.js`'s own header states the exposure and the route back in
terms: *"A Durable Object restores both properties — it is a single writer with a
synchronous SQLite API — and needs no change here, which is the point of making
storage a port."*

Three things make that true, and all three are already in place upstream:

- **The port is synchronous.** `JunctionStorage` is `exists / size / append /
  read / replace / remove / readMeta / writeMeta`, and `SessionLog` calls them
  synchronously (`log.append(TURN_END, …)` returns the record; `log.readFrom(0)`
  returns rows). A Durable Object's `ctx.storage.sql` is synchronous, so a DO
  junction satisfies the port as written. Any other durable store — D1, R2, KV —
  would not, and that is precisely why the DO is the answer rather than one of
  them.
- **Single writer per session is what the junction assumes.** DOC-21 §1.1
  rejected an in-memory hub on exactly this ground; a DO keyed by session
  restores it.
- **Crash recovery already exists.** `SessionManager._reconcile` runs when a
  fresh process attaches to a junction that ends mid-turn: a lapsed lease says
  the producer is gone, so it closes the dangling turn `aborted` and drains. That
  is the pass that turns a killed turn into a consistent, archived, truncated one
  — and today it has nothing to recover from, because the junction died with the
  isolate.

So no `lagrange-framework` REQ is needed. What is missing is an adapter on our
side of the port.

## Behaviour

- The Worker holds each session's junction in a Durable Object keyed by session
  id, implementing the same `JunctionStorage` port `memoryJunctions()` does, over
  `ctx.storage.sql`.
- A turn's records — prose deltas, tool records, cards, compaction records —
  are durable as they are appended, not when the turn closes.
- When a Worker is replaced mid-turn, the next attach to that session finds the
  dangling turn, closes it `aborted`, and folds everything the turn managed to
  record into the transcript. The client sees their prompt, the partial reply,
  and the tool records for the work that actually landed.
- The client is told the reply is a fragment rather than the whole — which is
  [[BUG-121]]'s `recorded: true` branch, the notice we already paint, now
  reachable instead of theoretical.
- Appends stay O(delta): the DO adapter keeps the chunk-list-plus-offset-index
  discipline `MemoryJunctionStorage` documents, so the hottest loop in the system
  does not become quadratic in the adapter.
- A deployment with no DO binding falls back to `memoryJunctions()` and behaves
  exactly as it does today, so the suites and the `1c` CLI are unaffected.

## Explicitly NOT in scope

The turn does not RESUME across a restart. The model loop was running in an
isolate that no longer exists; nothing can continue it. What this buys is that
the turn's words and work survive and the conversation stays coherent, so the
client re-asks rather than reconstructs. Driving a turn from inside the DO so it
survives its originating request is a separate and much larger question.

## Where it touches

- `apps/control-app/src/ai.ts` — `junctions:` is the one line that changes.
- A new DO class plus its `wrangler.toml` binding and migration.
- `apps/control-app/src/router.ts` — the DO namespace has to reach `workerHost`.

/tmp/claude-501/req307-corr.md