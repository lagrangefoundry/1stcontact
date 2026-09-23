---
uid: request-ba1e2212
id: REQ-307
type: request
title: A durable junction, so a deploy does not have to wait for an empty house
created_by: EPIC-19
created_at: '2026-09-22T23:27:12.118848+00:00'
updated_at: '2026-09-23T18:16:55.464424+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-b4335002
  commits:
  - working_sha: a7d374844450b7713957d5d08c8e74fffe2b25c4
    reconcile_sha: null
    main_sha: null
  - working_sha: c8f7b28f8a6c0cccd01ba69f242da2e5da3bdcc5
    reconcile_sha: null
    main_sha: null
  version: 0.2.341
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

## What the port needs that it does not have

The junction's storage port is SYNCHRONOUS — `exists`, `size`, `read`,
`readMeta` all return values rather than promises, because one record layer has
to serve a file, an isolate's RAM and a Durable Object alike. That is what makes
a DO the answer rather than D1, R2 or KV; it is also the one thing an adapter
whose substrate is reached over the network cannot satisfy from inside the port.

So the adapter is a mirror plus a write-behind: every read is answered
synchronously from an in-isolate mirror — upstream's own `MemoryJunctionStorage`,
composed rather than reimplemented, which is what keeps the O(delta) discipline a
single implementation — and every write lands in the mirror synchronously and is
queued, in order, to the object. The residual exposure is one flush rather than
one turn.

Filling that mirror is the ONE piece of asynchrony the port gains, and it needs a
seam:

- A junctions store may carry `prepare(sessionId): Promise<void>`, which the
  host awaits at each session entry point — open, open-business, stream, tail.
  A store without the method (the file junction, `memoryJunctions()`) is
  untouched by it, so this costs the Node host and the `1c` CLI nothing.
- It never throws. A store that cannot be reached is a durability failure and
  not a conversational one: the session still opens, still replays, still takes
  a turn.
- A storage that has not adopted its object never writes to it — so an
  unreachable object degrades to exactly today's behaviour rather than to a
  `seed` overwriting a real junction with an archive replay.
- The junction's queued writes drain on the same `flush` the audit sink already
  rides, so the route's existing `ctx.waitUntil` covers both tiers without a
  second hook in every caller.

## What the binding has to get right

The binding is not one declaration, and each part of it fails quietly rather
than loudly if it is wrong:

- It is declared in BOTH the top-level block and `[env.production]`, because a
  named environment inherits neither vars nor bindings. Forgetting the second
  gives a deployed Worker that sees no binding, runs on RAM, and loses exactly
  the turns this ticket is about while local dev keeps them.
- Both halves provision the class with `new_sqlite_classes`, not `new_classes`.
  The key-value storage the other migration selects has no synchronous SQL, so
  the class could not implement the port it exists for — and a class cannot be
  moved between the two afterwards.
- Wrangler resolves a binding's `class_name` against the entry module `main`
  names. The DO class is exported from `worker.ts` and not `index.ts`, on
  purpose: it imports the workerd built-in `cloudflare:workers`, and the node
  suites that import `index.ts` must never reach it. The Worker-side adapter
  imports only its TYPES, which erase, so the router stays loadable in Node.
- A UAT pins those four together, so the config the repository deploys and the
  config the suites prove are the same config.

Two existing suites mounted `index.ts` through this same `wrangler.toml` via
`unstable_dev`. That worked only while nothing in the config needed an export
`index.ts` lacks; a Durable Object binding does. They now mount the real entry,
which both resolves the class and closes the divergence — `worker.ts` re-exports
`index.ts`'s default handler verbatim, so every route they exercise is the same
route.

## Where it touches

- `apps/control-app/src/ai.ts` — `junctions:` is the one line that changes, plus
  the `flush` that now drains both tiers.
- A new DO class (`junction-do.ts`) and the Worker-side adapter (`junctions.ts`),
  plus the `wrangler.toml` binding and migration in both environments.
- `apps/control-app/src/worker.ts` — re-exports the class from the entry
  wrangler resolves against.
- `apps/control-app/src/router.ts` — the DO namespace has to reach `workerHost`.
- `tools/generate/src/cli/ai/host-core.ts` — the `prepare` seam at the four
  session entry points.
- `tools/generate/src/cli/assets.ts` — the generated AI worker bundle has to
  re-export `MemoryJunctionStorage` and `SessionLog`, the two halves of the port
  the adapter composes.
- `vitest.workers.config.mts` — the workers suite runs the REAL Durable Object
  on miniflare's SQLite rather than a stand-in, because what is under test is
  that a turn survives the isolate that wrote it.