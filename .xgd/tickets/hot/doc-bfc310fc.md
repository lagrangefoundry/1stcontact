---
uid: doc-bfc310fc
id: DOC-61
type: doc
title: 'Mechanism: reaching a working turn between its tool calls, publishing its
  budget, and the cursor primitive'
created_by: EPIC-19
created_at: '2026-09-28T19:37:49.964839+00:00'
updated_at: '2026-09-28T22:01:25.473664+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  doc_kind: architecture
  epic_parent: epic-95bc3b15
---

> **This document is the mechanism half of [[DOC-62]].** DOC-62 is the experience design
> for a site-building session — who the participants are, what each one is for, what the
> client sees and what each AI can perceive and do. This document answers *how* the parts
> of that design which touch a running turn are actually built: how a working turn is
> reached between its tool calls, how its budget is published, and what a cursor over a
> transcript is. Read DOC-62 first; it says why any of this matters. Read this one when
> implementing §5, §6 or §4 of it.

## What this document is for

A consultant turn can run for ten minutes. For that whole time the client can type
and be ignored, the session cannot be told anything, and when the turn ends — whether
it finished or merely stopped — nobody, including the model, knows which happened.
The working assumption behind the design so far was that this is inherent: an API
request is request/response, so a turn in flight is unreachable.

**That assumption is wrong, and the mechanism that disproves it is already in
production.** A product turn is not one request. It is up to fifty, and the host
writes every one of them. This document says what that buys, what is already built,
the four faults that remain, and in what order to fix them.

Findings 14.11–14.16 of [[EPIC-19]] carry the conversation this came out of. This
document carries the design.

## The finding that reframes it

`runToolLoop` (`lagrange-framework`, `components/ai/js/src/backends/api_tools.js`) is
a host-driven loop of up to `MAX_TOOL_ITERATIONS = 50` **separate API requests** per
product turn: the model returns tool calls, the host runs them, the host builds the
next request. Only a tools-off turn is a single request — `const maxIter =
toolNames.length ? MAX_TOOL_ITERATIONS : 1`.

So during those ten minutes the host authors a message at up to fifty boundaries, and
anything we want the session to see can ride the next one.

**`ClaudeAPIBackend`'s declared `inject: false` is what hid this.** Its own comment is
exactly right — *"There is no way to deliver text into a turn already in flight — a
stateless endpoint has no channel for it"* — and that is a statement about the
**stream**. Read as a statement about the **turn**, which is how every consumer has
read it, it is what produced the "nothing can reach her" premise and the
abort-then-resend design that followed from it. LF DOC-21 §6 needs the distinction:

- **no injection into a stream in flight** — true, and unfixable on a stateless wire;
- **injection between tool iterations** — free, and already crossed fifty times.

What that buys exactly: delivery bounded by **the session's next tool call**, which
during real work is frequent — every screenshot, every `set_l1`, every delegation
returning. What it does not buy: interruption mid-thought. A single long delegation
with no intervening call is a blind spot, and fifty iterations is a hard ceiling.

## What is already built

Measured against the code rather than recalled, because three of the four things this
design needs already exist and the fourth is smaller than it sounded.

| what | where | state |
|---|---|---|
| A per-request delivery channel past the whole history | `turnTail` (LF REQ-144), called inside **both** wires' `_callModel` — `claude_api.js`, `chatgpt.js` | **built** |
| An occupancy gauge that renders itself into the priming | `budgetProvider` (LF REQ-169), `defaults.js`; `occupancyTokens` + `contextWindow` put into the turn context at `manager.js:861` | **built, and deliberately not adopted for the consultant — see F2** |
| Per-request token accounting | LF REQ-143 `usage()`; `turnUsage` / `turnOccupancy`, the two folds of LF REQ-169 | **built** |
| Tool calls observable from outside, *before* they run | `toolIssueEvent` (LF REQ-175) and `toolEvent`, emitted as control-class events | **built, unconsumed here** |
| A client-side queue with pending bubbles and coalescing | upstream `webui-chat` — `queued[]`, `is-pending is-queued`, one batch per turn | **built upstream, no transport here** |
| A delta-over-a-cursor primitive, and its design argument | LF REQ-160 `session-delta.ts`; DOC-39 §5.1's rejection of a change-log ticket | **built for a different subject** |

