---
uid: request-16813fa3
id: REQ-306
type: request
title: A turn that dies uncatchably must still report legibly to the client
created_by: EPIC-16
created_at: '2026-09-22T23:13:21.139160+00:00'
updated_at: '2026-09-23T03:02:42.258704+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  priority: medium
  epic_parent: epic-96d8aca6
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b5491bd4
  commits:
  - working_sha: 1e054221f24abdded3ed92181c234aba4d3f132b
    reconcile_sha: null
    main_sha: null
  - working_sha: f0b48980400461a5277718061ab0ed64c19bf7db
    reconcile_sha: null
    main_sha: null
  - working_sha: 40b5ae79727109005103245462bb15197749d16b
    reconcile_sha: null
    main_sha: null
  - working_sha: 78b52cefea8f89680d7139de91a237adac859d5d
    reconcile_sha: null
    main_sha: null
  version: 0.2.339
  story_points: 5
---

## Why

When the Lagrange Foundry chat turn exceeded the isolate's memory, the customer was told
*"the connection to this reply was lost."* Nothing else. No error, no cause, no record.

The mechanism: `streamTurn` returns its `Response` before `start()` runs, so the headers are
already sent when the work begins. When the isolate is killed mid-stream the client receives a
**200 with an empty body and no terminal frame**. The `catch` that would render a readable
error never runs. The `finally` that flushes the audit dies with it. From the operator's side
the turn leaves no trace beyond a Cloudflare tail entry — which is where
`outcome=exceededMemory` was eventually found, by going and looking.

The same shape applies to the digest's own guard. `siteDigestSource` wraps its derivation in
`try/catch` on the stated principle that *"a failed read is silence, not a failed turn."* That
contract is sound and it does not hold: an OOM is not catchable, so the one failure mode that
path actually had was the one the guard could not see.

The memory faults themselves are covered elsewhere. **This ticket is about the fact that they
were invisible** — and would have been invisible whatever killed the isolate. A CPU-time
overrun, an eviction or a future unforeseen limit all produce the same unreadable silence.

## Required behaviour

1. A turn that ends without a terminal frame is **detected as a failure by the client**, rather
   than rendered as a lost connection. A stream that stops early is a distinguishable state,
   not an ambiguous one.
2. The customer is told something true and actionable. They need not be told about isolates or
   memory, but they must not be told the connection dropped when it did not.
3. The failure leaves a **durable operator-visible record** that does not depend on code running
   inside the dying isolate. A `finally` block cannot be the only path by which a turn's end is
   recorded.
4. The record is enough to identify the site, the session and the turn, so an operator can find
   it without reconstructing the incident from platform tails.
5. Repeated failures of the same kind are visible as a pattern rather than as isolated customer
   complaints. Lagrange Foundry failed every turn for a period before anyone established why.

## Scope

The implementer owns the mechanism. Plausible shapes include recording a turn's start before
the stream opens and reconciling it on completion, emitting a heartbeat the client can time
out against, or a terminal frame contract the client enforces. Any combination satisfying 1–5
is acceptable.

**Out of scope:** the memory faults that produced this particular incident — the per-turn
digest's asset reads, publish's snapshot handling, and the ladder's accumulation all have their
own requirements. This ticket must not be implemented as a fix for `exceededMemory`
specifically; it is about any uncatchable end of a turn.

Also out of scope: retrying a failed turn. Reporting is the requirement here; whether anything
should be retried is a separate question.

## Acceptance

- A turn whose isolate is killed mid-stream produces a readable failure for the customer and a
  durable record for the operator.
- The record exists without any code in the killed isolate having run after the kill.
- An operator can see that a given site is failing turns repeatedly without being told by the
  customer.

## What was built

The mechanism chosen is **record the turn's start before the stream opens and reconcile it on
completion**. A turn's row is opened by the *route*, awaited before the `Response` exists, and
closed in `streamTurn`'s `finally`. A row nobody closed is the durable record of a turn whose
isolate did not survive to write its own ending — the one fact nothing inside that isolate
could ever have recorded. No heartbeat and no sweeper: both are second mechanisms able to fail
in the same way as the first.

