---
uid: request-3a7beaa8
id: REQ-296
type: request
title: Do not let a turn overflow its context
created_by: EPIC-20
created_at: '2026-09-21T23:44:20.046378+00:00'
updated_at: '2026-09-22T02:02:56.435787+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-21653830
  commits:
  - working_sha: 80fd5d224b5cd6cc401ca7d8088e6207a2ed35c4
    reconcile_sha: null
    main_sha: null
  version: 0.2.317
  story_points: 8
---

## Why, and why now

A session's context can grow without limit inside a single turn, nothing
compacts it, and nothing can see it coming. The measured Lagrange Foundry build
(EPIC-20) reached **~300k tokens resident** on a 1M-token model. It did not
overflow. A worker on `claude-haiku-4-5` — 200k — would have, and REQ-295 is
about to start opening those.

Four facts, checked against the installed shared store:

1. **A single exchange is deliberately unbounded.** `recentExchanges` keeps *at
   least one whole exchange, whatever its size*, because a cut inside one
   orphans a `tool_result` and the API rejects that. So the 40-exchange window
   bounds growth **across** turns and declines to bound a turn.
2. **The only bound on a turn is a count, not a size.** `MAX_TOOL_ITERATIONS =
   50` caps iterations, and an iteration may carry several parallel calls — the
   measured session had a turn of 55 tool calls. Fifty iterations of results
   that each happen to be large is exactly the overflow this ticket is about,
   and the counter cannot tell a 200-byte result from a 200-kilobyte one.
3. **Nothing compacts on the API path.** `_compactionDue` returns false unless
   the backend declares the `compaction` capability, and only the Claude Code
   CLI adapter does. The API backends hold no conversation of their own.
4. **`contextWindow` is not configured.** `backends.json` names `model` and
   `max_tokens` and nothing else, so the manager reads the window as `0` and
   cannot compute fullness even when asked.

The consequence is that overflow arrives as a provider error mid-turn, after the
tokens are spent, with the turn's work unlanded.

## What this ticket does

### Declare the window

`contextWindow` joins `model` and `max_tokens` in `backends.json`, per backend
entry — 1M for `claude-opus-5`, 200k for a Haiku worker. It is the consumer's
configuration for the reason BUG-49 gives, and a window nobody declared is the
reason the gauge below reads zero today.

### Show the model how full it is

Wire REQ-169's `budgetProvider` (`session.budget`) into this project's priming.
It renders occupancy, window, percent and remaining, and is **delivered in the
seed every turn** on REQ-131's argument: the turns a model would skip a
status-checking tool call on are the long ones, which are exactly the turns
where the number matters.

**It must ride in the per-turn tail, past the message history** (REQ-144), never
in the cached prefix. A figure that changes every turn, written into `system`,
would invalidate the whole prefix on every turn — precisely the defect REQ-144
exists to have fixed, and re-introducing it here would cost more than the
overflow does.

### Give the model somewhere to put what it must drop

Wire `TOOL_TRANSCRIPT_NOTE_PROVIDER`, the pointer that lets a session address its
own tool transcript by turn id. A gauge that says "you are nearly full" without a
way back to what fell out is a warning the model cannot act on. The other two
halves already exist and are in use: the ledger's standing note and decision
entries (REQ-283), delivered back into the seed each turn, and chunk-based
search over past conversation through the knowledge base.

### Refuse before the provider does

A host-side guard on **measured occupancy**, not on a call count. When the next
request's input would exceed a configured fraction of the declared window, the
tool loop stops and the turn ends with a terminal event naming the reason, so
the session can report what it did and the client sees a turn that finished
rather than a turn that broke.

This is the load-bearing half. The gauge asks the model to behave; the guard
holds when it does not.

## What must be true when this is done

1. Every backend entry declares a `contextWindow`, and the manager reports a
   non-zero window for a session on it.
2. The model is shown occupancy, window, percent and remaining, every turn.
3. That figure is in the per-turn tail: two consecutive turns whose gauge differs
   still read a cached prefix covering the first turn's history.
4. A turn whose next request would exceed the configured fraction of the window
   ends with a terminal event naming the reason, rather than raising a provider
   error — and the work already done in that turn is recorded.
5. The spend of a turn stopped this way is still recorded (REQ-292), because a
   turn that was cut off is exactly the turn whose cost someone will ask about.
6. A session may address its own tool transcript by turn id.
7. A worker session on a smaller window is guarded against **its own** window,
   not the caller's.

## Not in scope