`turnTail` is worth stating properly, because it is better than the thing this design
originally asked for. It appends the per-turn volatile tiers **past the entire message
history**, and its result is **never written back into `state.messages`**. Three
consequences, all of them wanted:

- **Ephemeral by construction.** On iteration 2 the iteration-1 tail is gone. A stale
  *"1 message queued"* is therefore impossible, and so is a signal replaying on a warm
  segment.
- **Cache-neutral.** It sits past the last breakpoint, so a counter that changes on
  every request re-prices nothing behind it. That was LF REQ-144's whole argument:
  *stable first, volatile last* over the request, which is the unit the cache matches.
- **One placement rule for both wires**, including the Anthropic requirement that tool
  results come at the head of the user turn — so a signal lands *after* the results it
  accompanies.

**And it is why annotating the `tool_result` — the obvious reading of "add small
packets to tool-use results" — is the wrong seam.** `wire.record(state, raw, outcomes)`
is what writes outcomes into `state.messages`. A packet put there becomes permanent
history and is re-sent on every later request of a warm segment. The ephemeral channel
already exists; the durable one is a trap.

## The four faults, precisely

### F1 — Cap exhaustion is silent, in all three currencies

Today, exhausting `maxIter` falls out of the `for` and yields `doneEvent`. The model is
mid-plan, the turn simply ends, and nobody — model, host or client — is told why. That
is the observed *"it stops without giving a report"*, and the operator's habitual remedy
(poke it to continue) is a workaround for a budget nobody published.

Two currencies are measured and the model is told neither:

- **iterations** — `iter` against `MAX_TOOL_ITERATIONS = 50`;
- **wall-clock** — `timeout = 600`, checked at the loop head and **thrown** as an
  error, which is an exception raised where a report was wanted;
This is the only fault that can be fixed **without the model's cooperation**, because
the host owns the cap. Everything else in this document is a packet the session may
ignore, and Finding 13 of [[EPIC-19]] measured priming constraints failing at 2-in-102.

### F2 — WITHDRAWN: the context gauge is not one of the faults

An earlier draft of this document made the missing context-occupancy gauge the second
fault and the first ticket — one line of `priming.json`, since `budgetProvider` (LF
REQ-169) is built and shipped and `priming.json` names it in `settings_reminders` but not
in `reminders`. The operator rejected it the day it was filed, and the objection holds:

> That is NOT the gauge we discussed — we talked about managing the number of tool
> iterations and feeding that back to whoever was making the calls in the results. We have
> technology for rolling the chat history window AND keeping two forms of summary, all of
> which is available in chunk level search to the AI — what would it do with its context
> size?

**Nothing.** The context window is a **host-managed** resource, and every mechanism that
manages it is shipped or decided: LF REQ-168 bounds a warm conversation and re-seeds a cold
one from a window, so the history rolls; [[REQ-283]] keeps two forms of memory — a bounded
standing frame rewritten in place, and an append-only ledger — so what must survive is
preserved deliberately rather than by luck; the ledger body is KB-indexed at chunk level,
so what falls out of the window is still reachable by search; and `_compactionDue` acts on
occupancy without consulting the model at all.

So there is **no cliff to steer away from**, and a percentage in front of the model buys no
decision. It does invite **false economy** — a session told it is at 60% skips a screenshot
it should take, to protect a resource it neither manages nor can release.

**And the failure this was sold as fixing has a different cause**, which is the reason the
mistake was easy to make. Finding 5 took the consultant's *"the turn simply ends […]
indistinguishable from having finished"* and attributed it to context exhaustion. The code
says otherwise: the silent-stop path in `runToolLoop` is **iteration-cap exhaustion**, with
the wall-clock timeout as the other exit. Neither is a context event. F1 is the real fault
and it was mis-attributed for a week.

**What survives.** For the model, the instrument is the **price of the call it is about to
make**, at the point of the call — [[REQ-284]] shipped that. For the host, it is the meter
on iterations and clock, which is F1. [[REQ-344]] is abandoned and occupancy is out of LF
REQ-181's scope for the same reason.

The numbering below is kept as filed rather than closed up, so that this rejection stays
legible instead of vanishing.