### The ledger — `turn_log` (D1, migration `0021`)

One row per turn: `turn_id` (primary key, minted by the route), `tenant_id`, `session_id`,
`started_at`, and a nullable `ended_at` / `outcome` / `detail`.

- **`session_id` identifies both the site and the conversation**, and there is deliberately no
  second column beside it. A session id is `site-<key>` or `business-<id>` — the documented
  total inverse of `sessionIdFor` / `businessSessionIdFor`. With `tenant_id` beside it a row
  names the business, the site and the conversation, which is requirement 4.
- **NULL means no code ran after the kill**, not "unknown" and not "zero".
- **`outcome` reuses the host's own `TurnOutcome` vocabulary** (`complete` / `aborted` /
  `error`), which `turn_spend.outcome` and `pending_turn.status` already carry, so the three
  records of one turn read side by side without a translation table.
- **`detail` is scrubbed** by the same `scrub` the client-facing error frame goes through,
  because the row is read back by an operator console and by the panel's own recovery.
- Retained, never pruned: how often the platform kills its own turns, and whether a change made
  it better or worse, is a question only the whole history can answer.

A new table rather than an existing one. `turn_spend` is a meter whose `ended_at` is NOT NULL
because a meter's row is written once, in full, at the end and never revised; `log_records` is
pruned on a band, and what is being recorded here is the *absence* of a later write, which
cannot be reconstructed once the opening row is deleted; `pending_turn` holds the customer's
question so it can be re-sent, is one field replaced by the next turn, and says `open` both for
a turn that is running and for a turn whose isolate died.

### Two readers, two pieces of evidence

*Lost* is derived, never stored, and is decided in one module (`turn-log.ts`) so a turn in
flight and a turn that died are told apart in one place:

- **For the customer**, without a clock: `live` is the junction's answer to *is a turn running*;
  an unclosed row is the ledger's answer to *did a turn fail to write its own ending*. Both true
  is an ordinary turn in flight. The ledger saying yes while the junction says no is a
  contradiction only one thing produces — the isolate that opened the row is gone, taking the
  RAM junction with it. That is exact the instant it happens.
- **For the operator**, who reads across many sessions from an isolate holding none of their
  junctions and so has no liveness to contradict: a ceiling, `TURN_LOST_AFTER_MS` (15 minutes),
  past which *still running* stops being a credible account of an unclosed row.

### What the customer is told (requirements 1 and 2)

`/api/ai/session` — the call the panel already makes when a stream stops without a terminal
frame — now travels back with `failed`, drawn from the ledger. The panel composes it with
`interrupted` (BUG-121) into **one** notice rather than two: `interrupted` is about the
customer's *words*, `failed` is about what became of the *turn*. Where the turn was killed
before it could write the words down there is no `interrupted` at all, which is precisely the
case that previously repainted in silence.

The notice names no isolate and no memory limit — how the platform broke is the operator's
business. It says the reply stopped, that **the connection held**, that the failure was ours
and is recorded, and it quotes the turn id, so a customer who says *it failed again, turn_9f…*
has done the whole of the triage that previously required reading a platform tail. An errored
turn reads differently from a lost one because they are different facts: an errored turn knows
why, a lost turn has no why and inventing one would be worse than the silence.

The three notices in `chaseLostTurn` that claimed *the connection to that reply was lost* now
say the reply stopped. Told the connection had dropped, a customer reloads, retries and checks
their network — the three remedies that cannot possibly work — and the one party who could act
never hears about it.

### What the operator sees (requirement 5)

`GET /api/admin/turns?business=…`, behind the same `ownsPlatformBusiness` gate and the same 404
as the meter routes beside it, reporting the most recent turns, a tally by state, and
`consecutiveLost` — the run of deaths counting back from the most recent. It takes **no period**
where its neighbours do: *failing repeatedly* is a statement about consecutive turns, not about
a window, and a period wide enough to catch a site that takes four turns a week buries one
losing forty an hour. An open row at the head neither breaks the run nor extends it, since the
newest row is very often a turn in flight and letting it break the count would hide a site from
the one operator looking at it while it fails.