Semantic compaction on the API path — a larger piece of work, and this ticket is
about not falling over. Any change to `MAX_TOOL_ITERATIONS`, which bounds a
different failure. Caps on customer usage, which are about money rather than
about tokens and are discussed in EPIC-20 unbuilt.


---

## As built

The four pieces above are all present. Three of them landed in a different shape
than the wording above describes, and one grew a part that was not asked for
directly but is a consequence of the rest. Recorded here rather than left for
reconciliation to discover.

### The window is resolved from the model, not declared beside it

The section above says `contextWindow` joins `model` and `max_tokens` in
`backends.json`, per backend entry. It does not, and it must not. The installed
framework resolves a backend's window **from the model that came out of the
settings merge**, through its own model → window table, and refuses
`context_window` in its own shipped defaults for a reason this project inherits:
settings merge per key, so a window written beside `model` outlives the next
change of `model` and hands a session the denominator of a model it is not
running — silently, and forever. A wrong denominator is worse than none: a
session told it is at 60% when it is at 12% spends conservatively for nothing,
and the reverse gets it truncated while believing it has room.

Both models this project names are in that table, so both windows resolve today
and nothing had to be declared. **What was actually missing was the alarm.**
Nothing noticed if a window did not resolve: a model the table does not name
gives a session no gauge (the provider renders the figure and declines to give a
proportion) and no guard (a ceiling of zero reads as "unguardable"). Both would
have degraded in silence, on the one edit — a model ID — most likely to cause it.

So `configureProjectBackends` now checks every entry of `backends.json` resolves
a non-zero window and raises the framework's own `BackendConfigError` naming the
offending entry and its model if one does not. Raised at host build, beside the
rejections `configureBackends` already makes, so a misconfiguration costs a
start-up rather than a conversation. The escape hatch is the one the framework
documents: declare `context_window` on that entry, which is the one case that key
exists for.

### The guard's reason is named twice, because the manager carries one key and not the other

The in-turn guard closes the turn with the adapter's own terminal event, carrying
`interrupted`, a `stop_reason`, and the turn's spend. The session manager does
not forward `stop_reason`: it reads `interrupted`, `occupancy_tokens` and the
spend keys off that meta and emits a terminal event of its own. That is the right
boundary for the framework — an adapter's private vocabulary is not the session
model's — and it means the reason has to be re-stated above the manager for the
client to read one.

So the host names it: a turn the manager closed `aborted` whose last measured
request was at or over the ceiling is this guard's stop and cannot be anything
else. The occupancy is re-measured from the terminal event's own `requests` list,
which the manager does forward, so the derivation is exact rather than probable.
The pre-turn refusal names the same reason directly, because that event is the
host's own. **One reason for both halves**: a client reads one outcome whichever
moment the refusal came at, because the distinction between them is ours and not
its.

### The tool-transcript pointer needed a reader, so the ledger gained one read

`TOOL_TRANSCRIPT_NOTE_PROVIDER` was previously declined on its merits — by
binding no reader — because nothing this host granted could open the persisted
tool record stream, and pointing a session at an artifact it cannot open is a
hand-written claim about a tool it has not got. Wiring the pointer therefore
required building the reader.

`read_work_log` joins the ledger surface (`surface_version` 2 → 3, new group
`ReadWorkLog`). It joined the ledger rather than arriving as a fourth surface
because it is the same session's own record on the same `chat` ticket; a surface
of its own would have been a declaration, a toolbox and a grant for one read. It
is the only operation on that surface that does not write, and it answers from
the archive's own artifact — the same reader the pointer is bound to — so a call
recorded by the drain is readable on the next turn without the surface being told
about it.

**Two depths, not one.** Name no turn and the answer is an index: one line per
recorded call, naming its turn and what it was called on, most recent kept when
it will not fit and the cut stated rather than silent. Name a turn and the answer
is that turn's calls in full, shortened at the end with the framework's own
elision marker if it exceeds the answer cap. Answering the whole artifact to
every call would put a quarter of a megabyte in front of the session least able
to hold it. Two declared refusals: `NO_WORK_LOG` when the session has recorded no
call, `UNKNOWN_TURN` when no record belongs to the named turn — a refusal rather
than an empty answer, which would read like a session with no history.

### How full the conversation is, kept on the `chat` ticket

The gauge is the framework's provider, in the framework's position, with one
field replaced. The framework measures occupancy off the provider's counters and
hands it to the next turn as a field on the manager's **in-memory** session; this
Worker rebuilds the manager per request and resumes the session from the archive,
so that field is zero on every turn, the gauge renders nothing, and a guard
reading it would never fire. Nothing upstream is broken; nothing on this host can
see it.