### F3 — Words typed during a turn are dropped, and the queue they belong in is upstream

`webui-chat` already holds a queue, paints pending bubbles, runs everything queued
during a turn **as one batch**, and rules that text queued while *this* turn runs
belongs to the next round. This repository has none of the transport, which is how
[[BUG-122]] happened — though BUG-122's own fault is narrower (the composer clears its
persisted draft at submit, before anything durable holds the text).

Upstream's **delivery point is wrong for us**: it delivers the batch after the turn, as
a new turn. A consultant would then announce a finished homepage into a room that
abandoned it four minutes ago. The queue has to reach her **before her report**.

### F4 — Nothing outside can see a turn working, and the room is inside a context

Two halves of one gap. The events for a progress surface already flow and nothing
consumes them here. And the shared record between the two models, as postulated in
Finding 14, would live inside the cheap model's conversation — see §4 of the design for
why that is the wrong container.

## The design

### 1. Two channels with different clocks

The volatile tail gains a second class. Standing guidance keeps the clock it has;
signals get a faster one.

| channel | assembled | contents | cost when quiet |
|---|---|---|---|
| `reminder` (today) | **once per turn**, by `assembleReminders` — providers, async, some reading the corpus | the role's standing guidance | n/a |
| `signals` (new) | **once per request**, from in-memory counters only — no providers, no I/O | queue count and cursor, budget warnings, live occupancy | **zero bytes** |

Both are delivered by `turnTail` on every request, and neither is written back.

An earlier draft of this design proposed making the reminder itself a per-request
thunk. That is wrong: running providers fifty times a turn is real waste for text that
cannot change mid-turn. Two channels, two clocks.

**On the cost of repeating the tail at all** — asked directly, and the answer is not
"it is cheap", it is "repetition and ephemerality are the same property". Because
nothing from `turnTail` is recorded, the choice is not *resend or send once*, it is
**resend or absent**. Measured: the consultant's nine reminder entries are **739
characters, ≈184 tokens** (the settings assistant's five are 379; the builder's four
are 467). At fifty iterations that is ≈9k uncached input tokens per turn, and it buys
the only channel into a turn that exists. `systemBlock` already drops empty parts
without even a separator, so a turn with nothing queued and no warning due appends
nothing at all.

The figure worth measuring and **not yet measured** is `volatile` — the session summary
rides the same tail on every request and is larger than the reminder.

### 2. The loop publishes its budget, and exhaustion becomes an instruction

Warnings into the signals channel at **75%** and **90%** of each currency, and a
**countdown from 95%** — and the half that matters most: **the final iteration says so.**
A turn that has run out of iterations or clock is told, in the request that carries its
last call, to stop working and post its report. Exhaustion stops being a silent
`doneEvent` and becomes a delivered instruction.

The wall-clock path additionally stops *throwing*: an exception is the wrong shape for
"your time is up, write it up".

### 3. One cursor, two uses

*"Notify me that something arrived"* and *"let me read another participant's room"* are
two cursors over one operation, which is LF REQ-160's design already:

- the **notification** carries a **count and a cursor** and never the content —
  DOC-39 §5.1's rule, *"a map is a description, not a notification"*;
- the **pull** is what spends context, and spending it is the session's own choice.

So the operator's "a hook for notifications" and "a tool to fetch queued messages" are
**two halves of a single primitive**, not two features: the packet says *2 new, from
cursor 41*; `pull(41)` returns them.

Two properties inherited from LF REQ-160 and REQ-154 §3 respectively: a `pass` must not
advance the pointer, so *"nothing from me"* costs the other members no context; and
REQ-160's known weakness (reliably additive, unreliably subtractive) does not bite,
because a chat room is append-only.

### 4. The room is a cursor over the durable transcript, not the cheap model's context

Finding 14 postulated the shared record living inside the cheap model's conversation
(it holds the transcript; the consultant posts into it). Setting aside implementation,
that loses on four counts and the first is decisive.

1. **Compaction is a property of a context, so a room inside one inherits it.** That
   container would hold two things with different lifetimes — the shared record, and the
   cheap model's private working state. When it compacts under *its own* context
   pressure, the shared record is summarised away by an operation that has nothing to do
   with the record's value.
