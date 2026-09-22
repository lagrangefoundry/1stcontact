---
uid: request-3a7beaa8
id: REQ-296
type: request
title: Do not let a turn overflow its context
created_by: EPIC-20
created_at: '2026-09-21T23:44:20.046378+00:00'
updated_at: '2026-09-21T23:44:20.046378+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-21653830
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