A **Turn health** section on the operator console's detail pane renders it beside the account,
the address and the cost, following `tenant-cost.js`'s injected-read shape. The alarm sits
above the figures it is derived from, because a sentence placed after a grid is one the reader
it was written for has already scrolled past. The four states are named and never summed: a
turn the customer abandoned and a turn the platform killed are both *turns that did not
complete*, and a figure adding them would let a busy afternoon hide an outage. Every zero is
still shown.

### Failure is never allowed to cost a turn

Every path in `turn-log.ts` swallows its own failure, on `previousTurn`'s reasoning: a safety
net that fails the thing it was protecting has made matters worse than having none. A
deployment with no database, or one whose insert refused, behaves exactly as the route did
before the ledger existed — `openTurn` answers `null` and the close is a no-op. A close that
fails leaves the row open, which reads as a death that did not happen: the safe direction, since
a ledger that over-reports failure is investigated and one that under-reports it is trusted.

### Files

- `db/migrations/0021_turn_log.sql`, `db/migrations/manifest.json`
- `apps/control-app/src/turn-log.ts` — the ledger: open, close, the *lost* judgement, the two reads
- `apps/control-app/src/router.ts` — the open before the stream, the close in the `finally`,
  `failed` on `/api/ai/session`, `GET /api/admin/turns`
- `apps/control-app/src/builder/turn-health.js`, `builder.css`, `config.js`, `app.js`, `api.js` —
  the console section
- `apps/control-app/src/builder/chat.js` — the truthful notice
- `tests/support/d1-site-factory.ts` — the migration in the fixture list, `atHead` marker moved

## Test plan

- `tests/test_UAT_FC_REQ-306_a_killed_turn_leaves_a_record.workers.test.ts` — the row exists
  before the first byte; it stays open for the duration of the turn; a completed turn closes its
  own row; a failed turn records a scrubbed reason; a destroyed junction (an isolate death,
  reduced to the only thing it destroys that anything can observe) is reported to the customer
  as a failure; an ordinary conversation reports none.
- `tests/test_UAT_FC_REQ-306_the_operator_sees_failing_turns.workers.test.ts` — a run of deaths
  is reported as a run; abandoned and in-flight turns are not deaths; a failed turn carries its
  reason; a quiet business reads as quiet; only a platform operator may read it.
- `tests/test_UAT_FC_REQ-306_the_panel_says_the_turn_died.test.ts` — a died turn is not reported
  as a dropped connection; a died turn and a kept prompt produce one notice; an errored turn says
  why; an ordinary conversation gets no notice.
- `tests/test_UAT_FC_REQ-306_console_turn_health.test.ts` — the run is shouted above the
  figures; a healthy business is not shouted at; each row names the conversation and the turn; a
  ledger that cannot be read says so and nothing else; a business with no turns reads as quiet.

### Two existing UATs pinned the sentence this ticket removes

`test_UAT_FC_BUG-46_a_failed_rejoin_leaves_the_turn_and_the_pane_intact` and
`test_UAT_FC_BUG-123_a_host_with_no_reopen_is_unchanged_but_not_silent` both asserted the
notice verbatim: *the connection to that reply was lost*. Requirement 2 says the customer
must not be told the connection dropped when it did not, so the assertions were updated to
the new sentence — a wording supersession, not a behavioural one. What each test is actually
about is unchanged and still asserted: a panel that cannot find out what became of a turn
says so rather than going quiet. Both tests carry a note recording why the string moved.

### The migration is `0021`, not `0020`

[[REQ-304]]'s `0020_asset_digest.sql` landed on the working branch while this one was open, so
the two collided at merge. `wrangler d1 migrations apply` orders by FILENAME, so a shared
number is an ordering it cannot resolve. This ticket's file renumbered rather than REQ-304's
being moved: a migration that has already been applied somewhere cannot be renamed without the
recorded name ceasing to match the file. The test fixture applies both, in number order, and
`atHead` — the marker that asks whether the LAST migration has run — moved to this ticket's
`idx_turn_log_tenant` because this ticket's file is now the last one.

-