2. **A restart truncates it silently.** LF REQ-168 bounds a warm API conversation and
   re-seeds a cold one from a **window**, so a room-inside-a-context survives a process
   restart only as far back as the window reaches. A room that *is* the chat ticket
   transcript is durable by construction and already carries the ledger.
3. **The chair would own the medium.** REQ-154 §3's rule is that a chair holds no
   domain; a chair that also *is* the transcript is a lossy relay, and every question
   about what the client actually said becomes a question about its summarising.
4. **Read rates are wildly asymmetric and a cursor is what absorbs that.** The
   consultant's turns are ten minutes, the cheap model's about a second, the client's
   irregular. A cursor lets each read at its own rate — and lets the consultant read
   **mid-turn**, which is §1–§3 of this design exactly. Inside someone's context there is
   no cursor to be at.

**The client is already a reader of this kind:** the browser scrolls a durable
transcript it does not own. Putting the agents' room inside one agent's context would
make the two halves of the product disagree about what the room is.

What it costs, honestly:

- **Coherence stops being free.** A member who only pulls deltas has no standing summary
  of the engagement, which a member holding the whole conversation gets for nothing. So
  this **requires the standing frame** — [[REQ-283]] item 2, already decided as
  `fields.frame` on the chat ticket. No standing frame, no room.
- **Latency for the fast member.** If the cheap model must `pull` before answering, its
  one-second turn pays a round trip first. Ownership and delivery are separable:
  **push the delta to the cheap fast member, notify-and-pull for the expensive slow
  one.** Its context is small and the delta is small, so pushing costs nothing; the
  consultant is the only member for whom a pull is a real decision.

That asymmetry is why this takes the generalised group component's **conclusions**
rather than its code — it models turn-order, nomination, membership and rounds over an
arbitrary roster, and this is three fixed participants, one of whom is a human who
talks whenever he likes.

## Why this order

**The one-line fix first, then the channel, then everything that rides it.**

Naming the gauge in the consultant's reminders (F2's first half) depends on nothing,
costs one line of configuration, and closes the quote that opened Finding 5. It ships
before any of the mechanism.

The signals channel is next because every other item is a producer for it. Then the
budget, because it is the only item that works without the model's cooperation — a host
that can say *"this is your last call"* fixes the silent-truncation failure whether or
not the session behaves well, while every queue-shaped item can be ignored.

The room is last and **gated**, on [[REQ-283]] and on a design note of its own. It is
the largest item here and the only one whose shape is still argued rather than settled.

## What this design is not

- **Not interruption mid-thought.** Delivery is bounded by the next tool call. A long
  delegation with no intervening call is unreachable, and fifty iterations is a ceiling.
- **Not a new transport.** Both wires already call `turnTail` per request. This widens
  what may be put in it; it does not add a channel.
- **Not annotation of tool results.** That seam writes into durable history — §"What is
  already built" says why it is a trap.
- **Not a change to what is recorded.** Signals are ephemeral: nothing in this design is
  written back into `state.messages`, and the transcript carries none of it.
- **Not a raise of `MAX_TOOL_ITERATIONS`.** The cap is not the fault; its silence is.
  The number may turn out to be wrong, but that will be an evidenced change and not this
  one.
- **Not the group-chat component.** §4 takes its conclusions and not its code.

## How we will know it worked

- **Turns that end at the cap without a report** — today the exhaustion path emits
  nothing at all; target zero, and observable rather than inferred.
- **Turns the operator has to poke to completion.** The habit is the measurement.
- **Words typed during a turn that never reach the session** — today all of them.
- **Screenshots per turn against reported occupancy.** F2's whole claim is that a
  visible gauge changes the choice at the moment of choosing; if it does not, the gauge
  is not the instrument we thought it was.
- **Client-visible agent-to-agent exchanges per client message.** The loop hazard of
  Finding 14.9 is that two agents that can wake each other have no stopping point; a
  room that raises this number in front of a waiting client has failed regardless of how
  elegant the cursor is.

## The tickets

Seven, split by repository, and the seams are chosen so nothing cheap waits behind
anything expensive.

**This document** — the design. No code.

**~~1 · The consultant is told how full its context is~~** — **withdrawn**, see F2.
[[REQ-344]] is abandoned, and the one-line configuration change is not made.

