---
uid: request-24efb2e6
id: REQ-292
type: request
title: The turn's token spend, written down
created_by: EPIC-20
created_at: '2026-09-21T20:00:23.160825+00:00'
updated_at: '2026-09-21T21:38:41.116712+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-99caa32c
  commits:
  - working_sha: 6bdbc815610f55875e29012cac625d9f8d66a728
    reconcile_sha: null
    main_sha: null
  - working_sha: c46609ea0f26fa7914e14b44d7175de7808a42c3
    reconcile_sha: null
    main_sha: null
  - working_sha: ae35c37753394a61075c9a5def00c4fa03249ac1
    reconcile_sha: null
    main_sha: null
  version: 0.2.309
  story_points: 5
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

## Implementation decisions

Recorded here because several were forced by what upstream actually hands over,
and one of them narrows a condition above.

### The record carries no tenant; the implementation is bound to one

`TurnSpendRecord` has session, turn, times, role, backend, model, outcome,
requests, the four counters, `attributed` and the settled cost — and no tenant.
`router.ts` resolves the business before the host is built and binds
`d1TurnSpend(env, tenantId)` once, so the tenant is stamped by the
implementation. A crossing is then impossible by construction rather than
prevented by a predicate somebody has to keep correct, which is the same shape
`chatLedger(tickets, sessionIdFor(site))` already has. The stored row still
carries `tenant_id`, and the index the period read uses leads with it.

### The turn id is minted by the host

The framework's own turn id is stamped on the junction's `turn_start` /
`turn_end` records and never reaches the stream vocabulary `streamPrompt`
consumes. So the host mints one, from the system's single minter, and it is the
table's primary key — which makes *exactly one row per turn* a property of the
database rather than of the caller.

### `attributed` is stored whole, and is null here

An attributed entry names its own backend and its own role, so flattening it
into this row's four counters would price a delegated worker's tokens at this
row's `(backend, model)` — the error the two-part price key exists to prevent.
It is therefore one nullable JSON column. It is null on every turn this product
takes: no delegation surface is composed, and `SessionManager` puts `attributed`
on the junction's `turn_end` rather than on the terminal event `turnSpend` reads.

### An unpriced `(backend, model)` writes a row with a null cost

Null, never zero, for the same reason an unmeasured turn writes nothing: the
counters make the turn re-priceable later, and a zero would claim it was free.
Two UATs follow from this — that the project's *configured* model has rates (so
changing `backends.json` without touching `prices.json` fails a test rather than
producing months of unpriced turns), and that every entry in the table carries
all four rates or is refused wholesale rather than part-pricing a turn.

### The counter names are restated once, and held to the library

`spend-core.ts` cannot derive its column set from the library: the library is
resolved at runtime and typed `any`. It restates the four names and a UAT asserts
they equal `lib.USAGE_KEYS`, so a counter added upstream fails a test instead of
being silently dropped — the same discipline `log.ts`'s `COLUMN_OF` uses.

### Condition 4, narrowed: what an abandoned turn can and cannot say

A turn the client walked away from **after its terminal event** is recorded like
any other: the write is in the `finally`, and `ctx.waitUntil` holds the isolate
open past the response closing. That is the common case — the `done` frame goes
out before the host's `finally` runs, so the client is entitled to stop listening
before the write has happened, and without `waitUntil` the turn the operator was
billed for would be the one turn with no record of it.

A turn cut off **mid-generation** is a different matter and cannot currently be
recovered. The client walking away closes the host's loop, which closes the
manager's, which closes the adapter's — and the adapter reports what it was
billed for on the `done` it never reaches. The counters for requests already sent
survive only in `ClaudeAPIBackend`'s own per-segment ledger, which this host holds
no handle on; the manager's `turn_end` carries `{}` for the same reason. So no
row is written, which is the honest answer rather than the convenient one: a row
of zeros would claim the turn was free, and a row of the counters we happen to
hold would claim a total that is short. This is pinned by a UAT so the boundary
is visible rather than discovered later as a discrepancy, and closing it is an
upstream change — the adapter's ledger exposed, or a stop requested on
disconnect — not one this host can make.

### Condition 3, what is and is not proved offline

Whether Anthropic actually served a cached prefix is a fact about a provider and
is only observable against the real API. What the UATs prove is everything
between that number arriving and it being readable a week later: that the
counter is carried per turn rather than summed across the session, that it is
not confused with the full-price input side, that it is priced at its own rate —
a turn that moved tokens from input to cache read costs *less*, which a single
input rate could not express — and that the request this host sends carries the
`cache_control` breakpoint without which the provider could never report one.
The first non-zero reading against the real API is still the moment the epic's
premise is confirmed; this makes that reading exist to be looked at.

### The price table

`tools/generate/src/cli/ai/prices.json`, beside `backends.json`, keyed
`(backend, model)` with four rates each in **US dollars per million tokens** —
the unit every provider publishes, and the one that makes the settled figure
`tokens x rate` in micros with no division. It carries `claude-opus-5` and
`claude-sonnet-5` under `claude`, and `gpt-4o` under `chatgpt` — a second
backend that the framework already declares, so condition 6's second entry is
real rather than a placeholder. The numbers are published list rates at the time
of writing and are configuration.


### The model is asked of the framework, not read out of `backends.json`

The row's `model` column is the second half of the price key, so a reading that
is merely *plausible* is worse than none. `backends.json` records what this
project **names**; the settings that actually reach the wire are that document
merged per key over the framework's shipped defaults. Delete the `model` key and
the request quietly falls back to the framework's, and a meter reading the file
directly would go on recording the model nobody ran. So `projectBackendModel`
calls the same `backendSettings` the adapter's own constructor calls, and the
backend half is `PROJECT_BACKEND` — the adapter FAMILY, not the per-site registry
name (`claude+site:acme`), because rates belong to the adapter and the model.

### The test harness applies the migration, and its head marker moves with it

`0019` is appended to `d1-site-factory.ts`'s migration list and the `atHead`
probe is moved onto `idx_turn_spend_tenant`. Not optional bookkeeping: the chat
host now writes from the `finally` of every turn, and the host swallows a meter
failure on purpose — so a suite left at the old head would not fail on a missing
table, it would run silently unmetered, which is the worse of the two.

### The shared model double learns to report usage

`scripted-model-client.ts` gains `metered(usage, step)`, which wraps an existing
step rather than transcribing a fifth copy of the wire protocol. It emits the
two frames the real wire uses and `AnthropicAccumulator` reads — the input side
(both cache figures included) on `message_start`, the settled output count on
`message_delta`. A double that put all four on one frame would pass against an
accumulator that read only the other, which is the drift this module exists to
prevent. `pacedClient` takes the same optional usage so the mid-generation
cut-off case has something it could have recorded.