So the host keeps the figure durably: one integer, `occupancy_tokens`, on the
session's own `chat` ticket, beside `pending_turn` and `kb_cursor`, whose shape it
follows. Written as the turn closes, in the same block the meter is written from
and off the same terminal event; a turn that measured nothing leaves the last real
figure standing rather than blanking it. This is not what `0019_turn_spend.sql`
ruled out — that argument is about spend, which is billed from and is not part of
the engagement. The four counters still go to `turn_spend`, retained and priced,
exactly as before. Both readers — the gauge the session is shown and the pre-turn
refusal — read this one figure, which is what stops the warning and the guard
disagreeing about how full the conversation is.

### The refusal is honest about what it is not

The ceiling is 0.9 of the *room* a request has — the window less the reply's
ceiling, because the provider refuses a request whose input plus `max_tokens`
exceeds the window. The remaining tenth is the growth between the measurement and
the request it is used to judge. **It is not a proof.** A single tool result
larger than that slack can still overflow the request that carries it, because
tool output is unbounded in the live stream and only the persisted copy is capped.
What the guard removes is the failure that was certain — fifty iterations walking
off the end of the window — not every failure that is possible.

A backend that resolves no window reads as a ceiling of zero, which means "do not
guard" rather than "no room": a session on it runs exactly as it did before this
ticket rather than being refused on the strength of a denominator nobody has.

### Existing suites this changed the answer for

Four assertions elsewhere were true before this ticket and are not after it.
Repaired in place:

- **BUG-67** asserted `backendSettings('claude')` equals exactly `{model,
  maxTokens}`. The installed framework now resolves a third key, `contextWindow`,
  which is precisely what this ticket depends on. Asserted per key from here on,
  so a fourth resolved fact is an addition rather than a failure. The same suite
  asserted a backend name the framework does not ship is refused at install; it no
  longer is, and this repository is the reason — `claude_builder` is a variant of
  the same adapter registered by this host. The safeguard stayed where it lives,
  on the keys, so the case now asserts that.
- **REQ-171** asserted the ledger surface declares exactly three operations. It
  declares four.
- **REQ-239** and **REQ-284** build a provider registry by hand and load the
  settings role against it. That role's tail now names an upstream provider, so a
  registry holding only this project's bindings can no longer load it; both now
  register the framework's defaults first and this project's on top, which is the
  order `host-core.ts` itself uses and matters because this project's memory
  bindings deliberately replace three of the framework's.

## Evidence

`tests/test_UAT_FC_REQ-296_context_budget.workers.test.ts` — seven cases, each
driving the real route inside workerd: `POST /api/ai/prompt`, the real session
manager, the real priming assembly out of the shared store, the real tool loop,
the real API adapter and its real per-request usage accumulator, a real D1
holding the `chat` ticket and the `turn_spend` table. The one double is the
Anthropic client, which is the network, and it is the shared one — which is also
the instrument: a scripted reply reporting 900,000 input tokens is a conversation
that genuinely measures 900,000 as far as every line of code under test can tell.
Nothing asserts on a character count, because nothing in the implementation reads
one.

1. every entry of `backends.json` resolves a window equal to its own model's, and
   an entry naming a model the table does not carry is refused with a message
   naming both;
2. the gauge names occupancy, window, percent and remaining; the first turn of a
   conversation shows none, because nothing has been measured yet; the figure
   moves with the conversation across three turns, which is only possible because
   the host wrote it down;
3. two turns whose gauge differs send a byte-identical cached prefix, and the
   figure is absent from `system` on both;
4. a turn measured over the ceiling sends exactly one request — the second is
   never built — ends on a terminal event naming `context_budget` with status
   `aborted`, tells the client why in the session's place, and leaves the call it
   did make in the durable work log;
5. that turn's spend is metered: one row, one request, the tokens it carried,
   outcome `aborted`;
6. the next turn of that same conversation is refused before the provider — zero
   requests sent — and its prompt survives on the pending record for a fresh
   conversation to carry; nothing is metered for a turn that never ran;
7. a session reads its own work log: the index names its turns, one turn opens in
   full with the input each call was given, and a turn the log does not hold is the
   declared `UNKNOWN_TURN` refusal;
8. a worker is stopped after one request against its own smaller ceiling while the
   caller — whose own ceiling that measurement is comfortably under — carries on,
   is handed the delegation's result, and answers its client.