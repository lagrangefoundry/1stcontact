---
uid: request-24efb2e6
id: REQ-292
type: request
title: The turn's token spend, written down
created_by: EPIC-20
created_at: '2026-09-21T20:00:23.160825+00:00'
updated_at: '2026-09-21T20:00:23.160825+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-99caa32c
---

## Why

Three passes of cost analysis on the Lagrange Foundry build (EPIC-20) landed on
$252, $55 and $107 for the same session. Two of those were wrong by 4.5× and
2.4×, in opposite directions, and both errors were about numbers the Anthropic
API already reports on every request and this repository already discards. That
error band is wider than the margin of the business it is meant to inform.

Nothing needs to be built upstream. `ClaudeAPIBackend` captures `usage` per
request (REQ-143), `turnUsage` folds the turn's requests, `turnSpend` puts
`{usage, requests}` on the terminal `done` event, and `SessionManager` already
writes it into the junction log's `turn_end` record with `manager.usage()`
reading it back — including a delegated worker's `attributed` spend (REQ-148
§6). But this project's junction is `memoryJunctions()` and dies with the
isolate, the `ArchiveSyncer` carries no `usage` into the chat ticket, and
nothing here calls `manager.usage()`. The measurement exists, in memory, for the
life of one isolate, and is then dropped.

## What this ticket does

Every turn that reports spend leaves **one durable record**, scoped to its
tenant, readable after the isolate that produced it is gone.

### Where it is taken

`streamPrompt` in `tools/generate/src/cli/ai/host-core.ts` already reads the
terminal event for the turn's outcome — `if (event.kind === DONE) outcome =
turnOutcome(event.meta)`. The spend is folded from the same event, by
`turnSpend(event.meta)`, beside that line. It is written in the `finally` that
already calls `closePending(deps, sessionId, outcome)`, so a turn the client
walked away from is recorded like any other — that path runs on abandonment,
which is exactly when spend would otherwise be lost.

`streamTurn` in `router.ts` already holds that `finally` open with
`ctx.waitUntil` (BUG-46), so the write survives the response closing without a
new lifecycle mechanism and without delaying the last frame the client sees.

### Through a port, not a table

`deps.recordTurnSpend(record)` on `HostDeps`, following `LedgerDeps`: the Worker
implements it against D1, the `1c` CLI implements it against its own storage or
declines, and neither learns the other's. A host that supplies no
implementation still takes the turn — the same shape `fidelity` and `images`
already have, where **absent is ordinary rather than an error**.

### What a record holds

Tenant, session id, turn id, `started_at`, `ended_at`, role, **backend**,
model, outcome, request count, the four raw counters (`input_tokens`,
`output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`),
`attributed` spend from any delegated worker, and a cost in micros settled at
write time.

**Both the raw counters and the settled cost**, not either. Raw so a past period
can be re-priced against another provider or another model; settled so a bill
does not move when the price table does.

**A turn that measured nothing writes no record.** All-zero is what an empty or
unreadable `usage` block folds to, and a meter must not confuse an unmeasured
turn with a free one — the framework's own "nothing, never zero" rule, applied
one layer out.

### The price table

Four rates per entry — input, output, cache read, cache write — because the
request is billed from four counters and a single input rate cannot express a
cached prefix. Keyed by **`(backend, model)`**, never by model alone: this
product must not become tied to one provider, and a table keyed by model would
have to be rewritten rather than extended when a second one arrives. It is
configuration beside `backends.json`, which is the seam lagrange-framework
BUG-49 opened for exactly this kind of decision.

### Where it is stored

A new D1 table `turn_spend`, by migration `0019_turn_spend.sql`, indexed on
`(tenant_id, started_at)`.

The binding is not currently reachable from the AI host — `WorkerAiEnv` declares
`SITES: R2Bucket` and the API key and nothing else — so the D1 handle is
assembled by `router.ts` and passed to `workerHost` as a parameter, with `null`
an ordinary state.

Not `log_records`, though it exists and would need no migration: `pruneRecords()`
DELETEs it on a band and `log_floor` tracks how far that has reached, and a
meter that will be billed from must not be deletable by an ops job. Not R2
beside the audit, which is durable but turns a month's report into a prefix
listing and thousands of GETs. Not `counters`, which is an aggregate and can
neither be split by model nor re-priced. Not the chat ticket via the ledger
surface, because by `ledger-core.ts`'s own argument the ledger is the
engagement's record and spend is not part of the engagement.

Records are **retained, not pruned**. The raw counters are what will answer
whether a cheaper provider would have served this workload; deleting them
forecloses that question. Rolling aged rows into a period aggregate is a later
decision and not this ticket.

## What must be true when this is done

1. An ordinary turn leaves exactly one `turn_spend` row, readable after the
   isolate that produced it is gone.
2. The row's four counters match what the adapter reported for that turn, and
   its request count equals the model round trips the turn actually made — a
   turn with N tool calls records N+1.
3. **`cache_read_input_tokens` is non-zero, and grows with the conversation,
   across two consecutive turns of one session.** Every cost figure in EPIC-20
   assumes the caching REQ-143/144 landed is working; nobody has ever seen it
   work. If this fails, it is a bug that outranks the rest of the epic.
4. A turn abandoned by the client is recorded.
5. A turn whose backend reported nothing writes no row.
6. Cost in micros is computed from the four counters and the `(backend, model)`
   rates, and a turn on a second backend is priced from that backend's entry.
7. A host with no `recordTurnSpend` implementation still completes turns.

## Not in scope

Any enforcement or cap. Any UI. Engaged time and the per-tenant report — those
are the sibling REQ. Replaying a workload through another provider to compare
it truthfully: token counts are not portable across tokenizers, so re-pricing
stored counters is an estimate and a real comparison needs a replay harness.
That is named in EPIC-20 and deliberately left out here.