**2 · Upstream — the per-request signals channel, and the capability that says so**
*(`lagrange-framework`)*. A second volatile channel beside `reminder`/`volatile`,
assembled per request from in-memory state, delivered by `turnTail`, never recorded;
plus the `inject` capability split and the LF DOC-21 §6 / DOC-22 wording that follows
from it. Everything below depends on it.

**3 · Upstream — the tool loop meters itself and says so** *(blocked on 2)*. Iterations,
wall-clock and live occupancy through the signals channel at 75/90% with a countdown
from 95%; exhaustion delivered as an instruction; the timeout path stops throwing.

**4 · Upstream — one cursor, two uses** *(blocked on 2)*. `pull(since)` over a
transcript, where "queued for me" and "another member's room" are two cursors on one
operation, and the notification carries a count and a cursor only.

**5 · Words typed during a turn reach the consultant before her report** *(ours, blocked
on 2 and 4)*. The transport under `webui-chat`'s existing queue, delivered mid-turn
rather than as a new turn afterwards.

**6 · Both workers are visible while they work, and only one is worth interrupting**
*(ours, blocked on 3 for its denominator)*. Consume `toolIssueEvent` / `toolEvent`;
activity indicator for both; interrupt meaningful only for the expensive one.

**7 · Upstream — the room is a cursor over a durable transcript** *(gated)*. §4. Design
note first, and held on [[REQ-283]]'s standing frame.

Kept separate on purpose: 3 and 4 both add producers to the channel from 2 and could be
one ticket, but 3 works without the model's cooperation and 4 does not — folding them
together would block the fix that needs no goodwill behind the one that does.


## Filed (2026-09-28)

Seven work tickets, as laid out above. This document plus those seven is the whole of the
planned work.

| # | ticket | repo | state |
|---|---|---|---|
| 1 | ~~**REQ-344**~~ — the consultant is told how full its context is | 1stcontact | **abandoned 2026-09-28** — see F2 |
| 2 | **LF REQ-180** — a working turn can be reached between its tool calls: the per-request signals channel, and the capability that says so | lagrange-framework | filed, unblocked |
| 3 | **LF REQ-181** — the tool loop meters itself and says so: exhaustion becomes an instruction, not silence | lagrange-framework | filed, blocked on LF REQ-180 |
| 4 | **LF REQ-182** — one cursor, two uses: a member is notified of a count and pulls the content | lagrange-framework | filed, blocked on LF REQ-180 |
| 5 | **REQ-345** — words typed during a turn reach the consultant before her report | 1stcontact | filed, blocked on LF REQ-180 + LF REQ-182 |
| 6 | **REQ-346** — both workers are visible while they work, and only one is worth interrupting | 1stcontact | filed, blocked on LF REQ-181 |
| 7 | **LF REQ-183** — the room is a cursor over a durable transcript, not a member's context | lagrange-framework | filed, **gated** on LF REQ-182 and [[REQ-283]]; design note first |

Order: **LF REQ-180** first (everything else is a producer for it) → **LF REQ-181**
(the half that needs no cooperation from the model) → **LF REQ-182** → **REQ-345** →
**REQ-346** → **LF REQ-183**.

### Two things deliberately not filed

- **A context-occupancy gauge for the consultant.** F2 says why, and [[REQ-344]] carries
  the argument at length. The window is host-managed; the model-facing instrument is the
  price of the next call, already shipped.
- **A raise of `MAX_TOOL_ITERATIONS`.** §"What this design is not" says why: the cap is
  not the fault, its silence is. If 50 turns out to be wrong it returns as an evidenced
  change.
- **The standing frame.** It is [[REQ-283]] item 2, already decided as `fields.frame` on
  the chat ticket, and re-filing it would duplicate a live ticket. LF REQ-183 names it as
  a gate instead.

### One measurement still owed

The `volatile` tier — the session summary — rides the same per-request tail as the
reminder and is larger than it. The reminder is measured (739 characters, ≈184 tokens for
the consultant); `volatile` is not. Whoever picks up LF REQ-180 should measure it, because
if it is large then the per-request tail, not the signals on it, is where the turn's
uncached spend actually goes.